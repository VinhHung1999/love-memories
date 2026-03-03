import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, clearStoredTokens, getStoredTokens, setOnUnauthenticated, storeTokens } from './api';
import { AuthUser, GoogleProfile } from '../types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    opts?: { inviteCode?: string; coupleName?: string },
  ) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ needsCouple: true; googleProfile: GoogleProfile } | void>;
  completeGoogleSignup: (idToken: string, opts: { inviteCode?: string; coupleName?: string }) => Promise<void>;
  linkGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    const stored = await getStoredTokens();
    if (stored?.refreshToken) {
      authApi.logout(stored.refreshToken);
    }
    await clearStoredTokens();
    setUser(null);
  }, []);

  // Register the logout callback for 401 handling in apiFetch
  useEffect(() => {
    setOnUnauthenticated(() => {
      clearStoredTokens();
      setUser(null);
    });
  }, []);

  // On mount: check keychain for stored token → verify with /api/auth/me
  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredTokens();
        if (!stored?.accessToken) return;
        const userData = await authApi.me();
        setUser(userData);
      } catch {
        await clearStoredTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    await storeTokens(data.accessToken || data.token, data.refreshToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      opts?: { inviteCode?: string; coupleName?: string },
    ) => {
      const data = await authApi.register(email, password, name, opts);
      await storeTokens(data.accessToken || data.token, data.refreshToken);
      setUser(data.user);
    },
    [],
  );

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const data = await authApi.googleLogin(idToken);
    if (data.needsCouple) {
      return { needsCouple: true as const, googleProfile: data.googleProfile as GoogleProfile };
    }
    await storeTokens(data.accessToken || data.token, data.refreshToken);
    setUser(data.user);
  }, []);

  const completeGoogleSignup = useCallback(
    async (idToken: string, opts: { inviteCode?: string; coupleName?: string }) => {
      const data = await authApi.googleComplete(idToken, opts);
      await storeTokens(data.accessToken || data.token, data.refreshToken);
      setUser(data.user);
    },
    [],
  );

  const linkGoogle = useCallback(
    async (idToken: string) => {
      const data = await authApi.googleLink(idToken);
      updateUser({ googleId: data.googleId });
    },
    [updateUser],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        completeGoogleSignup,
        linkGoogle,
        logout,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
