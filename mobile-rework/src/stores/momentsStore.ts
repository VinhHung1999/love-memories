import { create } from 'zustand';

// T378 (Sprint 62) — cross-tree invalidation signal for moment data.
//
// Dashboard (T375) + Moments list (T376) both subscribe to `version`; when it
// bumps, their view-models refetch so newly-created moments (T378 submit flow)
// show up without a manual reload. Kept separate from the uploadQueue because
// the moment row is created BEFORE photos finish uploading — invalidation
// fires once after POST /api/moments so the card appears right away (cover
// photo trickles in after uploads complete).
//
// Deliberately tiny: no caching of the moments themselves, no selectors —
// the VMs own their own fetch/error state. This store is just the "bump"
// that tells them to refetch.

type State = {
  version: number;
};

type Actions = {
  invalidate: () => void;
};

export const useMomentsStore = create<State & Actions>((set) => ({
  version: 0,
  invalidate: () => set((s) => ({ version: s.version + 1 })),
}));
