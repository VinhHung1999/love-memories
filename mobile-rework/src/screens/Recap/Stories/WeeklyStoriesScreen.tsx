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
import { isValidWeekStr, previousWeekStr } from '../utils';

type CoupleUserLite = { id: string; name: string | null; avatar: string | null };
type CoupleLite = { id: string; users: CoupleUserLite[] };

export function WeeklyStoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ week?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const weekStr = useMemo(() => {
    const raw = Array.isArray(params.week) ? params.week[0] : params.week;
    return isValidWeekStr(raw) ? raw : previousWeekStr();
  }, [params.week]);

  const [stage, setStage] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [data, setData] = useState<WeeklyRecapResponse | null>(null);
  const [partner, setPartner] = useState<CoupleUserLite | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStage('loading');
    Promise.all([
      apiClient.get<WeeklyRecapResponse>(`/api/recap/weekly?week=${weekStr}`),
      apiClient.get<CoupleLite>('/api/couple').catch(() => null),
    ])
      .then(([res, couple]) => {
        if (cancelled) return;
        setData(res);
        setCoupleId(couple?.id ?? null);
        setPartner(
          couple && user ? couple.users.find((u) => u.id !== user.id) ?? null : null,
        );
        const isEmpty =
          res.moments.count === 0 &&
          res.loveLetters.sent + res.loveLetters.received === 0 &&
          res.questions.count === 0;
        setStage(isEmpty ? 'empty' : 'ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStage('error');
      });
    return () => {
      cancelled = true;
    };
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
