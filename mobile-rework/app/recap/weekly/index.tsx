// Sprint 67 D4 — Stories weekly recap promoted out of `(modal)` group so
// `presentation: 'fullScreenModal'` actually wins. See app/recap/monthly/
// index.tsx for full rationale.

import { Stack } from 'expo-router';

import { WeeklyStoriesScreen } from '@/screens/Recap/Stories';

export default function WeeklyStoriesRoute() {
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
      <WeeklyStoriesScreen />
    </>
  );
}
