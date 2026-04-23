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
  // T328 (Build 26): explicit opt-out of the JSON Content-Type default. The
  // old `body instanceof FormData` check works in dev (Metro JS engine) but
  // fails under Hermes prod bytecode — class identity gets minified/polyfill-
  // swapped, the check returns false, we set Content-Type=application/json
  // on a multipart body, and multer drops the body as not-multipart (→ 400
  // in <2ms because it never read the stream). Callers like `apiClient.upload`
  // pass `skipJsonContentType: true` so the header branch never fires for
  // multipart, regardless of runtime FormData identity.
  skipJsonContentType?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const { refreshToken, setTokens, clear } = useAuthStore.getState();
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
      // T403 (Sprint 63 hotfix) — BE rotates refreshToken on every call
      // (AuthService.refresh: revoke old, issue new). Persist both or the
      // next refresh fires with a revoked token → 401 → forced logout after
      // ~30 min of app use.
      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken) {
        await clear();
        return null;
      }
      await setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
      });
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
  const { skipAuth, isRetry, skipJsonContentType, headers, ...rest } = options;
  const { accessToken } = useAuthStore.getState();
  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(rest.body && !skipJsonContentType
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

// T314: multipart/form-data helper for avatar upload (expo-image-picker →
// POST /api/profile/avatar, field name `avatar`). RN's FormData accepts
// `{ uri, name, type }` directly; the fetch polyfill streams it.
//
// T328 (Build 26): we used to rely on `body instanceof FormData` in apiFetch
// to suppress the JSON Content-Type — that worked in dev but failed under
// Hermes prod bytecode (FormData class identity loss → false negative →
// JSON header overrode the multipart boundary fetch would have set → multer
// skipped the body → 7×400 in <2ms in Boss's TestFlight Build 24). The
// upload helper now explicitly passes `skipJsonContentType: true` so fetch's
// own multipart boundary handling kicks in regardless of runtime identity.
type UploadFile = { uri: string; name: string; type: string };

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
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: <T = unknown>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
  upload: <T = unknown>(
    path: string,
    field: string,
    file: UploadFile,
    options?: RequestOptions,
  ) => {
    const form = new FormData();
    // RN's FormData types don't quite match the web spec — cast to the shape
    // the runtime actually accepts (Android/iOS fetch reads { uri, name, type }).
    form.append(field, file as unknown as Blob);
    return apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: form,
      skipJsonContentType: true,
    });
  },
};
