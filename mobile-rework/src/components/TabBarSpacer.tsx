import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// T372 — render as the LAST child of any ScrollView / FlatList inside a tab
// screen so the floating PillTabBar doesn't clip the last content row.
//
// Why not `contentContainerClassName={someVar}`? NativeWind v4's JSX
// transform rewrites `contentContainerClassName` (a NativeWind-only prop)
// into `contentContainerStyle` at compile time — but only when the value is
// a STRING LITERAL directly on the JSX element. Feeding a variable from a
// hook skips the rewrite entirely and the paddingBottom never lands.
// T369's hook-based approach hit exactly that trap and shipped broken in
// Build 35 (Boss flagged lần 5).
//
// Fix: put the spacing on a real `<View className="h-[Npx]">` where NativeWind
// v4 ALWAYS resolves className at runtime. Both branches below are static
// literals in source so Tailwind JIT scans them.
//
// Heights match the scroll clearance formula in useTabBarBottomInset.ts:
//   TAB_BAR_HEIGHT(62) + insets.bottom + 24 airy breathing
//   → 120 on notched (home-indicator) devices, 86 on flat.

export function TabBarSpacer() {
  const insets = useSafeAreaInsets();
  if (insets.bottom > 0) {
    return <View className="h-[120px]" />;
  }
  return <View className="h-[86px]" />;
}
