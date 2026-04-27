// Sprint 67 D4 — Stories monthly recap promoted out of `(modal)` group so
// `presentation: 'fullScreenModal'` actually wins. Inside the (modal) group
// the parent `_layout.tsx` declares `presentation: 'modal'` on its own Stack,
// which iOS treats as a sheet card (rounded corners + safe-area chrome) and
// drowns out the per-screen override. Same lesson as PB5 Photobooth and
// D42 letter-read — when a screen MUST be edge-to-edge fullScreenModal,
// it has to live as a top-level route.
//
// Detail (editorial scroll) stays at `/(modal)/recap/monthly/detail` —
// modal sheet there is correct UX (Boss can swipe-down).

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
