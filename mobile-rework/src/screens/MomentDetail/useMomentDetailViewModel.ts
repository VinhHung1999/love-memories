import { useCallback, useEffect, useState } from 'react';

import { deleteMoment as apiDeleteMoment, getMoment } from '@/api/moments';
import { ApiError } from '@/lib/apiClient';
import { useMomentsStore } from '@/stores/momentsStore';

// T379 (Sprint 62) — ViewModel for MomentDetail. Reads `moments/:id` and
// subscribes to `useMomentsStore.version` so the detail page refetches when
// T378 enqueued photo uploads trickle in (the moment row exists before
// photos finish uploading — each photo success bumps the store).
//
// T398 (Sprint 63) — adds `remove()` for the more-dots → Delete flow.
// Success invalidates the moments store so the list refetches without the
// deleted card before the user navigates back.

export type MomentPhoto = {
  id: string;
  url: string;
  filename: string;
};

export type MomentDetail = {
  id: string;
  title: string;
  caption: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
  tags: string[];
  location: string | null;
};

type ErrorReason = 'network' | 'notFound' | 'unknown';

type State = {
  moment: MomentDetail | null;
  loading: boolean;
  error: ErrorReason | null;
};

export type RemoveResult =
  | { ok: true }
  | { ok: false; reason: 'network' | 'unknown' };

export function useMomentDetailViewModel(id: string | undefined) {
  const version = useMomentsStore((s) => s.version);
  const invalidate = useMomentsStore((s) => s.invalidate);
  const [state, setState] = useState<State>({
    moment: null,
    loading: true,
    error: null,
  });
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setState({ moment: null, loading: false, error: 'notFound' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const moment = await getMoment(id);
      setState({ moment, loading: false, error: null });
    } catch (err) {
      let reason: ErrorReason = 'unknown';
      if (err instanceof ApiError) {
        if (err.status === 404) reason = 'notFound';
        else if (err.status >= 500) reason = 'network';
      }
      setState({ moment: null, loading: false, error: reason });
    }
  }, [id]);

  const remove = useCallback(async (): Promise<RemoveResult> => {
    if (!id || removing) return { ok: false, reason: 'unknown' };
    setRemoving(true);
    try {
      await apiDeleteMoment(id);
      invalidate();
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, reason: err.status >= 500 ? 'network' : 'unknown' };
      }
      return { ok: false, reason: 'unknown' };
    } finally {
      setRemoving(false);
    }
  }, [id, invalidate, removing]);

  useEffect(() => {
    void load();
  }, [load, version]);

  return { ...state, reload: load, remove, removing };
}
