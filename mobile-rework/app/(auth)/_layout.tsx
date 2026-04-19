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
      <Stack.Screen name="pair-create" />
      <Stack.Screen name="pair-join" />
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
