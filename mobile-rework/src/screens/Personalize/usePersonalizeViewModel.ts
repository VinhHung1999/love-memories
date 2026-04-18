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
// Submit fires PUT /api/profile (name) + PUT /api/couple ({color, anniversaryDate})
// in parallel. Anniversary is optional; empty string skips. Date parses as
// DD.MM.YYYY → ISO so BE Zod accepts.

const COLOR_COUNT = 4;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

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

    setSubmitting(true);
    try {
      // Send name + couple update in parallel — they touch different rows so
      // BE can't atomically batch anyway, and parallel halves the RTT.
      await Promise.all([
        apiClient.put('/api/profile', { name: trimmedName }),
        apiClient.put('/api/couple', {
          color: String(colorIndex),
          anniversaryDate: parsedAnniversary,
        }),
      ]);
      // Reflect updated name locally so OnboardingDone can greet the user.
      if (user) setUser({ ...user, name: trimmedName });
      router.replace('/(auth)/permissions');
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError({ kind: 'network' });
      } else {
        setFormError({ kind: 'network' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, nick, date, colorIndex, user, setUser, router]);

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
