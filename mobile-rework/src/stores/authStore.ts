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
  // Sprint 60 T288 (Boss bug #15): persisted across logout — set true the
  // first time the user finishes onboarding on this install. The gate uses
  // it to send returning-but-logged-out users straight to /login instead of
  // /welcome+/intro (which is meant for first-time installs only). Stored in
  // its OWN AsyncStorage key so clear() (logout) doesn't wipe it.
  hasSeenOnboarding: boolean;
  // Sprint 60 T285: transient (NOT persisted) holding tank for an invite code
  // received via `memoura://pair?code=…` while the user was unauthed. After
  // they sign in / sign up, PairChoice consumes it to redirect into pair-join
  // with the code prefilled, then clears it. Cleared on clear() too.
  pendingPairCode: string | null;
  // Sprint 60 T316: transient (NOT persisted) inviter snapshot fetched by
  // PairJoin's debounced /validate-invite call. Joiner-path screens after
  // PairJoin (Personalize hero, OnboardingDone celebration) read this to
  // greet the user with the inviter's actual name + avatar instead of the
  // generic "người ấy" copy. Cleared on successful pair-join (the real
  // partner now lives on user.partner via /api/couple) and on clear().
  pendingPartner: { name: string; avatarUrl: string | null } | null;
  hydrated: boolean;
};

type Actions = {
  hydrate: () => Promise<void>;
  setSession: (input: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    onboardingComplete: boolean;
  }) => Promise<void>;
  // T403 (Sprint 63 hotfix) — persists BOTH tokens after /auth/refresh. The BE
  // rotates refreshToken on every refresh call (AuthService.refresh revokes
  // old, issues new). The previous `setAccessToken` dropped the rotated value,
  // so after ~30 min of app use we'd call refresh with a revoked token → BE
  // 401 → `clear()` → Boss logged out. Pass `refreshToken: null` to skip the
  // rotation update (e.g. if the server ever omits it).
  setTokens: (tokens: {
    accessToken: string;
    refreshToken?: string | null;
  }) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setCoupleId: (coupleId: string | null) => void;
  setOnboardingComplete: (value: boolean) => Promise<void>;
  setPendingPairCode: (code: string | null) => void;
  setPendingPartner: (partner: { name: string; avatarUrl: string | null } | null) => void;
  clear: () => Promise<void>;
};

const STORAGE_KEY = '@memoura/auth/v1';
// T288: separate key so logout (clear() → removeItem(STORAGE_KEY)) doesn't
// drop the "user has seen onboarding on this install" signal.
const ONBOARDED_KEY = '@memoura/onboarded/v1';

type Persisted = Pick<State, 'user' | 'accessToken' | 'refreshToken' | 'onboardingComplete'>;

async function persist(state: Persisted) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / serialization failure — swallow, next write will retry
  }
}

async function persistOnboarded(value: boolean) {
  try {
    if (value) {
      await AsyncStorage.setItem(ONBOARDED_KEY, '1');
    } else {
      await AsyncStorage.removeItem(ONBOARDED_KEY);
    }
  } catch {
    // ignore — next call will retry
  }
}

export const useAuthStore = create<State & Actions>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  onboardingComplete: false,
  hasSeenOnboarding: false,
  pendingPairCode: null,
  pendingPartner: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const [authRaw, onboardedRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDED_KEY),
      ]);
      if (authRaw) {
        const parsed = JSON.parse(authRaw) as Partial<State>;
        set({
          user: parsed.user ?? null,
          accessToken: parsed.accessToken ?? null,
          refreshToken: parsed.refreshToken ?? null,
          onboardingComplete: parsed.onboardingComplete ?? false,
        });
      }
      if (onboardedRaw === '1') {
        set({ hasSeenOnboarding: true });
      }
    } catch {
      // corrupt cache — keep defaults
    } finally {
      set({ hydrated: true });
    }
  },

  setSession: async ({ user, accessToken, refreshToken, onboardingComplete }) => {
    // T301: server is the source of truth — login/register/refresh return the
    // user's stored onboardingComplete. No more force-false on every login,
    // which was wiping returning users back into the wizard.
    set({ user, accessToken, refreshToken, onboardingComplete });
    await persist({ user, accessToken, refreshToken, onboardingComplete });
    // Latch hasSeenOnboarding the first time we ever see a completed account
    // (e.g. login on a fresh install where the local flag was never set).
    if (onboardingComplete && !get().hasSeenOnboarding) {
      set({ hasSeenOnboarding: true });
      await persistOnboarded(true);
    }
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    const nextRefresh = refreshToken ?? get().refreshToken;
    set({ accessToken, refreshToken: nextRefresh });
    const { user, onboardingComplete } = get();
    await persist({ user, accessToken, refreshToken: nextRefresh, onboardingComplete });
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
    const { user, accessToken, refreshToken, hasSeenOnboarding } = get();
    await persist({ user, accessToken, refreshToken, onboardingComplete: value });
    // T288 (Boss bug #15): the very first time onboarding completes on this
    // install, latch hasSeenOnboarding so a later logout still routes to
    // /login (not /welcome). Idempotent — re-flipping the flag costs one
    // string write to AsyncStorage and that's fine.
    if (value && !hasSeenOnboarding) {
      set({ hasSeenOnboarding: true });
      await persistOnboarded(true);
    }
  },

  setPendingPairCode: (code) => {
    set({ pendingPairCode: code });
  },

  setPendingPartner: (partner) => {
    set({ pendingPartner: partner });
  },

  clear: async () => {
    // T288: hasSeenOnboarding persists across logout by design — only the
    // session keys are wiped. The ONBOARDED_KEY survives.
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      onboardingComplete: false,
      pendingPairCode: null,
      pendingPartner: null,
    });
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
