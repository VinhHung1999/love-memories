import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 68 T466 — CoupleForm. The creator-only screen between PairChoice
// and Wait. Atomic submit per T462: BE persists couple row + slogan in a
// single transaction so the moment we leave this screen, the slogan is
// already on the web Dashboard, the user has a coupleId, and the next
// screen can poll for the joiner.
//
// Flow:
//   PairChoice (create branch)
//     → couple-create (this screen)
//     → POST /api/couple { name, anniversaryDate, slogan }
//     → setSession (rotated tokens + user.coupleId)
//     → CommonActions.reset to pair-wait
//
// 409 Conflict (already paired — defensive against double-tap or stale
// state) drops the user straight into MainTabs; the auth gate would route
// them anyway, but the explicit reset spares the flicker.

export const SLOGAN_MAX = 120;
const NAME_MAX = 60;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

type CreateCoupleResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    color: string | null;
    coupleId: string | null;
    onboardingComplete: boolean;
  };
  couple: {
    id: string;
    name: string | null;
    anniversaryDate: string | null;
    inviteCode: string | null;
    color: string | null;
    slogan: string | null;
  };
  inviteUrl: string | null;
};

type FormError =
  | { kind: 'nameRequired' }
  | { kind: 'nameTooLong' }
  | { kind: 'sloganTooLong' }
  | { kind: 'dateInvalid' }
  | { kind: 'alreadyPaired' }
  | { kind: 'network' };

// Light client-side parse — BE re-parses with new Date() so we only
// reject obvious typos here. Empty string is valid (anniversary optional).
function parseAnniversary(input: string): string | null | 'invalid' {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = DATE_RE.exec(trimmed);
  if (!m) return 'invalid';
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return 'invalid';
  }
  return new Date(Date.UTC(year, month - 1, day, 12)).toISOString();
}

export function useCoupleFormViewModel() {
  const navigation = useNavigation();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);

  const canSubmit = name.trim().length > 0 && !submitting;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError({ kind: 'nameRequired' });
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setFormError({ kind: 'nameTooLong' });
      return;
    }
    const trimmedSlogan = slogan.trim();
    if (trimmedSlogan.length > SLOGAN_MAX) {
      setFormError({ kind: 'sloganTooLong' });
      return;
    }
    const parsed = parseAnniversary(date);
    if (parsed === 'invalid') {
      setFormError({ kind: 'dateInvalid' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post<CreateCoupleResponse>('/api/couple', {
        name: trimmedName,
        anniversaryDate: parsed,
        slogan: trimmedSlogan ? trimmedSlogan : null,
      });
      // Token rotation — old JWT carries coupleId:null and the next request
      // (e.g. Wait screen polling /api/couple) would 401 without this swap.
      // Memory bugs_refresh_token_rotation Sprint 63.
      await setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        onboardingComplete: res.user.onboardingComplete,
        user: {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          avatarUrl: res.user.avatar,
          color: res.user.color,
          coupleId: res.user.coupleId,
        },
      });
      // Couple is now committed server-side — the creator must not be able
      // to swipe back into the form and re-submit (would 409 silently).
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'pair-wait' }],
        }),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Defensive — user already in a couple. The auth gate will route
        // them on next render; surface the kind here so the UI can flash
        // a copy that explains why the form bounced.
        setFormError({ kind: 'alreadyPaired' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, name, slogan, date, setSession, navigation]);

  return {
    name,
    setName,
    slogan,
    setSlogan,
    date,
    setDate,
    submitting,
    canSubmit,
    formError,
    onSubmit,
  };
}
