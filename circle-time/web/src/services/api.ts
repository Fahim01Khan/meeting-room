// Base API configuration and utilities

const API_BASE_URL = "/api";

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface ApiError {
  message: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Token helpers – stored in localStorage so they survive page reloads
// ---------------------------------------------------------------------------

const TOKEN_KEY = "ct_access";
const REFRESH_KEY = "ct_refresh";

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

export const getAccessToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_KEY);

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isLoggedIn = (): boolean => !!getAccessToken();

// ---------------------------------------------------------------------------
// Cached user (persisted in localStorage so role checks work immediately)
// ---------------------------------------------------------------------------

const USER_KEY = "ct_user";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
}

export const setUser = (user: StoredUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): StoredUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle non-JSON responses (e.g. CSV export)
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      return {
        success: false,
        data: null as unknown as T,
        message: res.statusText,
      };
    }
    // Return the raw response stashed in `data` for blob/text consumers
    return { success: true, data: res as unknown as T };
  }

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    const msg = json.message || `Request failed (${res.status})`;
    throw new ApiClientError(msg, res.status);
  }

  return json;
}

export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Public API client
// ---------------------------------------------------------------------------

export const apiClient = {
  get<T>(endpoint: string) {
    return request<T>("GET", endpoint);
  },
  post<T>(endpoint: string, body?: unknown) {
    return request<T>("POST", endpoint, body);
  },
  put<T>(endpoint: string, body?: unknown) {
    return request<T>("PUT", endpoint, body);
  },
  delete<T>(endpoint: string) {
    return request<T>("DELETE", endpoint);
  },
};

export const handleApiError = (error: ApiError): string => {
  return error.message || "An unexpected error occurred";
};

export type { ApiResponse, ApiError };
