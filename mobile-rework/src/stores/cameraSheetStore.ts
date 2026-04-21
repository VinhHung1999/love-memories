import { create } from 'zustand';

// T377 — global open/close flag for the camera action sheet so any screen can
// request it (Dashboard empty-state CTAs in T375, Moments empty-state CTA in
// T376, PillTabBar camera pill in `app/(tabs)/_layout.tsx`) without drilling a
// ref through the tree. The sheet component itself subscribes to `isOpen` and
// calls `present()` / `dismiss()` on its internal BottomSheetModal ref.

type State = {
  isOpen: boolean;
};

type Actions = {
  open: () => void;
  close: () => void;
};

export const useCameraSheetStore = create<State & Actions>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
