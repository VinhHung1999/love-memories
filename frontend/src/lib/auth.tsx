import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthUser, GoogleProfile } from '@shared/types';

export type { AuthUser, GoogleProfile };

const TOKEN_KEY = 'memoura-token';
const REFRESH_TOKEN_KEY = 'memoura-refresh-token';
const API = '/api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, opts?: { inviteCode?: string; coupleName?: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ needsCouple: true; googleProfile: GoogleProfile } | void>;
  completeGoogleSignup: (idToken: string, opts: { inviteCode?: string; coupleName?: string }) => Promise<void>;
  linkGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const currentToken = localStorage.getItem(TOKEN_KEY);
    // Best-effort server-side revoke
    if (currentToken && refreshToken) {
      fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // On mount: verify stored access token. If expired (401), try refresh before clearing.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const clearSession = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setToken(null);
    };

    const tryRefreshAndRetry = async (): Promise<void> => {
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefresh) { clearSession(); return; }

      const refreshRes = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });
      if (!refreshRes.ok) { clearSession(); return; }

      const { accessToken, refreshToken } = await refreshRes.json() as { accessToken: string; refreshToken: string };
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      setToken(accessToken);

      // Retry /auth/me with fresh access token
      const meRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!meRes.ok) { clearSession(); return; }
      const userData = await meRes.json() as AuthUser;
      setUser(userData);
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401) {
          // Access token expired — attempt silent refresh
          await tryRefreshAndRetry();
          return;
        }
        if (!res.ok) throw new Error('Auth error');
        const data = await res.json() as AuthUser;
        setUser(data);
        setToken(storedToken);
      })
      .catch(() => {
        // Network error or abort — keep tokens, don't redirect (may be offline)
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, opts?: { inviteCode?: string; coupleName?: string }) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, inviteCode: opts?.inviteCode || undefined, coupleName: opts?.coupleName || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const res = await fetch(`${API}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    if (data.needsCouple) {
      return { needsCouple: true as const, googleProfile: data.googleProfile as GoogleProfile };
    }
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const completeGoogleSignup = useCallback(async (idToken: string, opts: { inviteCode?: string; coupleName?: string }) => {
    const res = await fetch(`${API}/auth/google/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, ...opts }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google signup failed');
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const linkGoogle = useCallback(async (idToken: string) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API}/auth/google/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to link Google account');
    updateUser({ googleId: data.googleId });
  }, [updateUser]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, loginWithGoogle, completeGoogleSignup, linkGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
