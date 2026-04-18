import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError, apiClient } from '@/lib/apiClient';

// Sprint 60 T284. Initial code arrives via route param from PairChoice
// (`?code=…`) so we can render immediately without a second round-trip. If the
// user lands here without a param (deep-link, manual nav, kill+resume), we
// fall back to GET /api/couple to read the current inviteCode.
//
// Polling (3s) on GET /api/couple watches for memberCount === 2; once the
// partner joins we router.replace into /(auth)/personalize. T286 then commits
// onboardingComplete=true.

const POLL_MS = 3000;

type CoupleResponse = {
  inviteCode: string | null;
  memberCount: number;
};

type RotateResponse = {
  inviteCode: string;
};

type FormError = { kind: 'network' };

function formatHexCode(code: string | null): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  if (upper.length !== 8) return upper;
  return `${upper.slice(0, 4)} ${upper.slice(4)}`;
}

export function usePairInviteViewModel() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string }>();
  const initialCode = typeof params.code === 'string' ? params.code : null;

  const [code, setCode] = useState<string | null>(initialCode);
  const [rotating, setRotating] = useState(false);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const advancedRef = useRef(false);

  // Lazy-fetch the current code if route param missing (deep-link / resume).
  useEffect(() => {
    if (code) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<CoupleResponse>('/api/couple');
        if (!cancelled && res.inviteCode) setCode(res.inviteCode);
      } catch {
        if (!cancelled) setError({ kind: 'network' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // 3s poll for partner join. Silently swallow network errors mid-poll —
  // the next tick recovers and a hiccup is uninteresting to the user.
  useEffect(() => {
    if (partnerJoined) return;
    const id = setInterval(async () => {
      try {
        const res = await apiClient.get<CoupleResponse>('/api/couple');
        if (res.memberCount >= 2 && !advancedRef.current) {
          advancedRef.current = true;
          setPartnerJoined(true);
          router.replace('/(auth)/personalize');
        }
      } catch {
        // ignore — next tick retries
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [partnerJoined, router]);

  const onRotate = useCallback(async () => {
    if (rotating) return;
    setRotating(true);
    setError(null);
    try {
      const res = await apiClient.post<RotateResponse>('/api/couple/generate-invite');
      setCode(res.inviteCode);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ kind: 'network' });
      } else {
        setError({ kind: 'network' });
      }
    } finally {
      setRotating(false);
    }
  }, [rotating]);

  const onShare = useCallback(async () => {
    if (!code) return;
    const message = t('onboarding.pairing.invite.shareMessage', { code: code.toLowerCase() });
    try {
      await Share.share({ message });
    } catch {
      // Sharing is fire-and-forget; user-cancel + system errors equally uninteresting.
    }
  }, [code, t]);

  return {
    code,
    formattedCode: formatHexCode(code),
    qrPayload: code ? `memoura://pair?code=${code.toLowerCase()}` : null,
    rotating,
    partnerJoined,
    error,
    onRotate,
    onShare,
  };
}
