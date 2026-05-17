import { create } from 'zustand';

// T472 Build 149 fix (Sprint 70) — Memory Map preview-card visibility flag.
// MomentPreviewCard is rendered inside MapScreen → MomentsScreen tab content,
// but PillTabBar (Expo Router tab chrome) renders as a SIBLING of the scene at
// the Tabs root, with its own absolute-bottom positioning. RN sibling z-index
// can't reach across that boundary, so a sliding preview card was getting
// covered by the floating tabbar. Boss reported this on Build 149.
//
// Fix: PillTabBar subscribes to `isPreviewVisible` and renders null while a
// pin preview is open. The card's dim overlay + slide animation become the
// only thing on screen above the map — cleaner focus, matches the prototype
// PinPreviewSheet behaviour (no tabbar visible behind the dim).
//
// Card mount → setVisible(true); card unmount / onClose → setVisible(false).
// PillTabBar's hide is instant (no animation) — the card's 250ms slide-up
// covers the visual transition.

type State = {
  isPreviewVisible: boolean;
};

type Actions = {
  setVisible: (v: boolean) => void;
};

export const useMapPreviewStore = create<State & Actions>((set) => ({
  isPreviewVisible: false,
  setVisible: (v) => set({ isPreviewVisible: v }),
}));
