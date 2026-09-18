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

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, updateAccessToken, clearSession } =
    useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh failed — wipe session so user goes back to login
      clearSession();
      return null;
    }

    const data = await res.json();
    updateAccessToken(data.accessToken);

    if (data.refreshToken) {
      useAuthStore.setState({ refreshToken: data.refreshToken });
    }
    return data.accessToken as string;
  } catch {
    clearSession();
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
      console.log(`[API_ERROR] [${res.status}] ${method} ${path}`, errBody);
      // Handle both flat { code, message } and nested { error: { code, message } }
      const errObj: ApiError = errBody?.error ?? errBody;
      errorCode = errObj?.code ?? errorCode;
      errorMessage = errObj?.message ?? errorMessage;
    } catch {
      /* ignore parse errors */
      console.log(`[API_ERROR] [${res.status}] ${method} ${path} (Failed to parse JSON body)`);
    }
    throw new ApiException(res.status, errorCode, errorMessage);
  }

  // 204 No Content
  if (res.status === 204) {
    console.log(`[API_RESPONSE] [204] ${method} ${path}`);
    return undefined as T;
  }

  const responseBody = await res.json();
  console.log(`[API_RESPONSE] [${res.status}] ${method} ${path}`, JSON.stringify(responseBody, null, 2));
  
  return responseBody as T;
}
