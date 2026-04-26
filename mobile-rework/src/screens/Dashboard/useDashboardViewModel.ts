import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type DailyQuestionStreak,
  type DailyQuestionToday,
  getDailyQuestionStreak,
  getDailyQuestionToday,
} from '@/api/dailyQuestions';
import { type VibeKey, getTodayVibe } from '@/api/dailyVibes';
import { ApiError, apiClient } from '@/lib/apiClient';
import {
  type MomentRow,
  useMomentsViewModel,
} from '@/screens/Moments/useMomentsViewModel';
import { useAuthStore } from '@/stores/authStore';

// T375 (Sprint 62) — Dashboard VM: thin wrapper over useMomentsViewModel.
// T415 (Sprint 64) — extended to hydrate couple (you, partner, anniversary) for
// the cinematic Timer Hero. /api/couple is refetched on tab focus (silent) so
// edits from ProfileScreen (AnniversarySheet, CoupleNameSheet) land on
// Dashboard without a manual reload. Anniversary fallback: 2022-11-14 when the
// couple hasn't set one yet — the useRelationshipTime hook applies the same
// constant, but we expose `anniversarySource` ('couple' | 'fallback') so the
// view can badge the fallback state as TODO-set-your-own in a future sprint.

type CoupleUser = {
  id: string;
  name: string | null;
  avatar: string | null;
};

type CoupleResponse = {
  id: string;
  name: string | null;
  anniversaryDate: string | null;
  users: CoupleUser[];
};

export type HeroPerson = {
  name: string;
  initial: string;
  avatarUrl: string | null;
};

export type DashboardVM = {
  userName: string | null;
  latest: MomentRow | null;
  count: number;
  loading: boolean;
  error: 'network' | 'unknown' | null;
  reload: () => void;
  you: HeroPerson;
  partner: HeroPerson | null;
  coupleName: string | null;
  anniversaryDate: Date | null;
  anniversarySource: 'couple' | 'fallback';
  // Sprint 66 T428 — Daily Q&A snapshot powering DailyQCard.
  todayQuestion: DailyQuestionToday | null;
  streakCount: number;
  completedToday: boolean;
  // Whether the partner has answered today's question. Only safely
  // resolvable AFTER the user has answered (BE locks partnerAnswer until
  // then) — until that point treat the partner-pending pill as "unknown".
  partnerHasAnswered: boolean;
  myHasAnswered: boolean;
  // Sprint 66 T436 — current VN-day vibe (read-only on Dashboard;
  // selection happens on DailyQuestionsScreen).
  vibe: VibeKey | null;
};

function toInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return '·';
  return trimmed[0]!.toUpperCase();
}

export function useDashboardViewModel(): DashboardVM {
  const user = useAuthStore((s) => s.user);
  const moments = useMomentsViewModel();

  const [couple, setCouple] = useState<CoupleResponse | null>(null);
  const [todayQuestion, setTodayQuestion] = useState<DailyQuestionToday | null>(null);
  const [streak, setStreak] = useState<DailyQuestionStreak | null>(null);
  const [vibe, setVibe] = useState<VibeKey | null>(null);

  const loadCouple = useCallback(async () => {
    if (!user?.coupleId) {
      setCouple(null);
      return;
    }
    try {
      const res = await apiClient.get<CoupleResponse>('/api/couple');
      setCouple(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCouple(null);
      }
      // network/unknown errors fall through — TimerHero will render with the
      // fallback anniversary until the next focus refetch succeeds.
    }
  }, [user?.coupleId]);

  // Sprint 66 T428 — pulls today + streak together so DailyQCard can render
  // both the current question and the streak chip without a second roundtrip.
  // Hidden entirely when the user has no couple yet (the BE guards against
  // requests without coupleId; calling them would 401/400 anyway).
  const loadDailyQuestion = useCallback(async () => {
    if (!user?.coupleId) {
      setTodayQuestion(null);
      setStreak(null);
      setVibe(null);
      return;
    }
    try {
      const [today, streakRes, vibeRes] = await Promise.all([
        getDailyQuestionToday(),
        getDailyQuestionStreak(),
        getTodayVibe(),
      ]);
      setTodayQuestion(today);
      setStreak(streakRes);
      setVibe(vibeRes?.vibeKey ?? null);
    } catch {
      // 404 (no questions seeded), 500, or network — keep last good values.
      // The card hides itself when todayQuestion stays null.
    }
  }, [user?.coupleId]);

  useEffect(() => {
    void loadCouple();
    void loadDailyQuestion();
  }, [loadCouple, loadDailyQuestion]);

  useFocusEffect(
    useCallback(() => {
      void loadCouple();
      void loadDailyQuestion();
    }, [loadCouple, loadDailyQuestion]),
  );

  return useMemo<DashboardVM>(() => {
    const youName = user?.name ?? '';
    const you: HeroPerson = {
      name: youName,
      initial: toInitial(youName),
      avatarUrl: user?.avatarUrl ?? null,
    };

    const partnerUser = couple?.users.find((u) => u.id !== user?.id) ?? null;
    const partner: HeroPerson | null = partnerUser
      ? {
          name: partnerUser.name ?? '',
          initial: toInitial(partnerUser.name),
          avatarUrl: partnerUser.avatar ?? null,
        }
      : null;

    const anniversaryIso = couple?.anniversaryDate ?? null;
    const parsed = anniversaryIso ? new Date(anniversaryIso) : null;
    const anniversaryDate =
      parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;

    const myHasAnswered = !!todayQuestion?.myAnswer;
    // BE only populates partnerAnswer once myAnswer is set. Treat the
    // partner-pending state as "unknown until you answer first".
    const partnerHasAnswered = myHasAnswered ? !!todayQuestion?.partnerAnswer : false;

    return {
      userName: youName || null,
      latest: moments.moments[0] ?? null,
      count: moments.total,
      loading: moments.loading,
      error: moments.error,
      reload: moments.reload,
      you,
      partner,
      coupleName: couple?.name ?? null,
      anniversaryDate,
      anniversarySource: anniversaryDate ? 'couple' : 'fallback',
      todayQuestion,
      streakCount: streak?.currentStreak ?? 0,
      completedToday: streak?.completedToday ?? false,
      partnerHasAnswered,
      myHasAnswered,
      vibe,
    };
  }, [
    user?.id,
    user?.name,
    user?.avatarUrl,
    couple,
    moments.moments,
    moments.total,
    moments.loading,
    moments.error,
    moments.reload,
    todayQuestion,
    streak,
    vibe,
  ]);
}
