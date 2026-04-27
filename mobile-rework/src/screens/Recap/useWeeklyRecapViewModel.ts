// Sprint 67 T456 — WeeklyRecap ViewModel.
//
// Compact 5-section editorial scroll: cover · by-numbers (3 stats) ·
// 7-day heatmap row · top moment of the week · closing line + Send-to-
// partner CTA. No prototype reference — derived from MonthlyRecap's
// proven primitives at smaller scale per spec T456.
//
// Default = previous full ISO week. Empty week → friendly "Tuần này yên
// ắng quá 🐶" state.

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { env } from '@/config/env';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

import type { PaletteKey } from '@/theme/palettes';

import type { WeeklyRecapResponse } from './types';
import {
  formatWeekRange,
  isValidWeekStr,
  nameInitial,
  previousWeekStr,
} from './utils';

import type {
  ByNumbersStat,
  CoverPerson,
  CoverViewModel,
} from './useMonthlyRecapViewModel';

type CoupleUserLite = {
  id: string;
  name: string | null;
  avatar: string | null;
};

type CoupleLite = {
  id: string;
  users: CoupleUserLite[];
};

export type WeeklyRecapStage = 'loading' | 'ready' | 'empty' | 'error';

export type WeeklyByNumbersViewModel = {
  kicker: string;
  title: string;
  stats: [ByNumbersStat, ByNumbersStat, ByNumbersStat];
};

export type WeeklyHeatmapViewModel = {
  kicker: string;
  title: string;
  hint: string;
  legendLess: string;
  legendMore: string;
  busiestPrefix: string;
  momentsLabel: string;
  data: number[];      // length 7
  labels: string[];    // weekday shorts ['T2','T3',…,'CN'] / ['Mon',…,'Sun']
};

export type WeeklyTopMomentVM = {
  id: string;
  rank: 1;
  palette: PaletteKey;
  title: string;
  sub: string;
};

export type WeeklyTopMomentViewModel = {
  kicker: string;
  title: string;
  card: WeeklyTopMomentVM | null;
  emptyBody: string;
};

export type WeeklyClosingViewModel = {
  body: string;
  signature: string;
  shareLabel: string;
  onShare: () => void;
};

export type WeeklyRecapViewModel = {
  stage: WeeklyRecapStage;
  weekStr: string;
  data: WeeklyRecapResponse | null;
  errorMessage: string | null;
  cover: CoverViewModel | null;
  byNumbers: WeeklyByNumbersViewModel | null;
  heatmap: WeeklyHeatmapViewModel | null;
  topMoment: WeeklyTopMomentViewModel | null;
  closing: WeeklyClosingViewModel | null;
  closeLabel: string;
  loadingLabel: string;
  emptyTitle: string;
  emptyBody: string;
  errorTitle: string;
  errorBody: string;
  retryLabel: string;
  refresh: () => void;
  onClose: () => void;
};

