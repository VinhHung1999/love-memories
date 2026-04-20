import { Stack } from 'expo-router';

// Order matches Sprint 60 onboarding flow: welcome → intro → signup|login|forgot
// → pair-create|pair-join → personalize → permissions → onboarding-done.
// Gesture/back-swipe enabled — auth gate (root _layout) only forces routes when
// the auth state itself changes, so user can freely navigate inside this group.
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="intro" />
      {/* T290 (bug #14): signup + login are entry points — no back gesture or
          chrome. Users switch between the two via in-screen links. */}
      <Stack.Screen
        name="signup"
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
      <Stack.Screen
        name="login"
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
      <Stack.Screen name="forgot-password" />
      {/* T294 (bug #8): pair-create is a commit point — creating an invite
          and swiping back would orphan the pair state. Locks gesture + header
          back; ScreenHeader inside drops its back arrow for the same reason. */}
      <Stack.Screen
        name="pair-create"
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
      <Stack.Screen name="pair-join" />
      {/* T306 + T331: Personalize behavior differs per entry path.
          Creator: arrives via router.push from PairCreate (T327). Gesture +
          back button work natively — nothing committed yet (POST /api/couple
          fires in onSubmit), so going back is safe.
          Joiner: arrives via navigation.reset from PairJoin.submitCode — the
          stack has been cleared to make Personalize the new root. Nothing
          behind to pop, so no gesture/back is possible even though
          Stack.Screen defaults say it is. Join is irrevocable. */}
      <Stack.Screen name="personalize" />
      <Stack.Screen name="permissions" />
      {/* T286: lock onboarding-done so the user can't swipe back into the
          permissions wizard once they've crossed the commit point. The CTA
          flips onboardingComplete and replace()s into (tabs); after that
          the auth gate would yank them right back, which would feel buggy. */}
      <Stack.Screen
        name="onboarding-done"
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
    </Stack>
  );
}
