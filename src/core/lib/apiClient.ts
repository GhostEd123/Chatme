import { API_BASE_URL } from "@/shared/constants/config";
import { useAuthStore } from "@/features/auth/store/authStore";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip attaching Authorization header (e.g. login/refresh endpoints) */
  skipAuth?: boolean;
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

// ── Session generation guard ────────────────────────────────────────────────────
// Incremented on every logout / clearSession so any in-flight refresh that
// completes after a new session has started discards its result.
let sessionGeneration = 0;

export function bumpSessionGeneration(): void {
  sessionGeneration += 1;
}

export function getCurrentSessionGeneration(): number {
  return sessionGeneration;
}

// ── Single shared refresh promise ──────────────────────────────────────────────
// All concurrent 401 callers await the same promise so only one refresh fetch
// goes out (important when the server rotates refresh tokens).
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in flight, return the same promise.
  if (refreshPromise) return refreshPromise;

  refreshPromise = _doRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function _doRefresh(): Promise<string | null> {
  const { refreshToken, updateAccessToken, clearSession } =
    useAuthStore.getState();
  if (!refreshToken) return null;

  // Capture the generation before the async work so we can detect a
  // concurrent logout that happened while we were waiting.
  const generationAtStart = sessionGeneration;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Definitive auth failure — wipe session so user goes back to login.
      clearSession();
      return null;
    }

    // If a logout happened while we were waiting, discard the result.
    if (sessionGeneration !== generationAtStart) return null;

    const data = await res.json();
    updateAccessToken(data.accessToken);

    if (data.refreshToken) {
      useAuthStore.setState({ refreshToken: data.refreshToken });
    }
    return data.accessToken as string;
  } catch {
    // Network / parse error — do NOT clear the session; the user may just
    // be offline temporarily. Clearing here would log them out on flaky
    // connections. Only a definitive non-ok response from the server
    // warrants a session wipe (handled above).
    return null;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, skipAuth = false } = options;

  const makeRequest = async (token?: string | null): Promise<Response> => {
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (!skipAuth && token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const { accessToken } = useAuthStore.getState();
  let res = await makeRequest(accessToken);

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await makeRequest(newToken);
    }
  }

  if (!res.ok) {
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      // Redact any token values before logging
      const safeBody = { ...errBody };
      if (safeBody.accessToken) safeBody.accessToken = "[REDACTED]";
      if (safeBody.refreshToken) safeBody.refreshToken = "[REDACTED]";
      console.error(`[API_ERROR] [${res.status}] ${method} ${path}`, safeBody);
      // Handle both flat { code, message } and nested { error: { code, message } }
      const errObj: ApiError = errBody?.error ?? errBody;
      errorCode = errObj?.code ?? errorCode;
      errorMessage = errObj?.message ?? errorMessage;
    } catch {
      /* ignore parse errors */
      console.error(`[API_ERROR] [${res.status}] ${method} ${path} (Failed to parse JSON body)`);
    }
    throw new ApiException(res.status, errorCode, errorMessage);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const responseBody = await res.json();
  return responseBody as T;
}
