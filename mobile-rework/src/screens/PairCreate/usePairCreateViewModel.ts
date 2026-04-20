import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { env } from '@/config/env';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// T289 (Sprint 60 polish): merges the Sprint-59 PairChoice + PairInvite
// screens into a single 2-state flow on `/(auth)/pair-create`.
//
//   stage='choose'  → show 2 PairOption cards (Create | Join)
//   stage='invite'  → legacy holding screen for users who already created
//                     an invite under the pre-T306 flow. New users never
//                     reach it (Create now routes straight to Personalize).
//
// On mount we GET /api/invite/me:
//   200 → legacy invite exists (user resumed from kill or back-nav on an
//         old build that called POST /api/couple here) → render invite so
//         they can still Share + Continue. Post-T306 flow doesn't create
//         couples on this screen so 200 is only reachable via legacy state.
//   404 NO_INVITE → fresh state, show chooser.
//   409 ALREADY_PAIRED → user already has a partner; the auth gate will
//         take them through personalize → tabs. Defensive replace() in
//         case the gate hasn't yet caught up to the latest server state.
//
// T306 (Sprint 60 Bundle 4): Create no longer commits here — tapping the
// Create card just routes to /(auth)/personalize, and Personalize fires the
// POST /api/couple + PUT + PATCH chain on Continue. Rationale: Boss wants
// the pairing commit deferred to the point where the user has actually
// filled in their name/color/anniversary, so abandoned creators don't leave
// orphaned couples on the BE. See PO spec bundle-4 / T306.

// BE shapes — both endpoints colocated in backend/src/services/CoupleService.ts.
type InviteMeResponse = {
  inviteCode: string;
  createdAt: string;
  couple: { id: string; name: string | null };
};

type RegenerateResponse = { inviteCode: string };

type Stage = 'loading' | 'choose' | 'invite';

type FormError = { kind: 'network' };

function formatHexCode(code: string | null): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  if (upper.length !== 8) return upper;
  return `${upper.slice(0, 4)} ${upper.slice(4)}`;
}

export function usePairCreateViewModel() {
  const router = useRouter();
  const { t } = useTranslation();
  const pendingPairCode = useAuthStore((s) => s.pendingPairCode);
  const setPendingPairCode = useAuthStore((s) => s.setPendingPairCode);

  const [stage, setStage] = useState<Stage>('loading');
  const [code, setCode] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  // T285: deep-link arrived pre-auth → useDeepLink stashed it. Forward to
  // pair-join with the code as a route param. Fires before the invite/me
  // probe so we don't pointlessly load state for a screen we're leaving.
  // Clear BEFORE replace() so a back-press from pair-join doesn't loop.
  useEffect(() => {
    if (!pendingPairCode) return;
    const c = pendingPairCode;
    setPendingPairCode(null);
    router.replace({ pathname: '/(auth)/pair-join', params: { code: c } });
  }, [pendingPairCode, router, setPendingPairCode]);

  // Mount-time stage probe.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<InviteMeResponse>('/api/invite/me');
        if (cancelled) return;
        setCode(res.inviteCode);
        setStage('invite');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setStage('choose');
            return;
          }
          if (err.status === 409) {
            // Defensive — the gate should already route, but if it lags
            // we don't want to leave the user staring at the chooser.
            router.replace('/(auth)/personalize');
            return;
          }
        }
        // Network / 5xx — fall back to choose so the user can try
        // (the chooser's onCreate will surface the error itself).
        setStage('choose');
        setError({ kind: 'network' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // T306: Create just forwards to Personalize. No POST /api/couple here —
  // Personalize's onSubmit detects the null coupleId and runs the create-
  // chain atomically (POST /api/couple → PUT profile + PUT couple → PATCH
  // onboarding-complete).
  // T327 (Build 25): switched replace → push so iOS animates the proper
  // slide-from-right transition (replace renders as cross-fade and Boss
  // perceives it as "không phải push"). Back-pop from Personalize is now
  // safe because POST /api/couple is deferred until onSubmit — at most the
  // user loses typed state, no orphan couple is left behind.
  const onCreate = useCallback(() => {
    router.push('/(auth)/personalize');
  }, [router]);

  const onJoin = useCallback(() => {
    router.push('/(auth)/pair-join');
  }, [router]);

  const onShare = useCallback(async () => {
    if (!code) return;
    const message = t('onboarding.pairing.invite.shareMessage', {
      code: code.toLowerCase(),
      url: `${env.appBaseUrl}/join/${code.toLowerCase()}`,
    });
    try {
      await Share.share({ message });
    } catch {
      // Share errors (user cancel, system fail) are equally uninteresting.
    }
  }, [code, t]);

  const onContinue = useCallback(() => {
    // T289 §1.4 / Boss bug #10 — explicit forward, no waiting/polling screen.
    // The joiner's POST /api/couple/join races us through personalize anyway;
    // both flows converge in OnboardingDone (T286).
    router.replace('/(auth)/personalize');
  }, [router]);

  const performRegenerate = useCallback(async () => {
    if (regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await apiClient.post<RegenerateResponse>('/api/couple/generate-invite');
      setCode(res.inviteCode);
    } catch {
      setError({ kind: 'network' });
    } finally {
      setRegenerating(false);
    }
  }, [regenerating]);

  const onRegenerate = useCallback(() => {
    if (regenerating || !code) return;
    Alert.alert(
      t('onboarding.pairing.invite.regenerate.title'),
      t('onboarding.pairing.invite.regenerate.body'),
      [
        { text: t('onboarding.pairing.invite.regenerate.cancel'), style: 'cancel' },
        {
          text: t('onboarding.pairing.invite.regenerate.confirm'),
          style: 'destructive',
          onPress: () => {
            void performRegenerate();
          },
        },
      ],
    );
  }, [regenerating, code, t, performRegenerate]);

  return {
    stage,
    code,
    formattedCode: formatHexCode(code),
    qrPayload: code ? `${env.appBaseUrl}/join/${code.toLowerCase()}` : null,
    regenerating,
    error,
    onCreate,
    onJoin,
    onShare,
    onContinue,
    onRegenerate,
  };
}
