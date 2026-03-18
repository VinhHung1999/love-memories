import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { dailyQuestionsApi } from '../../lib/api';
import type { DailyQuestionToday, DailyQuestionHistoryItem } from '../../types';

export type DailyQuestionsTab = 'today' | 'history';

export function useDailyQuestionsViewModel() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DailyQuestionsTab>('today');
  const [answerText, setAnswerText] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  // ── Today's question ───────────────────────────────────────────────────────

  const {
    data: todayData,
    isLoading: todayLoading,
    error: todayError,
    refetch: refetchToday,
  } = useQuery<DailyQuestionToday>({
    queryKey: ['daily-question-today'],
    queryFn: dailyQuestionsApi.today,
    enabled: !!user,
    staleTime: 60_000,
  });

  // ── Streak ─────────────────────────────────────────────────────────────────

  const { data: streakData } = useQuery({
    queryKey: ['daily-questions-streak'],
    queryFn: dailyQuestionsApi.streak,
    enabled: !!user,
    staleTime: 60_000,
  });

  // ── History ────────────────────────────────────────────────────────────────

  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['daily-question-history', historyPage],
    queryFn: () => dailyQuestionsApi.history(historyPage, 20),
    enabled: !!user && activeTab === 'history',
    staleTime: 30_000,
  });

  // ── Submit answer ──────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!todayData?.question.id) throw new Error('No question');
      await dailyQuestionsApi.answer(todayData.question.id, answerText.trim());
    },
    onSuccess: (_, __, ___) => {
      // Optimistic update: immediately reflect answered state in UI
      const submittedAnswer = answerText.trim();
      queryClient.setQueryData<DailyQuestionToday>(['daily-question-today'], old =>
        old ? { ...old, myAnswer: submittedAnswer } : old,
      );
      setAnswerText('');
      setSubmitError(null);
      // Background refetch to get partner answer + full server state
      queryClient.invalidateQueries({ queryKey: ['daily-question-today'] });
      queryClient.invalidateQueries({ queryKey: ['daily-question-history'] });
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  const submitAnswer = useCallback(() => {
    if (!answerText.trim()) return;
    setSubmitError(null);
    submitMutation.mutate();
  }, [answerText, submitMutation]);

  // ── History pagination ─────────────────────────────────────────────────────

  const loadNextPage = useCallback(() => {
    if (historyData && historyPage < historyData.totalPages) {
      setHistoryPage(p => p + 1);
    }
  }, [historyData, historyPage]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const hasAnswered = !!todayData?.myAnswer;
  const historyItems: DailyQuestionHistoryItem[] = historyData?.items ?? [];

  return {
    // State
    activeTab,
    setActiveTab,
    answerText,
    setAnswerText,
    submitError,

    // Today
    todayData,
    todayLoading,
    todayError,
    hasAnswered,
    refetchToday,

    // History
    historyItems,
    historyLoading,
    historyPage,
    historyTotalPages: historyData?.totalPages ?? 1,
    refetchHistory,
    loadNextPage,

    // Streak
    currentStreak: streakData?.currentStreak ?? 0,
    longestStreak: streakData?.longestStreak ?? 0,
    lastAnsweredAt: streakData?.lastAnsweredAt ?? null,
    completedToday: streakData?.completedToday ?? false,

    // Actions
    submitAnswer,
    isSubmitting: submitMutation.isPending,

    // Navigation
    goBack: () => navigation.goBack(),
  };
}
