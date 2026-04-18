import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  isRetry?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { refreshToken, setAccessToken, clear } = useAuthStore.getState();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${env.apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await clear();
        return null;
      }
      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) {
        await clear();
        return null;
      }
      await setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// Intentionally resembles fetch(): pass a path (relative to env.apiUrl) plus
// standard RequestInit. Returns parsed JSON or throws ApiError.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, isRetry, headers, ...rest } = options;
  const { accessToken } = useAuthStore.getState();
  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(rest.body && !(rest.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(headers as Record<string, string> | undefined),
  };
  if (!skipAuth && accessToken) {
    mergedHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const url = path.startsWith('http') ? path : `${env.apiUrl}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: mergedHeaders });
  } catch (err) {
    throw new ApiError(0, `Network error: ${String(err)}`, null);
  }

  // Check status BEFORE parsing — rate limit / 5xx responses are often plain
  // text, and .json() would throw over the real error.
  if (res.status === 401 && !skipAuth && !isRetry) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      return apiFetch<T>(path, { ...options, isRetry: true });
    }
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : res.statusText || `HTTP ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
