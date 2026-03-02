import * as Keychain from 'react-native-keychain';
import { AuthResponse, CoupleProfile } from '../types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = __DEV__
  ? 'https://dev-love-scrum-api.hungphu.work'
  : 'https://love-scrum-api.hungphu.work';

const KEYCHAIN_SERVICE = 'love-scrum';

// ---------------------------------------------------------------------------
// Token storage helpers (keychain)
// ---------------------------------------------------------------------------

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Keychain.setGenericPassword(accessToken, refreshToken, { service: KEYCHAIN_SERVICE });
}

export async function getStoredTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  if (!creds) return null;
  return { accessToken: creds.username, refreshToken: creds.password };
}

export async function clearStoredTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}

// ---------------------------------------------------------------------------
// Token refresh mutex — prevents concurrent refresh races
// ---------------------------------------------------------------------------

let isRefreshing = false;
let refreshListeners: Array<(token: string | null) => void> = [];

async function attemptRefresh(): Promise<string | null> {
  const stored = await getStoredTokens();
  if (!stored?.refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });
    if (!res.ok) {
      await clearStoredTokens();
      return null;
    }
    const data: AuthResponse = await res.json();
    await storeTokens(data.accessToken || data.token, data.refreshToken);
    return data.accessToken || data.token;
  } catch {
    await clearStoredTokens();
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper with auto-refresh on 401
// ---------------------------------------------------------------------------

type OnUnauthenticated = () => void;
let onUnauthenticatedCallback: OnUnauthenticated | null = null;

export function setOnUnauthenticated(cb: OnUnauthenticated): void {
  onUnauthenticatedCallback = cb;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const stored = await getStoredTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (stored?.accessToken) {
    headers.Authorization = `Bearer ${stored.accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Attempt token refresh
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshListeners.forEach(cb => cb(newToken));
      refreshListeners = [];

      if (!newToken) {
        onUnauthenticatedCallback?.();
        return res;
      }

      // Retry with new token
      return fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    } else {
      // Wait for the in-progress refresh
      return new Promise((resolve) => {
        refreshListeners.push(async (newToken) => {
          if (!newToken) {
            resolve(res);
            return;
          }
          resolve(
            fetch(`${API_BASE}${path}`, {
              ...options,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
            }),
          );
        });
      });
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  register: async (
    email: string,
    password: string,
    name: string,
    opts?: { inviteCode?: string; coupleName?: string },
  ): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, ...opts }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse & { needsCouple?: boolean; googleProfile?: object }> => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    return data;
  },

  googleComplete: async (
    idToken: string,
    opts: { inviteCode?: string; coupleName?: string },
  ): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/google/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, ...opts }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google signup failed');
    return data;
  },

  googleLink: async (idToken: string): Promise<{ ok: boolean; googleId: string }> => {
    const res = await apiFetch('/api/auth/google/link', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to link Google account');
    return data;
  },

  me: async (): Promise<import('../types').AuthUser> => {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) throw new Error('Invalid token');
    return res.json();
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  },
};

// ---------------------------------------------------------------------------
// Couple API
// ---------------------------------------------------------------------------

export const coupleApi = {
  get: async (): Promise<CoupleProfile> => {
    const res = await apiFetch('/api/couple');
    if (!res.ok) throw new Error('Failed to fetch couple');
    return res.json();
  },

  generateInvite: async (): Promise<{ inviteCode: string }> => {
    const res = await apiFetch('/api/couple/generate-invite', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate invite');
    return res.json();
  },
};

// ---------------------------------------------------------------------------
// Profile API
// ---------------------------------------------------------------------------

export const profileApi = {
  updateName: async (name: string): Promise<import('../types').AuthUser> => {
    const res = await apiFetch('/api/profile/name', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to update name');
    return res.json();
  },
};
