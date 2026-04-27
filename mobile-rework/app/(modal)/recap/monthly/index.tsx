// Sprint 67 T460 + D2 — DEFAULT entry for monthly recap. Stories first
// per Boss directive 2026-04-27. Editorial scroll demoted to ./detail
// and reachable via the ActionsTray "Xem chi tiết" CTA.
//
// D2 (2026-04-27): Stack.Screen options override the parent (modal)
// group's `presentation: 'modal'` so Stories renders truly edge-to-
// edge (no top/bottom safe-area chrome from the modal sheet). Status
// bar hidden so progress bars sit at the very top.

import { Stack } from 'expo-router';

import { MonthlyStoriesScreen } from '@/screens/Recap/Stories';

export default function MonthlyStoriesRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          statusBarHidden: true,
          statusBarStyle: 'light',
          animation: 'fade',
        }}
      />
      <MonthlyStoriesScreen />
    </>
  );
}
