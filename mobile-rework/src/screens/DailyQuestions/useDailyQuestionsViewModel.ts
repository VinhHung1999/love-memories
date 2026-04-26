import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

import {
  type DailyQuestionHistoryItem,
  type DailyQuestionStreak,
  type DailyQuestionToday,
  getDailyQuestionHistory,
  getDailyQuestionStreak,
  getDailyQuestionToday,
  submitDailyQuestionAnswer,
} from '@/api/dailyQuestions';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 66 T427 — ViewModel for the DailyQuestionsScreen.
// State machine:
//   • loading       — first fetch in flight, no data yet
//   • error         — fetch failed and no cached data
//   • data          — today (always non-null after success), streak (default 0s)
//                     plus history (last N items including yesterday)
//
// Submit flow is optimistic: we immediately flip `today.myAnswer` to the
// pending text, fire the network call, and roll back on error. The BE's
// 409 ("already answered") guard becomes a soft no-op — we just refetch.

export type DailyQuestionsVM = {
  loading: boolean;
  refreshing: boolean;
  error: 'network' | 'unknown' | null;
  today: DailyQuestionToday | null;
  streak: DailyQuestionStreak | null;
  history: DailyQuestionHistoryItem[];
  myName: string;
  partnerName: string | null;
  refresh: () => Promise<void>;
  submit: (text: string) => Promise<{ ok: boolean; message?: string }>;
  submitting: boolean;
};

const HISTORY_PAGE_SIZE = 12;

export function useDailyQuestionsViewModel(): DailyQuestionsVM {
  const user = useAuthStore((s) => s.user);
  const [today, setToday] = useState<DailyQuestionToday | null>(null);
  const [streak, setStreak] = useState<DailyQuestionStreak | null>(null);
  const [history, setHistory] = useState<DailyQuestionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<'network' | 'unknown' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async (kind: 'initial' | 'refresh') => {
    if (kind === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [t, s, h] = await Promise.all([
        getDailyQuestionToday(),
        getDailyQuestionStreak(),
        getDailyQuestionHistory(1, HISTORY_PAGE_SIZE),
      ]);
      setToday(t);
      setStreak(s);
      // History includes the current day — drop it so the "earlier" list
      // doesn't duplicate the hero question card.
      setHistory(h.items.filter((it) => it.question.id !== t.question.id));
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      // 401 will already have triggered the apiClient refresh interceptor
      // — anything that lands here is a real network/server failure.
      setError(status === 0 ? 'network' : 'unknown');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll('initial');
  }, [fetchAll]);

  // Keep the screen fresh when partner answer arrives via push and the user
  // taps back into the tab.
  useFocusEffect(
    useCallback(() => {
      void fetchAll('refresh');
    }, [fetchAll]),
  );

  const submit = useCallback(
    async (text: string): Promise<{ ok: boolean; message?: string }> => {
      const trimmed = text.trim();
      if (!today || trimmed.length < 1) return { ok: false };
      const previous = today;
      // Optimistic flip — render the answered layout immediately.
      setToday({ ...today, myAnswer: trimmed });
      setSubmitting(true);
      try {
        await submitDailyQuestionAnswer(today.question.id, trimmed);
        // Refetch in the background to pull in partner answer + recompute
        // streak (the BE may have just incremented if partner already
        // answered).
        await fetchAll('refresh');
        return { ok: true };
      } catch (err) {
        // 409 = already-answered. Treat as success: BE already has our
        // answer, the optimistic flip stands; just resync from server.
        if (err instanceof ApiError && err.status === 409) {
          await fetchAll('refresh');
          return { ok: true };
        }
        // Roll back the optimistic flip on real failures.
        setToday(previous);
        return { ok: false, message: 'submitError' };
      } finally {
        setSubmitting(false);
      }
    },
    [today, fetchAll],
  );

  const refresh = useCallback(async () => {
    await fetchAll('refresh');
  }, [fetchAll]);

  return {
    loading,
    refreshing,
    error,
    today,
    streak,
    history,
    myName: user?.name ?? '',
    partnerName: today?.partnerName ?? null,
    submit,
    submitting,
    refresh,
  };
}
