import { create } from 'zustand';

// In-memory only — never persisted. Holds the password until the final
// onboarding step (T285) calls /auth/register, then cleared. Per the
// onboarding-API-timing rule, no mid-wizard auth calls.

export type SignupDraft = {
  name: string;
  email: string;
  password: string;
};

type State = {
  draft: SignupDraft | null;
  setDraft: (draft: SignupDraft) => void;
  clearDraft: () => void;
};

export const useSignupDraftStore = create<State>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
