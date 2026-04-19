import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T286 — final commit screen. Tap-to-enter:
//   1. PATCH /api/auth/me/onboarding-complete — T301 server-side commit so a
//      re-login on a fresh install skips the wizard (replaces the ad-hoc
//      useOnboardingResume couple-probe).
//   2. setOnboardingComplete(true) — flip local gate for instant navigation.
//   3. router.replace('/(tabs)') — useAuthGate would also route us, but
//      replacing immediately avoids a one-frame blank as the gate effect
//      runs after the next render.
//
// The server PATCH is best-effort. If it fails (offline), the local flag still
// gets the user into the app; next successful /refresh or /me will reconcile.

export function useOnboardingDoneViewModel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const [entering, setEntering] = useState(false);

  const onEnter = useCallback(async () => {
    if (entering) return;
    setEntering(true);
    try {
      try {
        await apiClient.patch('/api/auth/me/onboarding-complete', { value: true });
      } catch {
        // Offline / transient — keep going; the server will still say false
        // until a later sync, but the local flag unblocks the gate now.
      }
      await setOnboardingComplete(true);
    } finally {
      router.replace('/(tabs)');
    }
  }, [entering, setOnboardingComplete, router]);

  return {
    selfName: user?.name ?? null,
    entering,
    onEnter,
  };
}
