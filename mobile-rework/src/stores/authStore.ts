import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  coupleId: string | null;
};

type Tokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type State = Tokens & {
  user: AuthUser | null;
  hydrated: boolean;
};

type Actions = {
  hydrate: () => Promise<void>;
  setSession: (input: { user: AuthUser; accessToken: string; refreshToken: string }) => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setCoupleId: (coupleId: string | null) => void;
  clear: () => Promise<void>;
};

const STORAGE_KEY = '@memoura/auth/v1';

async function persist(state: Pick<State, 'user' | 'accessToken' | 'refreshToken'>) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / serialization failure — swallow, next write will retry
  }
}

export const useAuthStore = create<State & Actions>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        set({
          user: parsed.user ?? null,
          accessToken: parsed.accessToken ?? null,
          refreshToken: parsed.refreshToken ?? null,
        });
      }
    } catch {
      // corrupt cache — keep defaults
    } finally {
      set({ hydrated: true });
    }
  },

  setSession: async ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken });
    await persist({ user, accessToken, refreshToken });
  },

  setAccessToken: async (accessToken) => {
    set({ accessToken });
    const { user, refreshToken } = get();
    await persist({ user, accessToken, refreshToken });
  },

  setUser: (user) => {
    set({ user });
    const { accessToken, refreshToken } = get();
    void persist({ user, accessToken, refreshToken });
  },

  setCoupleId: (coupleId) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, coupleId };
    set({ user: next });
    const { accessToken, refreshToken } = get();
    void persist({ user: next, accessToken, refreshToken });
  },

  clear: async () => {
    set({ user: null, accessToken: null, refreshToken: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));

// Selectors — call as `useAuthStore(isAuthenticated)` / `useAuthStore(hasCouple)`
// or imperatively via `isAuthenticated(useAuthStore.getState())`.
export const isAuthenticated = (s: State): boolean => !!s.accessToken;
export const hasCouple = (s: State): boolean => !!s.user?.coupleId;
