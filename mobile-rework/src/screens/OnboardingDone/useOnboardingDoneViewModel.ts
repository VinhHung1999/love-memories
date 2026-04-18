import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T286 — final commit screen. Tap-to-enter:
//   1. setOnboardingComplete(true) — explicit gate flip per
//      docs/specs/sprint-60-pairing.md §"OnboardingDone owns the commit".
//   2. router.replace('/(tabs)') — useAuthGate would also route us, but
//      replacing immediately avoids a one-frame blank as the gate effect
//      runs after the next render.
//
// Best-effort: if persistence fails the gate still routes (hydrate would
// re-read whatever ended up in storage). We don't block entry on async write.

export function useOnboardingDoneViewModel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const [entering, setEntering] = useState(false);

  const onEnter = useCallback(async () => {
    if (entering) return;
    setEntering(true);
    try {
      await setOnboardingComplete(true);
    } finally {
      // Replace, not push — onboarding-done shouldn't sit on the back stack
      // for a paired user accidentally swiping back into the auth wizard.
      router.replace('/(tabs)');
    }
  }, [entering, setOnboardingComplete, router]);

  return {
    selfName: user?.name ?? null,
    entering,
    onEnter,
  };
}
