// Sprint 67 T460 + D2 — DEFAULT entry for weekly recap. Stories first.
//
// D2: Same fullScreenModal override pattern as monthly so Stories
// shell renders edge-to-edge, status bar hidden.

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
