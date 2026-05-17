import { Stack } from 'expo-router';

// Sprint 68 T470 — onboarding flow rebuild:
//   welcome → intro → signup | login | forgot
//   → personalize → pair-create (PairChoice)
//     → couple-create → pair-wait → onboarding-done   (creator branch)
//     → pair-join → onboarding-done                   (joiner branch)
//
// The standalone Permissions screen was retired — notif-perm prompts run
// inline at the Wait screen (creator) and PairJoin redeem (joiner) instead.
// Gesture/back-swipe enabled by default — the root auth gate only forces
// routes when auth state itself changes, so the user can freely move
// inside this group. Per-screen overrides below lock down commit points.
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
      {/* Sprint 68 T470 — Personalize is the wizard entry post-login. PUT
          /api/profile is idempotent so back-swipe is safe; user can edit
          name / color before committing the couple via CoupleForm. */}
      <Stack.Screen name="personalize" />
      {/* T470 — pair-create is now PairChoice ONLY (Create vs Join). The
          legacy invite-state UI moved to CoupleForm (T466). No commit
          happens here, so gesture-back to Personalize is allowed. */}
      <Stack.Screen name="pair-create" />
      {/* T466 — CoupleForm, name + slogan + anniversary on one screen so
          the BE atomic transaction (T462) can persist them together.
          Gesture allowed: nothing committed until Next is pressed and the
          POST returns 201. */}
      <Stack.Screen name="couple-create" />
      <Stack.Screen name="pair-join" />
      {/* T467 — Wait screen for the creator while the joiner redeems. No
          back / skip; pair commitment is one-way. */}
      <Stack.Screen
        name="pair-wait"
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
      {/* T286 + T468 — lock onboarding-done so the user can't swipe back
          into the wizard once they've crossed the commit point. The CTA
          flips onboardingComplete and CommonActions.reset's into (tabs);
          after that the auth gate would yank them right back, which would
          feel buggy. */}
      <Stack.Screen
        name="onboarding-done"
        options={{ gestureEnabled: false, headerBackVisible: false }}
      />
    </Stack>
  );
}
