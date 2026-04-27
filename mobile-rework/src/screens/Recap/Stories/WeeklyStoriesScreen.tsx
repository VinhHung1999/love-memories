// Sprint 67 T460 — Stories container for weekly recap. Mirrors
// MonthlyStoriesScreen at smaller scale.

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { env } from '@/config/env';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

import { composeWeeklySlides } from './composeWeekly';
import { RecapStoriesScreen } from './RecapStoriesScreen';
import type { WeeklyRecapResponse } from '../types';
import {
  defaultWeekStr,
  formatWeekRange,
  isValidWeekStr,
  offsetWeekStr,
} from '../utils';

type CoupleUserLite = { id: string; name: string | null; avatar: string | null };
type CoupleLite = { id: string; users: CoupleUserLite[] };

// Quick "Tuần 17 · 2026" / "Week 17 · 2026" label from a YYYY-Www string,
// used when the BE response can't be reached for the fallback toast.
function labelWeek(weekStr: string, isVi: boolean): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!m) return weekStr;
  const year = m[1];
  const week = String(Number(m[2]));
  return isVi ? `Tuần ${week} · ${year}` : `Week ${week} · ${year}`;
}

export function WeeklyStoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ week?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  // Sprint 67 D4 — day-based default (Fri/Sat/Sun → current week; otherwise
  // previous full week). Explicit `?week=` always wins.
  const initialWeekStr = useMemo(() => {
    const raw = Array.isArray(params.week) ? params.week[0] : params.week;
    return isValidWeekStr(raw) ? raw : defaultWeekStr();
  }, [params.week]);
  const [weekStr, setWeekStr] = useState<string>(initialWeekStr);
  useEffect(() => {
    setWeekStr(initialWeekStr);
  }, [initialWeekStr]);

  const [stage, setStage] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [data, setData] = useState<WeeklyRecapResponse | null>(null);
  const [partner, setPartner] = useState<CoupleUserLite | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  // Walk back at most 12 weeks (~3 months) looking for a populated period.
  const FALLBACK_LIMIT = 12;

  useEffect(() => {
    let cancelled = false;
    let fallbackHops = 0;
    let target = weekStr;

    setStage('loading');

    const tryFetch = (): void => {
      Promise.all([
        apiClient.get<WeeklyRecapResponse>(`/api/recap/weekly?week=${target}`),
        apiClient.get<CoupleLite>('/api/couple').catch(() => null),
      ])
        .then(([res, couple]) => {
          if (cancelled) return;
          const isEmpty =
            res.moments.count === 0 &&
            res.loveLetters.sent + res.loveLetters.received === 0 &&
            res.questions.count === 0;
          if (isEmpty && fallbackHops < FALLBACK_LIMIT) {
            fallbackHops += 1;
            target = offsetWeekStr(target, -1);
            tryFetch();
            return;
          }
          setData(res);
          setCoupleId(couple?.id ?? null);
          setPartner(
            couple && user ? couple.users.find((u) => u.id !== user.id) ?? null : null,
          );
          if (fallbackHops > 0) {
            const isVi = i18n.language?.toLowerCase().startsWith('vi') ?? true;
            const requested = labelWeek(weekStr, isVi);
            const landed =
              formatWeekRange(res.startDate, res.endDate, isVi ? 'vi' : 'en') ||
              labelWeek(target, isVi);
            Alert.alert(
              t('recap.weekly.fallback.title'),
              t('recap.weekly.fallback.body', { requested, landed }),
            );
            setWeekStr(target);
          }
          setStage(isEmpty ? 'empty' : 'ready');
        })
        .catch(() => {
          if (cancelled) return;
          setStage('error');
        });
    };

    tryFetch();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStr, user]);

  const onClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const onShare = useCallback(async () => {
    if (!coupleId) return;
    const url = `${env.appBaseUrl.replace(/\/$/, '')}/recap/${coupleId}/${weekStr}`;
    try {
      await Clipboard.setStringAsync(url);
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
  }, [coupleId, weekStr, t]);

  const onSave = useCallback(() => {
    Alert.alert(
      t('recap.monthly.actions.saveBookTitle'),
      t('recap.monthly.actions.saveBookBody'),
    );
  }, [t]);

  const onDetail = useCallback(() => {
    router.replace({
      pathname: '/(modal)/recap/weekly/detail',
      params: { week: weekStr },
    });
  }, [router, weekStr]);

  const slides = useMemo(() => {
    if (!data) return [];
    const isVi = i18n.language?.toLowerCase().startsWith('vi') ?? true;
    return composeWeeklySlides({
      data,
      weekStr,
      isVi,
      user: user ? { name: user.name } : null,
      partner: partner ? { name: partner.name } : null,
      labels: {
        coverScrollHint: t('recap.stories.coverScrollHint'),
        coverTitleLine1: t('recap.weekly.cover.titleLine1'),
        statMoments: t('recap.stories.stat.moments'),
        statLetters: t('recap.stories.stat.letters'),
        statQuestions: t('recap.stories.stat.questions'),
        topMomentCta: t('recap.stories.topMomentCta'),
        closingBody: t('recap.weekly.closing.body'),
        actionsSave: t('recap.stories.actions.save'),
        actionsShare: partner?.name
          ? t('recap.monthly.actions.shareLabel', { partner: partner.name })
          : t('recap.monthly.actions.shareLabelSolo'),
        actionsDetail: t('recap.stories.actions.detail'),
        photoReelHeadline: t('recap.stories.photoReel.headline'),
        photoReelCaption: (showing, of) =>
          t('recap.stories.photoReel.caption', { showing, of }),
        // D8 — LettersCollection labels (parity with monthly).
        lettersCollectionKicker: (count) =>
          t('recap.stories.lettersCollection.kicker', { count }),
        lettersCollectionHeadline: t('recap.stories.lettersCollection.headline'),
        lettersCollectionCta: t('recap.stories.lettersCollection.cta'),
        letterKicker: (sender, date) =>
          t('recap.monthly.section.letterHighlight.kicker', { sender, date }),
      },
      handlers: { onSave, onShare, onDetail },
    });
  }, [data, weekStr, i18n.language, user, partner, t, onSave, onShare, onDetail]);

  if (stage === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" />
        <Text className="mt-3 font-body text-[13px] text-white/70">
          {t('recap.weekly.loading')}
        </Text>
      </View>
    );
  }

  if (stage === 'empty') {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-center font-displayMedium text-[24px] leading-[28px] text-white">
          {t('recap.weekly.empty.title')}
        </Text>
        <Text className="mt-3 text-center font-body text-[14px] text-white/80">
          {t('recap.weekly.empty.body')}
        </Text>
        <Text
          onPress={onClose}
          className="mt-8 rounded-full bg-white/15 px-5 py-2.5 font-bodyBold text-[12px] text-white active:opacity-70"
        >
          {t('recap.weekly.closeLabel')}
        </Text>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-center font-displayMedium text-[20px] text-white">
          {t('recap.weekly.error.title')}
        </Text>
        <Text className="mt-3 text-center font-body text-[14px] text-white/80">
          {t('recap.weekly.error.body')}
        </Text>
        <Text
          onPress={onClose}
          className="mt-8 rounded-full bg-white/15 px-5 py-2.5 font-bodyBold text-[12px] text-white active:opacity-70"
        >
          {t('recap.weekly.closeLabel')}
        </Text>
      </View>
    );
  }

  return <RecapStoriesScreen slides={slides} onClose={onClose} />;
}
