import { useCallback, useEffect, useState } from 'react';

import { apiClient, ApiError } from '@/lib/apiClient';
import { useMomentsStore } from '@/stores/momentsStore';

// T379 (Sprint 62) — ViewModel for MomentDetail. Reads `moments/:id` and
// subscribes to `useMomentsStore.version` so the detail page refetches when
// T378 enqueued photo uploads trickle in (the moment row exists before
// photos finish uploading — each photo success bumps the store).

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

export function useMomentDetailViewModel(id: string | undefined) {
  const version = useMomentsStore((s) => s.version);
  const [state, setState] = useState<State>({
    moment: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!id) {
      setState({ moment: null, loading: false, error: 'notFound' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const moment = await apiClient.get<MomentDetail>(`/api/moments/${id}`);
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

  useEffect(() => {
    void load();
  }, [load, version]);

  return { ...state, reload: load };
}
