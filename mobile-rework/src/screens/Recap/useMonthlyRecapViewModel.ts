// Sprint 67 T452 — MonthlyRecap ViewModel.
//
// Orchestrates: parse `?month=` route param → resolve to a valid YYYY-MM
// (default = previous full month) → fetch /api/recap/monthly → expose ready /
// loading / error stages plus the cover-ready strings the View renders. The
// view stays props-only; all locale + couple-name plumbing happens here.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

import type { MonthlyRecapResponse } from './types';
import {
  describeMonth,
  isValidMonthStr,
  nameInitial,
  previousMonthStr,
} from './utils';

// Couple endpoint shape — same fetch the Profile / Dashboard / Letters VMs
// already use. Cover needs both names + initials for the avatar pair.
type CoupleUserLite = {
  id: string;
  name: string | null;
  avatar: string | null;
};

type CoupleLite = {
  id: string;
  users: CoupleUserLite[];
};

export type MonthlyRecapStage = 'loading' | 'ready' | 'empty' | 'error';

export type CoverPerson = { initial: string; gradientKey: 'A' | 'B' };

export type CoverInlineStat = { value: string; label: string };

export type CoverViewModel = {
  kicker: string; // 'RECAP · TH3, 2026'
  titleLine1: string; // 'Tháng 3' / 'Our'
  titleLine2: string; // 'của mình' / 'March'
  coupleNamesScript: string; // 'Lu & Zu'
  people: [CoverPerson, CoverPerson];
  coverKicker: string; // 'Nhìn lại · 31 ngày'
  inlineStats: [CoverInlineStat, CoverInlineStat, CoverInlineStat];
  scrollHint: string; // 'cuộn xuống' / 'scroll'
};

export type MonthlyRecapViewModel = {
  stage: MonthlyRecapStage;
  monthStr: string;
  data: MonthlyRecapResponse | null;
  errorMessage: string | null;
  cover: CoverViewModel | null;
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

// Compact integer formatter for the inline stat trio (cover) — keeps the
// 3-cell strip fitting in a portrait-width card. Numbers ≥ 1000 collapse to
// "1.2k" / "10k". Mirrors the prototype which hardcoded "2.1k" for words.
function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${Math.round(n / 1000)}k`;
}

export function useMonthlyRecapViewModel(): MonthlyRecapViewModel {
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const requestedMonth = useMemo(() => {
    const raw = Array.isArray(params.month) ? params.month[0] : params.month;
    return isValidMonthStr(raw) ? raw : previousMonthStr();
  }, [params.month]);

  const [stage, setStage] = useState<MonthlyRecapStage>('loading');
  const [data, setData] = useState<MonthlyRecapResponse | null>(null);
  const [partner, setPartner] = useState<CoupleUserLite | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Recap fetch is the gating call — couple lookup runs alongside but its
  // failure (or missing partner for solo accounts) doesn't push the stage to
  // error. Cover degrades gracefully: solo gets one initial.
  useEffect(() => {
    let cancelled = false;
    setStage('loading');
    setErrorMessage(null);
    Promise.all([
      apiClient.get<MonthlyRecapResponse>(`/api/recap/monthly?month=${requestedMonth}`),
      apiClient.get<CoupleLite>('/api/couple').catch(() => null),
    ])
      .then(([res, couple]) => {
        if (cancelled) return;
        setData(res);
        if (couple && user) {
          const other = couple.users.find((u) => u.id !== user.id) ?? null;
          setPartner(other);
        } else {
          setPartner(null);
        }
        // Empty = no moments AND no letters AND no daily Q answered. Cover
        // still renders (gradient is the welcome) but body sections are
        // suppressed via the empty stage.
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
  }, [requestedMonth, reloadKey, user]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const onClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  // Cover is built from whatever data we have — even on error/loading we
  // still want the gradient hero to show, so cover falls back to placeholder
  // numbers when data is missing.
  const cover = useMemo<CoverViewModel | null>(() => {
    const md = describeMonth(requestedMonth);
    const isVi = i18n.language?.toLowerCase().startsWith('vi') ?? true;

    const period = isVi ? md.formatted.vi : md.formatted.en;

    const titleLine1 = t('recap.monthly.cover.titleLine1', {
      n: md.monthNumber,
      name: isVi ? md.monthNameVi : md.monthNameEn,
    });
    const titleLine2 = t('recap.monthly.cover.titleLine2', {
      n: md.monthNumber,
      name: isVi ? md.monthNameVi : md.monthNameEn,
    });

    const myName = user?.name ?? null;
    const partnerName = partner?.name ?? null;
    const coupleNamesScript =
      [myName, partnerName].filter(Boolean).join(' & ') || '·';

    const people: [CoverPerson, CoverPerson] = [
      { initial: nameInitial(myName), gradientKey: 'A' },
      { initial: nameInitial(partnerName), gradientKey: 'B' },
    ];

    const days =
      data && data.startDate && data.endDate
        ? Math.max(
            1,
            Math.round(
              (Date.parse(data.endDate) - Date.parse(data.startDate)) /
                (24 * 60 * 60 * 1000),
            ) + 1,
          )
        : new Date(md.year, md.monthNumber, 0).getDate();

    const coverKicker = t('recap.monthly.cover.coverKicker', { days });

    const momentsN = data?.moments.count ?? 0;
    const lettersN =
      (data?.loveLetters.sent ?? 0) + (data?.loveLetters.received ?? 0);
    const tripsN = data?.trips ?? 0;

    const inlineStats: CoverViewModel['inlineStats'] = [
      {
        value: formatCompactNumber(momentsN),
        label: t('recap.monthly.cover.stat.moments'),
      },
      {
        value: formatCompactNumber(lettersN),
        label: t('recap.monthly.cover.stat.letters'),
      },
      {
        value: formatCompactNumber(tripsN),
        label: t('recap.monthly.cover.stat.trips'),
      },
    ];

    const scrollHint = t('recap.monthly.cover.scrollHint');

    return {
      kicker: t('recap.monthly.cover.kicker', { period }),
      titleLine1,
      titleLine2,
      coupleNamesScript,
      people,
      coverKicker,
      inlineStats,
      scrollHint,
    };
  }, [requestedMonth, i18n.language, t, user, partner, data]);

  return {
    stage,
    monthStr: requestedMonth,
    data,
    errorMessage,
    cover,
    closeLabel: t('recap.monthly.closeLabel'),
    loadingLabel: t('recap.monthly.loading'),
    emptyTitle: t('recap.monthly.empty.title'),
    emptyBody: t('recap.monthly.empty.body'),
    errorTitle: t('recap.monthly.error.title'),
    errorBody: t('recap.monthly.error.body'),
    retryLabel: t('recap.monthly.error.retry'),
    refresh,
    onClose,
  };
}
