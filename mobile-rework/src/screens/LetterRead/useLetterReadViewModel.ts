import { useEffect, useState } from 'react';

import { getLetter, type LetterRow } from '@/api/letters';
import { ApiError } from '@/lib/apiClient';
import { useLettersStore } from '@/stores/lettersStore';

// T422 (Sprint 65) — Letter Read overlay VM.
//
// Single fetch on mount via GET /api/love-letters/:id. Backend automatically
// flips DELIVERED → READ for the recipient on this call (LoveLetterService.
// getOne L62-68); we don't fire the dedicated PATCH /:id/mark-read endpoint
// (Lu Q6 approved — it would 400 on the second open since the letter is
// already READ).
//
// Mark-read invalidation: after the first successful fetch we always bump
// `lettersStore.invalidate()` so the Letters list refetches and the unread
// pulse pill / Inbox badge update next focus. Idempotent enough to skip the
// "was actually unread before" gate — invalidate is just a cache tick.

type ErrorReason = 'network' | 'unknown';

type State = {
  letter: LetterRow | null;
  loading: boolean;
  error: ErrorReason | null;
};

const INITIAL: State = { letter: null, loading: true, error: null };

function reasonFor(err: unknown): ErrorReason {
  return err instanceof ApiError && err.status === 0 ? 'network' : 'unknown';
}

export function useLetterReadViewModel(id: string | undefined) {
  const [state, setState] = useState<State>(INITIAL);
  const invalidate = useLettersStore((s) => s.invalidate);

  useEffect(() => {
    if (!id) {
      setState({ letter: null, loading: false, error: 'unknown' });
      return;
    }
    let cancelled = false;
    setState({ letter: null, loading: true, error: null });
    (async () => {
      try {
        const letter = await getLetter(id);
        if (cancelled) return;
        setState({ letter, loading: false, error: null });
        invalidate();
      } catch (err) {
        if (cancelled) return;
        setState({ letter: null, loading: false, error: reasonFor(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, invalidate]);

  const reload = () => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    void getLetter(id)
      .then((letter) => {
        setState({ letter, loading: false, error: null });
        invalidate();
      })
      .catch((err) => {
        setState({ letter: null, loading: false, error: reasonFor(err) });
      });
  };

  return {
    letter: state.letter,
    loading: state.loading,
    error: state.error,
    reload,
  };
}
