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
//     PUT /api/profile (name only — joiner doesn't own couple settings)
//     router.replace('/(auth)/onboarding-done')       → T317: SKIPS /permissions
//
// Sprint 60 Build 23 (T313/T317/T318):
//   T313 — creator MUST pick a start date (gate canSubmit). Empty no longer
//          silently writes null; the date is the seed for the home-screen
//          relationship counter and skipping it caused returning users to
//          land on "0 ngày bên nhau".
//   T317 — joiner now also skips /permissions, mirroring creator. Permissions
//          gating moves to first-use prompts in (tabs) (location/camera) so
//          the wizard ends on the celebration screen, not a permissions wall.
//   T318 — joiner DOES NOT submit color or anniversaryDate. The inviter owns
//          those couple-level fields; joiner only fills their own profile name.
//          Date field is hidden in the view.
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
  | { kind: 'dateRequired' }
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

  // T306: creator = no coupleId yet (joiner POSTed /api/couple/join before
  // reaching this screen, so theirs is set). Drives both UI gates (T313 date
  // requirement, T318 date field hidden, T317 routing).
  const isCreator = !user?.coupleId;

  // T313: creator MUST pick start date. Joiner never sees the date field,
  // so it's not part of their canSubmit calculation.
  const canSubmit =
    nick.trim().length > 0 && (!isCreator || date.trim().length > 0) && !submitting;

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setFormError(null);
    const trimmedName = nick.trim();
    // T318: joiner doesn't submit anniversaryDate at all — creator owns the
    // couple-level fields. Skip parse + write entirely on the joiner branch.
    let parsedAnniversary: string | null = null;
    if (isCreator) {
      const parsed = parseAnniversary(date);
      if (parsed === 'invalid') {
        setFormError({ kind: 'dateInvalid' });
        return;
      }
      if (parsed === null) {
        // T313: defense in depth — canSubmit already blocks this, but if a
        // race lets it through, surface the error rather than silently writing.
        setFormError({ kind: 'dateRequired' });
        return;
      }
      parsedAnniversary = parsed;
    }

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
        // PUT name + couple settings in parallel — different rows, BE can't
        // atomically batch anyway, and parallel halves the RTT.
        await Promise.all([
          apiClient.put('/api/profile', { name: trimmedName }),
          apiClient.put('/api/couple', {
            color: String(colorIndex),
            anniversaryDate: parsedAnniversary,
          }),
        ]);
      } else {
        // T318: joiner only writes their own name. Color + start date are
        // creator-owned; touching /api/couple here would let the joiner
        // overwrite the inviter's choices on the same record.
        await apiClient.put('/api/profile', { name: trimmedName });
      }

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
      }
      // T317: both branches end on OnboardingDone. Permissions wizard removed
      // from the joiner path — first-use prompts in (tabs) handle it.
      router.replace('/(auth)/onboarding-done');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, nick, date, colorIndex, isCreator, setUser, setSession, router]);

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
    isCreator,
    onSubmit,
  };
}
