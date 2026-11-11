import { API_BASE_URL } from "@/shared/constants/config";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  bumpSessionGeneration,
  getCurrentSessionGeneration,
} from "@/core/lib/session";
import { performTerminalTeardown } from "@/core/lib/sessionTeardown";

// Re-exported for existing callers.
export { bumpSessionGeneration, getCurrentSessionGeneration };

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip attaching Authorization header (e.g. login/refresh endpoints) */
  skipAuth?: boolean;
  /** Abort the request after this many ms (default 20 s). */
  timeoutMs?: number;
  /** External cancellation (e.g. React Query's `signal`). */
  signal?: AbortSignal;
}

interface ApiError {
  code: string;
  message: string;
}

export class ApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiException";
  }
}

/** Thrown when the request never got an HTTP response (offline, DNS, timeout). */
export class NetworkException extends Error {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "NetworkException";
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;

/** fetch() with a timeout and optional external abort signal. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (externalSignal?.aborted) throw err; // caller cancelled — propagate as-is
    throw new NetworkException(
      controller.signal.aborted ? "Request timed out" : "Network request failed"
    );
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

// ── Token refresh ──────────────────────────────────────────────────────────────

/**
 * Outcome of a refresh attempt:
 *  - ok         → new access token issued for the *same* session
 *  - rejected   → server definitively rejected the refresh token (400/401/403);
 *                 the session has been cleared
 *  - temporary  → 5xx / 429 / network / timeout; session is left intact so the
 *                 caller can retry later
 *  - stale      → the session changed (logout / account switch) while the
 *                 refresh was in flight; the result was discarded and nothing
 *                 was touched
 */
export type RefreshOutcome =
  | { kind: "ok"; accessToken: string }
  | { kind: "rejected" }
  | { kind: "temporary" }
  | { kind: "stale" };

// Single shared in-flight refresh, scoped to the session generation that
// started it. A caller from a newer session never joins an older session's
// refresh (which would be using the previous account's refresh token).
let inflight: { generation: number; promise: Promise<RefreshOutcome> } | null =
  null;

export function refreshSession(): Promise<RefreshOutcome> {
  const generation = getCurrentSessionGeneration();
  if (inflight && inflight.generation === generation) return inflight.promise;

  const promise = _doRefresh(generation).finally(() => {
    if (inflight?.promise === promise) inflight = null;
  });
  inflight = { generation, promise };
  return promise;
}

/** Back-compat helper: resolves to the new access token or null. */
export async function refreshAccessToken(): Promise<string | null> {
  const outcome = await refreshSession();
  return outcome.kind === "ok" ? outcome.accessToken : null;
}

async function _doRefresh(generationAtStart: number): Promise<RefreshOutcome> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return { kind: "rejected" };

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      },
      DEFAULT_TIMEOUT_MS
    );
  } catch {
    // Offline / timeout — never clear the session for this.
    if (getCurrentSessionGeneration() !== generationAtStart) return { kind: "stale" };
    return { kind: "temporary" };
  }

  // ── Initiating-session check — applies to BOTH success and failure ──────
  // A delayed response belonging to account A must never clear or overwrite
  // account B's newer login.
  if (getCurrentSessionGeneration() !== generationAtStart) return { kind: "stale" };

  if (!res.ok) {
    // Only an explicit credential rejection ends the session. 5xx, 429,
    // 408 etc. are temporary server conditions — keep the user signed in.
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      void performTerminalTeardown();
      return { kind: "rejected" };
    }
    return { kind: "temporary" };
  }

  let data: { accessToken?: string; refreshToken?: string };
  try {
    data = await res.json();
  } catch {
    return { kind: "temporary" };
  }

  // Re-check after the body read (another await point).
  if (getCurrentSessionGeneration() !== generationAtStart) return { kind: "stale" };
  if (!data.accessToken) return { kind: "temporary" };

  const { refreshToken: currentRefresh } = useAuthStore.getState();
  useAuthStore.setState({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? currentRefresh,
  });
  return { kind: "ok", accessToken: data.accessToken };
}

// ── Request helper ─────────────────────────────────────────────────────────────

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    skipAuth = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  const makeRequest = (token?: string | null): Promise<Response> => {
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (!skipAuth && token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
    return fetchWithTimeout(
      `${API_BASE_URL}${path}`,
      {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      },
      timeoutMs,
      signal
    );
  };

  const generationAtStart = getCurrentSessionGeneration();
  const { accessToken } = useAuthStore.getState();
  let res = await makeRequest(accessToken);

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    // Discard a stale original 401 before starting a refresh for the current session:
    // If the session changed while the initial request was in flight, do not refresh under the new session.
    if (getCurrentSessionGeneration() !== generationAtStart) {
      throw new ApiException(401, "AUTH_SESSION_EXPIRED", "Session expired.");
    }
    const outcome = await refreshSession();
    if (outcome.kind === "ok" && getCurrentSessionGeneration() === generationAtStart) {
      res = await makeRequest(outcome.accessToken);
    } else if (outcome.kind === "temporary") {
      // Couldn't refresh right now (server/network) — surface as a
      // recoverable network error rather than an auth failure.
      throw new NetworkException("Couldn't refresh your session. Try again.");
    } else if (outcome.kind === "rejected") {
      void performTerminalTeardown();
      throw new ApiException(401, "AUTH_CREDENTIALS_REJECTED", "Your session has expired. Please sign in again.");
    } else {
      throw new ApiException(401, "AUTH_SESSION_EXPIRED", "Session expired.");
    }
  }

  if (!res.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      // Handle both flat { code, message } and nested { error: { code, message } }
      const errObj: ApiError = errBody?.error ?? errBody;
      errorCode = errObj?.code ?? errorCode;
      errorMessage = errObj?.message ?? errorMessage;
    } catch {
      /* ignore parse errors */
    }
    // Log only method/path/status/code — never bodies (may contain tokens or PII).
    if (__DEV__) {
      console.warn(`[API_ERROR] [${res.status}] ${method} ${path} ${errorCode}`);
    }
    throw new ApiException(res.status, errorCode, errorMessage);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
