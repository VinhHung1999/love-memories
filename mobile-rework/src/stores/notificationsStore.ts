import { create } from 'zustand';

// T425 (Sprint 65) — cross-tree invalidation signal for notifications.
// Mirrors momentsStore + lettersStore. The Dashboard bell hook +
// NotificationsScreen VM both subscribe to `version`; any flow that
// mutates notifications (mark-read, mark-all-read, future create) calls
// `invalidate()` so consumers re-fetch.

type State = {
  version: number;
};

type Actions = {
  invalidate: () => void;
};

export const useNotificationsStore = create<State & Actions>((set) => ({
  version: 0,
  invalidate: () => set((s) => ({ version: s.version + 1 })),
}));
