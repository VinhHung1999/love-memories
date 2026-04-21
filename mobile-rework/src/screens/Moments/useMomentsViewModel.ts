import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient, ApiError } from '@/lib/apiClient';
import { useMomentsStore } from '@/stores/momentsStore';

// T376 (Sprint 62) — Moments list VM. Backend `GET /api/moments` returns the
// full couple's timeline in one shot (no server pagination yet — Boss locked
// "no BE work this sprint"). We paginate client-side: fetch once, slice into
// pages of PAGE_SIZE as `onEndReached` fires. Pull-to-refresh re-fetches.
//
// Subscribes to `momentsStore.version` so the list auto-refreshes after a new
// moment is created (T378 upload flow bumps `version` after POST + again
// after first photo + on last photo).

export type MomentPhoto = {
  id: string;
  url: string;
  filename: string;
};

export type MomentRow = {
  id: string;
  title: string;
  caption: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
};

const PAGE_SIZE = 20;

type ErrorReason = 'network' | 'unknown';

type State = {
  all: MomentRow[];
  pageCount: number;
  loading: boolean;
  refreshing: boolean;
  error: ErrorReason | null;
};

const INITIAL: State = {
  all: [],
  pageCount: 1,
  loading: true,
  refreshing: false,
  error: null,
};

export function useMomentsViewModel() {
  const version = useMomentsStore((s) => s.version);
  const [state, setState] = useState<State>(INITIAL);

  const fetchAll = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, refreshing: true, error: null }));
    }
    try {
      const rows = await apiClient.get<MomentRow[]>('/api/moments');
      setState({
        all: rows,
        pageCount: 1,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (err) {
      const reason: ErrorReason =
        err instanceof ApiError && err.status === 0 ? 'network' : 'unknown';
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: reason,
      }));
    }
  }, []);

  useEffect(() => {
    void fetchAll('initial');
  }, [fetchAll, version]);

  const onRefresh = useCallback(() => {
    void fetchAll('refresh');
  }, [fetchAll]);

  const onEndReached = useCallback(() => {
    setState((prev) => {
      const nextCount = prev.pageCount + 1;
      if (nextCount * PAGE_SIZE >= prev.all.length) {
        return { ...prev, pageCount: Math.ceil(prev.all.length / PAGE_SIZE) || 1 };
      }
      return { ...prev, pageCount: nextCount };
    });
  }, []);

  const visible = useMemo(
    () => state.all.slice(0, state.pageCount * PAGE_SIZE),
    [state.all, state.pageCount],
  );

  const hasMore = state.pageCount * PAGE_SIZE < state.all.length;

  return {
    moments: visible,
    total: state.all.length,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    hasMore,
    onRefresh,
    onEndReached,
    reload: () => fetchAll('initial'),
  };
}
