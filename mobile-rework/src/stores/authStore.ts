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
  // Sprint 60 T284: gates the (auth) → (tabs) transition. Set false on every
  // setSession() (every fresh login/register starts a brand-new onboarding);
  // T286 OnboardingDone sets true as the explicit commit. See
  // docs/specs/sprint-60-pairing.md §"Auth gate — onboardingComplete flag".
  onboardingComplete: boolean;
  hydrated: boolean;
};

type Actions = {
  hydrate: () => Promise<void>;
  setSession: (input: { user: AuthUser; accessToken: string; refreshToken: string }) => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setCoupleId: (coupleId: string | null) => void;
  setOnboardingComplete: (value: boolean) => Promise<void>;
  clear: () => Promise<void>;
};

const STORAGE_KEY = '@memoura/auth/v1';

type Persisted = Pick<State, 'user' | 'accessToken' | 'refreshToken' | 'onboardingComplete'>;

async function persist(state: Persisted) {
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
  onboardingComplete: false,
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
          onboardingComplete: parsed.onboardingComplete ?? false,
        });
      }
    } catch {
      // corrupt cache — keep defaults
    } finally {
      set({ hydrated: true });
    }
  },

  setSession: async ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken, onboardingComplete: false });
    await persist({ user, accessToken, refreshToken, onboardingComplete: false });
  },

  setAccessToken: async (accessToken) => {
    set({ accessToken });
    const { user, refreshToken, onboardingComplete } = get();
    await persist({ user, accessToken, refreshToken, onboardingComplete });
  },

  setUser: (user) => {
    set({ user });
    const { accessToken, refreshToken, onboardingComplete } = get();
    void persist({ user, accessToken, refreshToken, onboardingComplete });
  },

  setCoupleId: (coupleId) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, coupleId };
    set({ user: next });
    const { accessToken, refreshToken, onboardingComplete } = get();
    void persist({ user: next, accessToken, refreshToken, onboardingComplete });
  },

  setOnboardingComplete: async (value) => {
    set({ onboardingComplete: value });
    const { user, accessToken, refreshToken } = get();
    await persist({ user, accessToken, refreshToken, onboardingComplete: value });
  },

  clear: async () => {
    set({ user: null, accessToken: null, refreshToken: null, onboardingComplete: false });
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
