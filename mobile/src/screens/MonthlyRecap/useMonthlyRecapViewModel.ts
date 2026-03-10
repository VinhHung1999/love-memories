import { useState, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { recapApi } from '../../lib/api';
import type { MonthlyRecap } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────

export function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function prevMonthStr(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y!, m! - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonthStr(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y!, m! - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthDisplay(s: string): string {
  const [y, m] = s.split('-');
  return `Tháng ${m}/${y}`;
}

export function formatTime(ms: number): string {
  if (!ms) return '0m';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ── Slide definitions ──────────────────────────────────────────────────────

export interface SlideData {
  id: string;
  colors: [string, string, string];  // LinearGradient 3-stop
  emoji: string;
  type: 'intro' | 'moments' | 'cooking' | 'foodspots' | 'letters' | 'dates' | 'goals' | 'outro';
  bigNumber?: number;
  bigLabel?: string;
  subLine?: string;
  caption?: string;
  photos?: string[];
}

export function buildSlides(recap: MonthlyRecap, month: string, intro?: string | null, outro?: string | null): SlideData[] {
  const slides: SlideData[] = [];
  const totalLetters = recap.loveLetters.sent + recap.loveLetters.received;
  const momentPhotos = recap.moments.highlights.flatMap(h => h.photos);

  // Intro
  slides.push({
    id: 'intro',
    colors: ['#f9a8d4', '#fb7185', '#f97316'],
    emoji: '💕',
    type: 'intro',
    caption: intro ?? undefined,
  });

  // Moments
  if (recap.moments.count > 0) {
    slides.push({
      id: 'moments',
      colors: ['#c084fc', '#a855f7', '#7c3aed'],
      emoji: '📸',
      type: 'moments',
      bigNumber: recap.moments.count,
      bigLabel: 'kỷ niệm',
      subLine: recap.moments.photoCount > 0 ? `${recap.moments.photoCount} bức ảnh đã chụp` : undefined,
      caption: recap.moments.highlights[0]?.title ? `"${recap.moments.highlights[0].title}"` : undefined,
      photos: momentPhotos,
    });
  }

  // Cooking
  if (recap.cooking.count > 0) {
    slides.push({
      id: 'cooking',
      colors: ['#fb923c', '#f97316', '#ea580c'],
      emoji: '🍳',
      type: 'cooking',
      bigNumber: recap.cooking.count,
      bigLabel: 'lần nấu ăn cùng nhau',
      subLine: recap.cooking.totalTimeMs > 0 ? `Tổng ${formatTime(recap.cooking.totalTimeMs)} trong bếp` : undefined,
      caption: recap.cooking.recipes.length > 0 ? recap.cooking.recipes.slice(0, 3).join(', ') : undefined,
      photos: recap.cooking.photos,
    });
  }

  // Food spots
  if (recap.foodSpots.count > 0) {
    slides.push({
      id: 'foodspots',
      colors: ['#4ade80', '#22c55e', '#16a34a'],
      emoji: '🍜',
      type: 'foodspots',
      bigNumber: recap.foodSpots.count,
      bigLabel: 'quán mới khám phá',
      caption: recap.foodSpots.names.length > 0 ? recap.foodSpots.names.slice(0, 3).join(', ') : undefined,
      photos: recap.foodSpots.photos,
    });
  }

  // Love letters
  if (totalLetters > 0) {
    slides.push({
      id: 'letters',
      colors: ['#f9a8d4', '#ec4899', '#be185d'],
      emoji: '💌',
      type: 'letters',
      bigNumber: totalLetters,
      bigLabel: 'thư tình',
      subLine: `${recap.loveLetters.sent} gửi · ${recap.loveLetters.received} nhận`,
    });
  }

  // Date plans
  if (recap.datePlans.count > 0) {
    slides.push({
      id: 'dates',
      colors: ['#67e8f9', '#06b6d4', '#0284c7'],
      emoji: '🌹',
      type: 'dates',
      bigNumber: recap.datePlans.count,
      bigLabel: 'buổi hẹn hò',
    });
  }

  // Goals
  if (recap.goalsCompleted > 0) {
    slides.push({
      id: 'goals',
      colors: ['#fde68a', '#fbbf24', '#d97706'],
      emoji: '🎯',
      type: 'goals',
      bigNumber: recap.goalsCompleted,
      bigLabel: 'mục tiêu hoàn thành',
    });
  }

  // Outro
  slides.push({
    id: 'outro',
    colors: ['#f9a8d4', '#fb7185', '#f97316'],
    emoji: '🎉',
    type: 'outro',
    caption: outro ?? undefined,
  });

  return slides;
}

// ── ViewModel ──────────────────────────────────────────────────────────────

export function useMonthlyRecapViewModel(initialMonth?: string) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [month, setMonth] = useState(initialMonth ?? currentMonthStr());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: recap, isLoading } = useQuery<MonthlyRecap>({
    queryKey: ['recap', 'monthly', month],
    queryFn: () => recapApi.monthly(month),
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: captionData } = useQuery<{ intro?: string | null; outro?: string | null }>({
    queryKey: ['recap', 'monthly-caption', month],
    queryFn: () => recapApi.monthlyCaption(month),
    enabled: !!recap && !!(
      recap.moments.count + recap.cooking.count + recap.foodSpots.count +
      recap.datePlans.count + recap.loveLetters.sent + recap.loveLetters.received +
      recap.goalsCompleted
    ),
    staleTime: 5 * 60_000,
  });

  const slides = useMemo(
    () => recap ? buildSlides(recap, month, captionData?.intro, captionData?.outro) : [],
    [recap, month, captionData],
  );

  const isEmpty = !!recap && (
    recap.moments.count === 0 &&
    recap.cooking.count === 0 &&
    recap.foodSpots.count === 0 &&
    recap.datePlans.count === 0 &&
    recap.loveLetters.sent + recap.loveLetters.received === 0 &&
    recap.goalsCompleted === 0
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  const advance = useCallback(() => {
    setCurrentIdx(i => {
      if (i >= slides.length - 1) { navigation.goBack(); return i; }
      return i + 1;
    });
  }, [slides.length, navigation]);

  const retreat = useCallback(() => {
    setCurrentIdx(i => Math.max(0, i - 1));
  }, []);

  const close = useCallback(() => navigation.goBack(), [navigation]);

  const goToPrevMonth = useCallback(() => {
    setMonth(m => prevMonthStr(m));
    setCurrentIdx(0);
  }, []);

  const goToNextMonth = useCallback(() => {
    const next = nextMonthStr(month);
    if (next <= currentMonthStr()) {
      setMonth(next);
      setCurrentIdx(0);
    }
  }, [month]);

  const canGoNext = nextMonthStr(month) <= currentMonthStr();

  return {
    month,
    slides,
    currentIdx,
    isPaused,
    setIsPaused,
    isLoading,
    isEmpty,
    advance,
    retreat,
    close,
    goToPrevMonth,
    goToNextMonth,
    canGoNext,
    formatMonthDisplay,
  };
}
