import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// T289 (Sprint 60 polish): merges the Sprint-59 PairChoice + PairInvite
// screens into a single 2-state flow on `/(auth)/pair-create`.
//
//   stage='choose'  → show 2 PairOption cards (Create | Join)
//   stage='invite'  → show code + QR + Share + Continue + Regenerate
//
// On mount we GET /api/invite/me:
//   200 → invite already exists (user resumed from kill or back-nav) →
//         skip the chooser and render the invite directly. Fixes Boss bug
//         #9 ("re-create error" — POST /api/couple was failing with
//         "already in couple" for users who had created an invite then
//         force-closed the app).
//   404 NO_INVITE → fresh state, show chooser.
//   409 ALREADY_PAIRED → user already has a partner; the auth gate will
//         take them through personalize → tabs. Defensive replace() in
//         case the gate hasn't yet caught up to the latest server state.
//
// Continue is a manual confirmation (Boss bug #10 — "skip waiting screen"):
// the previous PairInvite polled /api/couple every 3s and auto-advanced on
// memberCount===2. Boss preferred a single explicit "I've sent it" CTA so
// the inviter isn't stuck staring at an indeterminate spinner.

// Always production share host. The Universal Link AASA file is served at
// memoura.app (not dev.memoura.app); a dev-domain share link would 404 at
// the web landing AND fail to trigger the app deep-link handoff.
const SHARE_HOST = 'https://memoura.app';

// BE shapes — both endpoints colocated in backend/src/services/CoupleService.ts.
type CreateCoupleResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    coupleId: string | null;
    onboardingComplete: boolean;
  };
  inviteCode: string;
};

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
  const setSession = useAuthStore((s) => s.setSession);
  const pendingPairCode = useAuthStore((s) => s.pendingPairCode);
  const setPendingPairCode = useAuthStore((s) => s.setPendingPairCode);

  const [stage, setStage] = useState<Stage>('loading');
  const [code, setCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
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

  const onCreate = useCallback(async () => {
    if (creating) return;
    setError(null);
    setCreating(true);
    try {
      const res = await apiClient.post<CreateCoupleResponse>('/api/couple', {});
      await setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        onboardingComplete: res.user.onboardingComplete,
        user: {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          avatarUrl: res.user.avatar,
          coupleId: res.user.coupleId,
        },
      });
      setCode(res.inviteCode);
      setStage('invite');
    } catch {
      setError({ kind: 'network' });
    } finally {
      setCreating(false);
    }
  }, [creating, setSession]);

  const onJoin = useCallback(() => {
    if (creating) return;
    router.push('/(auth)/pair-join');
  }, [creating, router]);

  const onShare = useCallback(async () => {
    if (!code) return;
    const message = t('onboarding.pairing.invite.shareMessage', {
      code: code.toLowerCase(),
      url: `${SHARE_HOST}/join/${code.toLowerCase()}`,
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
    qrPayload: code ? `${SHARE_HOST}/join/${code.toLowerCase()}` : null,
    creating,
    regenerating,
    error,
    onCreate,
    onJoin,
    onShare,
    onContinue,
    onRegenerate,
  };
}
