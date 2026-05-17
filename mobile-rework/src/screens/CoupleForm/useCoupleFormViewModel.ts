import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 68 T466 → D3prime (Boss build 132 prototype sync) — CoupleForm.
// Prototype `pairing.jsx` L1103-1291 inverts the optional/required model:
// Anniversary becomes REQUIRED (the home-screen relationship counter is
// keyed on it), couple name + slogan are both OPTIONAL with quick-pick
// suggestion chips. Submit gate is now `date.trim().length >= 6`.
//
// Joiner mode (`isJoin`) is deferred — Sprint 68 flow has joiner skip
// CoupleForm entirely (Personalize → PairChoice → PairJoin →
// onboarding-done). Kept the prop in the contract so future sprints can
// re-introduce a join-side detail screen without an API rewrite.
//
// Atomic submit per BE T462: BE persists couple row + slogan in one
// transaction; we still rotate access/refresh tokens here so the next
// /api/* call from the Wait screen has a coupleId-bearing JWT (memory
// bugs_refresh_token_rotation Sprint 63).

export const SLOGAN_MAX = 120;
const NAME_MAX = 60;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

// Suggestion strings live in i18n (`onboarding.coupleForm.nameSuggestions` +
// `sloganSuggestions`) — the screen reads them via `t(..., { returnObjects:
// true })`. Keep them in locales so VI/EN can diverge per Boss directive
// 2026-04-28 (generic placeholders, no real-user-flavoured fallbacks).

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
  | { kind: 'dateRequired' }
  | { kind: 'dateInvalid' }
  | { kind: 'nameTooLong' }
  | { kind: 'sloganTooLong' }
  | { kind: 'alreadyPaired' }
  | { kind: 'network' };

function parseAnniversary(input: string): string | 'invalid' {
  const trimmed = input.trim();
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

  const [date, setDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);

  // Submit gate: anniversary is required (>=6 chars covers DD.MM.YY-style
  // partial input; the validator below catches the actual format).
  const canSubmit = date.trim().length >= 6 && !submitting;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setFormError(null);

    const parsed = parseAnniversary(date);
    if (parsed === 'invalid') {
      setFormError({ kind: 'dateInvalid' });
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length > NAME_MAX) {
      setFormError({ kind: 'nameTooLong' });
      return;
    }
    const trimmedSlogan = slogan.trim();
    if (trimmedSlogan.length > SLOGAN_MAX) {
      setFormError({ kind: 'sloganTooLong' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post<CreateCoupleResponse>('/api/couple', {
        // Couple name is optional in the prototype, but the BE T462 schema
        // requires it (1-60). Fall back to a stable default if the user
        // skipped — they can edit later in Profile. Empty submission with
        // no fallback would 400 at the validator.
        name: trimmedName || 'Hai đứa',
        anniversaryDate: parsed,
        slogan: trimmedSlogan ? trimmedSlogan : null,
      });
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
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'pair-wait' }],
        }),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError({ kind: 'alreadyPaired' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, date, name, slogan, setSession, navigation]);

  return {
    date,
    setDate,
    name,
    setName,
    slogan,
    setSlogan,
    submitting,
    canSubmit,
    formError,
    onSubmit,
  };
}
