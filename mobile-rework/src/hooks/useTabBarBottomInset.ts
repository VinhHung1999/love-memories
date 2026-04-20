import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/components/navigation/PillTabBar';

// T369 — one shared source for "how much paddingBottom does a scroll
// container inside a tab screen need so the last row isn't clipped by the
// floating PillTabBar?"
//
// Formula (per Boss-approved spec): TAB_BAR_HEIGHT + insets.bottom + airy
// breathing room (24). Two buckets cover every supported device:
//   • notched (home-indicator, insets.bottom ≈ 34) → 62 + 34 + 24 = 120
//   • flat (older iPhones / Android, insets.bottom = 0) → 62 + 0 + 24 = 86
//
// Why a className string, not a number? Mobile-rework is zero-`style`.
// Returning a class lets callers feed it straight into
// `contentContainerClassName` / inner-`<View className>` without inlining
// style objects. Both literals below are static so Tailwind JIT scans them.

const AIRY_BREATHING = 24;

export const TAB_BAR_BOTTOM_INSET_NOTCHED_PX = TAB_BAR_HEIGHT + 34 + AIRY_BREATHING; // 120
export const TAB_BAR_BOTTOM_INSET_FLAT_PX = TAB_BAR_HEIGHT + 0 + AIRY_BREATHING; // 86

export const TAB_BAR_BOTTOM_INSET_CLASS_NOTCHED = 'pb-[120px]';
export const TAB_BAR_BOTTOM_INSET_CLASS_FLAT = 'pb-[86px]';

/**
 * Returns the `pb-[Npx]` Tailwind class a tab-screen scroll container must
 * apply (via `contentContainerClassName` or an inner `<View>`) so the last
 * row clears the floating PillTabBar.
 */
export function useTabBarBottomInset(): string {
  const insets = useSafeAreaInsets();
  return insets.bottom > 0
    ? TAB_BAR_BOTTOM_INSET_CLASS_NOTCHED
    : TAB_BAR_BOTTOM_INSET_CLASS_FLAT;
}
