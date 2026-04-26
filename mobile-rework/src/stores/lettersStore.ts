import { create } from 'zustand';

// T421 (Sprint 65) — cross-tree invalidation signal for love-letters data.
// Mirrors momentsStore (T378). The Letters list VM subscribes to `version`;
// any flow that mutates letters (T422 letter-read mark-as-read auto-flip,
// T423 send/save-draft, future delete) calls `invalidate()` so the list
// refetches without a manual pull-to-refresh.
//
// Tiny by design: no cached letter rows, no selectors — the VM owns its
// own fetch/error state.

type State = {
  version: number;
};

type Actions = {
  invalidate: () => void;
};

export const useLettersStore = create<State & Actions>((set) => ({
  version: 0,
  invalidate: () => set((s) => ({ version: s.version + 1 })),
}));
