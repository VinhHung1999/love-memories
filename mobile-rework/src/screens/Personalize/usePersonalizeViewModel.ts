import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T286 — Personalize. Spec deviation from prototype (pairing.jsx:272):
// the prototype shows BOTH 'Your nickname' and 'Their nickname'. PO ruled
// (sprint-60-pairing.md §Personalize) that each user PUTs only their own name
// to avoid the data race where the joiner overwrites the inviter's partner-nick.
// We keep 3 input cells: name + color + anniversaryDate (DD.MM.YYYY).
//
// T306 (Sprint 60 Bundle 4) — Continue is now the commit point for the
// creator flow, not pair-create. Two branches:
//
//   creator  (user.coupleId == null)
//     POST /api/couple                               → couple + new JWTs
//     setSession()                                    → store new tokens
//     Promise.all(PUT /api/profile, PUT /api/couple)  → name + color + date
//     PATCH /api/auth/me/onboarding-complete          → best-effort server commit
//     router.replace('/(auth)/onboarding-done')       → SKIPS /permissions
//
//   joiner   (user.coupleId != null, already joined via POST /api/couple/join)
//     Promise.all(PUT /api/profile, PUT /api/couple)  → name + color + date
//     router.replace('/(auth)/permissions')           → unchanged legacy flow
//
// We DO NOT flip setOnboardingComplete(true) locally — the gate in app/_layout
// would instantly route the user into (tabs) and OnboardingDone would never
// render. OnboardingDone owns the local flip + second PATCH (idempotent).
//
// Orphaned couple on mid-chain failure is accepted for MVP (logged as B41).

const COLOR_COUNT = 4;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

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

type FormError =
  | { kind: 'nameRequired' }
  | { kind: 'dateInvalid' }
  | { kind: 'network' };

function parseAnniversary(input: string): string | null | 'invalid' {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = DATE_RE.exec(trimmed);
  if (!m) return 'invalid';
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  // Light sanity bounds; BE re-parses with new Date(). Year >= 1900 keeps the
  // user from accidentally pasting a 4-digit code into the date field.
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return 'invalid';
  }
  // Construct ISO with month-1 (JS Date) at noon UTC so DST shift doesn't flip
  // the date when BE re-parses with new Date().
  const iso = new Date(Date.UTC(year, month - 1, day, 12)).toISOString();
  return iso;
}

export function usePersonalizeViewModel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);

  const [nick, setNick] = useState<string>(user?.name ?? '');
  const [colorIndex, setColorIndex] = useState<number>(0);
  const [date, setDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);

  const colorIndexes = useMemo<number[]>(
    () => Array.from({ length: COLOR_COUNT }, (_, i) => i),
    [],
  );

  const canSubmit = nick.trim().length > 0 && !submitting;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setFormError(null);
    const trimmedName = nick.trim();
    const parsedAnniversary = parseAnniversary(date);
    if (parsedAnniversary === 'invalid') {
      setFormError({ kind: 'dateInvalid' });
      return;
    }

    // T306: creator path is anyone arriving at Personalize without a coupleId.
    // The joiner went through POST /api/couple/join before landing here, so
    // their coupleId is already set. This check survives re-entries cleanly —
    // once POST /api/couple succeeds in the creator branch, setSession writes
    // the new coupleId so a retry would see coupleId set and not double-POST.
    const isCreator = !user?.coupleId;

    setSubmitting(true);
    try {
      if (isCreator) {
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
      }

      // PUT name + couple settings in parallel — different rows, BE can't
      // atomically batch anyway, and parallel halves the RTT.
      await Promise.all([
        apiClient.put('/api/profile', { name: trimmedName }),
        apiClient.put('/api/couple', {
          color: String(colorIndex),
          anniversaryDate: parsedAnniversary,
        }),
      ]);

      // Reflect updated name locally so OnboardingDone can greet the user.
      // Re-read from store rather than closing over `user`, since the creator
      // branch just replaced the session above.
      const currentUser = useAuthStore.getState().user;
      if (currentUser) setUser({ ...currentUser, name: trimmedName });

      if (isCreator) {
        // Server-side commit. Best-effort — OnboardingDone retries on entry.
        // We do NOT call setOnboardingComplete(true) here; the gate would
        // immediately route into (tabs) and skip OnboardingDone.
        try {
          await apiClient.patch('/api/auth/me/onboarding-complete', { value: true });
        } catch {
          // ignore — OnboardingDone will retry
        }
        router.replace('/(auth)/onboarding-done');
      } else {
        router.replace('/(auth)/permissions');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, nick, date, colorIndex, user, setUser, setSession, router]);

  return {
    nick,
    setNick,
    colorIndex,
    setColorIndex,
    colorIndexes,
    date,
    setDate,
    submitting,
    canSubmit,
    formError,
    onSubmit,
  };
}
