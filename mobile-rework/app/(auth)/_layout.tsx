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
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="pair-create" />
      <Stack.Screen name="pair-join" />
      <Stack.Screen name="personalize" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="onboarding-done" />
    </Stack>
  );
}