function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(n / 1000)}k`;
}

const WEEKDAY_LABELS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function useWeeklyRecapViewModel(): WeeklyRecapViewModel {
  const router = useRouter();
  const params = useLocalSearchParams<{ week?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const requestedWeek = useMemo(() => {
    const raw = Array.isArray(params.week) ? params.week[0] : params.week;
    return isValidWeekStr(raw) ? raw : previousWeekStr();
  }, [params.week]);

  const [stage, setStage] = useState<WeeklyRecapStage>('loading');
  const [data, setData] = useState<WeeklyRecapResponse | null>(null);
  const [partner, setPartner] = useState<CoupleUserLite | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStage('loading');
    setErrorMessage(null);
    Promise.all([
      apiClient.get<WeeklyRecapResponse>(`/api/recap/weekly?week=${requestedWeek}`),
      apiClient.get<CoupleLite>('/api/couple').catch(() => null),
    ])
      .then(([res, couple]) => {
        if (cancelled) return;
        setData(res);
        setCoupleId(couple?.id ?? null);
        if (couple && user) {
          const other = couple.users.find((u) => u.id !== user.id) ?? null;
          setPartner(other);
        } else {
          setPartner(null);
        }
        const isEmpty =
          res.moments.count === 0 &&
          res.loveLetters.sent + res.loveLetters.received === 0 &&
          res.questions.count === 0;
        setStage(isEmpty ? 'empty' : 'ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) setErrorMessage(err.message);
        else setErrorMessage(String(err));
        setStage('error');
      });
    return () => {
      cancelled = true;
    };
  }, [requestedWeek, reloadKey, user]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const onClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const isVi = i18n.language?.toLowerCase().startsWith('vi') ?? true;
  const initialA = nameInitial(user?.name);
  const initialB = nameInitial(partner?.name);

  // ─── Cover ────────────────────────────────────────────────────────────
  // Reuses the Monthly RecapCover component — just pass a CoverViewModel
  // shaped for weekly (title = "Tuần này\n{range}", stats trio = moments
  // / letters / questions).
  const cover = useMemo<CoverViewModel | null>(() => {
    const range = data
      ? formatWeekRange(data.startDate, data.endDate, isVi ? 'vi' : 'en')
      : '';
    const period = range || requestedWeek;

    const myName = user?.name ?? null;
    const partnerName = partner?.name ?? null;
    const coupleNamesScript =
      [myName, partnerName].filter(Boolean).join(' & ') || '·';

    const people: [CoverPerson, CoverPerson] = [
      { initial: initialA, gradientKey: 'A' },
      { initial: initialB, gradientKey: 'B' },
    ];

    const momentsN = data?.moments.count ?? 0;
    const lettersN =
      (data?.loveLetters.sent ?? 0) + (data?.loveLetters.received ?? 0);
    const questionsN = data?.questions.count ?? 0;

    return {
      kicker: t('recap.weekly.cover.kicker', { period }),
      titleLine1: t('recap.weekly.cover.titleLine1'),
      titleLine2: range,
      coupleNamesScript,
      people,
      coverKicker: t('recap.weekly.cover.coverKicker'),
      inlineStats: [
        {
          value: formatCompactNumber(momentsN),
          label: t('recap.weekly.cover.stat.moments'),
        },
        {
          value: formatCompactNumber(lettersN),
          label: t('recap.weekly.cover.stat.letters'),
        },
        {
          value: formatCompactNumber(questionsN),
          label: t('recap.weekly.cover.stat.questions'),
        },
      ],
      scrollHint: t('recap.weekly.cover.scrollHint'),
    };
  }, [requestedWeek, isVi, t, data, user, partner, initialA, initialB]);

  // ─── 01 By the numbers (3 stats) ──────────────────────────────────────
  const byNumbers = useMemo<WeeklyByNumbersViewModel | null>(() => {
    if (!data) return null;
    const stats: WeeklyByNumbersViewModel['stats'] = [
      {
        value: formatCompactNumber(data.moments.count),
        label: t('recap.weekly.section.byNumbers.moments'),
        bgClassName: 'bg-primary-soft',
        colorClassName: 'text-primary',
        circleClassName: 'bg-primary',
      },
      {
        value: formatCompactNumber(
          data.loveLetters.sent + data.loveLetters.received,
        ),
        label: t('recap.weekly.section.byNumbers.letters'),
        bgClassName: 'bg-secondary-soft',
        colorClassName: 'text-secondary',
        circleClassName: 'bg-secondary',
      },
      {
        value: formatCompactNumber(data.questions.count),
        label: t('recap.weekly.section.byNumbers.questions'),
        bgClassName: 'bg-accent-soft',
        colorClassName: 'text-accent',
        circleClassName: 'bg-accent',
      },
    ];
    return {
      kicker: '01',
      title: t('recap.weekly.section.byNumbers.title'),
      stats,
    };
  }, [data, t]);

  // ─── 02 Heatmap (7 cells, 1 row) ──────────────────────────────────────
  const heatmap = useMemo<WeeklyHeatmapViewModel | null>(() => {
    if (!data) return null;
    return {
      kicker: '02',
      title: t('recap.weekly.section.heatmap.title'),
      hint: t('recap.weekly.section.heatmap.hint'),
      legendLess: t('recap.monthly.section.heatmap.legendLess'),
      legendMore: t('recap.monthly.section.heatmap.legendMore'),
      busiestPrefix: t('recap.weekly.section.heatmap.busiestPrefix'),
      momentsLabel: t('recap.weekly.section.byNumbers.moments'),
      data: data.heatmap,
      labels: isVi ? WEEKDAY_LABELS_VI : WEEKDAY_LABELS_EN,
    };
  }, [data, t, isVi]);

  // ─── 03 Top moment of the week (1 big card) ───────────────────────────
  const topMoment = useMemo<WeeklyTopMomentViewModel | null>(() => {
    if (!data) return null;
    if (data.topMoments.length === 0) {
      return {
        kicker: '03',
        title: t('recap.weekly.section.topMoment.title'),
        card: null,
        emptyBody: t('recap.weekly.section.topMoment.emptyBody'),
      };
    }
    const m = data.topMoments[0]!;
    const sub = [
      m.location,
      m.photoCount > 0
        ? t('recap.monthly.section.topMoments.photos', { count: m.photoCount })
        : null,
      m.reactionCount > 0
        ? t('recap.monthly.section.topMoments.reactions', { count: m.reactionCount })
        : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      kicker: '03',
      title: t('recap.weekly.section.topMoment.title'),
      card: {
        id: m.id,
        rank: 1,
        palette: m.palette,
        title: m.title,
        sub,
      },
      emptyBody: t('recap.weekly.section.topMoment.emptyBody'),
    };
  }, [data, t]);

  // ─── 04 Closing line + single Send CTA ────────────────────────────────
  const onShare = useCallback(async () => {
    if (!coupleId) return;
    const shareUrl = `${env.appBaseUrl.replace(/\/$/, '')}/recap/${coupleId}/${requestedWeek}`;
    try {
      await Clipboard.setStringAsync(shareUrl);
      Alert.alert(
        t('recap.monthly.actions.shareSuccessTitle'),
        t('recap.monthly.actions.shareSuccessBody'),
      );
    } catch {
      Alert.alert(
        t('recap.monthly.actions.shareErrorTitle'),
        t('recap.monthly.actions.shareErrorBody'),
      );
    }
  }, [coupleId, requestedWeek, t]);

  const closing = useMemo<WeeklyClosingViewModel | null>(() => {
    if (!data) return null;
    const range = formatWeekRange(data.startDate, data.endDate, isVi ? 'vi' : 'en');
    const myName = user?.name ?? '·';
    const partnerName = partner?.name ?? null;
    const signature = partnerName
      ? `${myName} & ${partnerName} · ${range}`
      : `${myName} · ${range}`;
    return {
      body: t('recap.weekly.closing.body'),
      signature,
      shareLabel: partnerName
        ? t('recap.monthly.actions.shareLabel', { partner: partnerName })
        : t('recap.monthly.actions.shareLabelSolo'),
      onShare,
    };
  }, [data, t, user, partner, isVi, onShare]);

  return {
    stage,
    weekStr: requestedWeek,
    data,
    errorMessage,
    cover,
    byNumbers,
    heatmap,
    topMoment,
    closing,
    closeLabel: t('recap.weekly.closeLabel'),
    loadingLabel: t('recap.weekly.loading'),
    emptyTitle: t('recap.weekly.empty.title'),
    emptyBody: t('recap.weekly.empty.body'),
    errorTitle: t('recap.weekly.error.title'),
    errorBody: t('recap.weekly.error.body'),
    retryLabel: t('recap.weekly.error.retry'),
    refresh,
    onClose,
  };
}
