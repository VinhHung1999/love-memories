import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, clearStoredTokens, getStoredTokens, setOnUnauthenticated, storeTokens } from './api';
import { AuthUser, GoogleProfile, AppleProfile } from '../types';
// Note: Notification — Import to unregister FCM token on logout
import { unregisterPushToken } from './pushNotifications';

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
  loginWithApple: (idToken: string, nameHint?: string) => Promise<{ needsCouple: true; appleProfile: AppleProfile } | void>;
  beginAppleOnboarding: (idToken: string, opts?: { name?: string; inviteCode?: string; coupleName?: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
  // Onboarding: register/googleComplete WITHOUT setUser — caller does extra APIs then calls completeOnboarding
  beginEmailOnboarding: (email: string, password: string, name: string) => Promise<AuthUser>;
  beginGoogleOnboarding: (idToken: string) => Promise<AuthUser>;
  completeOnboarding: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    // Note: Notification — Unregister FCM token so user stops receiving
    // push notifications on this device after logging out.
    await unregisterPushToken();
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

  const beginEmailOnboarding = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await authApi.register(email, password, name);
      await storeTokens(data.accessToken || data.token, data.refreshToken);
      return data.user as AuthUser;
    },
    [],
  );

  const loginWithApple = useCallback(async (idToken: string, nameHint?: string) => {
    const data = await authApi.appleLogin(idToken, nameHint);
    if (data.needsCouple) {
      return { needsCouple: true as const, appleProfile: data.appleProfile! };
    }
    await storeTokens(data.accessToken || data.token, data.refreshToken);
    setUser(data.user);
  }, []);

  const beginAppleOnboarding = useCallback(
    async (idToken: string, opts: { name?: string; inviteCode?: string; coupleName?: string } = {}) => {
      const data = await authApi.appleComplete(idToken, opts);
      await storeTokens(data.accessToken || data.token, data.refreshToken);
      return data.user as AuthUser;
    },
    [],
  );

  const beginGoogleOnboarding = useCallback(
    async (idToken: string) => {
      const data = await authApi.googleComplete(idToken, {});
      await storeTokens(data.accessToken || data.token, data.refreshToken);
      return data.user as AuthUser;
    },
    [],
  );

  const completeOnboarding = useCallback((user: AuthUser) => {
    setUser(user);
  }, []);

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
        loginWithApple,
        beginAppleOnboarding,
        logout,
        updateUser,
        beginEmailOnboarding,
        beginGoogleOnboarding,
        completeOnboarding,
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
