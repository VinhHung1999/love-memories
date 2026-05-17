import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Sprint 68 T470 — PairCreate is now PairChoice ONLY. The Sprint 60 invite-
// state (probe via GET /api/invite/me + render code + share + continue) is
// gone — couple creation moved to T466 CoupleForm where it submits atomically
// with name + slogan + anniversary in one transaction (T462). The legacy
// resume-from-existing-invite path no longer exists because POST /api/couple
// is now atomic with name; an interrupted onboarding either has no couple
// (chooser still applies) or already has a couple in which case CoupleForm's
// 409 handling routes them out.
//
// VM responsibilities:
//   1. Honor a pre-auth deep-link (pendingPairCode) by forwarding to PairJoin
//      with the code prefilled — same as Sprint 60 T285.
//   2. Surface two callbacks: onCreate (push /(auth)/couple-create) and
//      onJoin (push /(auth)/pair-join). Push (not reset) so the user can
//      back out to PairChoice and switch branches before committing.

export function usePairCreateViewModel() {
  const router = useRouter();
  const pendingPairCode = useAuthStore((s) => s.pendingPairCode);
  const setPendingPairCode = useAuthStore((s) => s.setPendingPairCode);

  // T285 carry-over: deep-link arrived pre-auth → useDeepLink stashed it.
  // Forward to pair-join with the code as a route param. Clear BEFORE
  // replace() so a back-press from pair-join doesn't loop.
  useEffect(() => {
    if (!pendingPairCode) return;
    const code = pendingPairCode;
    setPendingPairCode(null);
    router.replace({ pathname: '/(auth)/pair-join', params: { code } });
  }, [pendingPairCode, router, setPendingPairCode]);

  const onCreate = useCallback(() => {
    // Sprint 68 T470: Create branch goes to CoupleForm. The atomic POST
    // /api/couple lives there; this screen no longer commits anything.
    router.push('/(auth)/couple-create');
  }, [router]);

  const onJoin = useCallback(() => {
    router.push('/(auth)/pair-join');
  }, [router]);

  return {
    onCreate,
    onJoin,
  };
}
