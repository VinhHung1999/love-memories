// Sprint 67 T460 — Stories container for monthly recap. Self-contained:
// fetches /api/recap/monthly + /api/couple, composes Slide[], renders
// RecapStoriesScreen + handles loading / empty / error.

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { env } from '@/config/env';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

import { composeMonthlySlides } from './composeMonthly';
import { RecapStoriesScreen } from './RecapStoriesScreen';
import type { MonthlyRecapResponse } from '../types';
import { isValidMonthStr, previousMonthStr } from '../utils';

type CoupleUserLite = { id: string; name: string | null; avatar: string | null };
type CoupleLite = { id: string; users: CoupleUserLite[] };

export function MonthlyStoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string | string[] }>();
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const monthStr = useMemo(() => {
    const raw = Array.isArray(params.month) ? params.month[0] : params.month;
    return isValidMonthStr(raw) ? raw : previousMonthStr();
  }, [params.month]);

  const [stage, setStage] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [data, setData] = useState<MonthlyRecapResponse | null>(null);
  const [partner, setPartner] = useState<CoupleUserLite | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStage('loading');
    Promise.all([
      apiClient.get<MonthlyRecapResponse>(`/api/recap/monthly?month=${monthStr}`),
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
  }, [monthStr, user]);

  const onClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const onShare = useCallback(async () => {
    if (!coupleId) return;
    const url = `${env.appBaseUrl.replace(/\/$/, '')}/recap/${coupleId}/${monthStr}`;
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
  }, [coupleId, monthStr, t]);

  const onSave = useCallback(() => {
    Alert.alert(
      t('recap.monthly.actions.saveBookTitle'),
      t('recap.monthly.actions.saveBookBody'),
    );
  }, [t]);

  const onDetail = useCallback(() => {
    router.replace({
      pathname: '/(modal)/recap/monthly/detail',
      params: { month: monthStr },
    });
  }, [router, monthStr]);

  const slides = useMemo(() => {
    if (!data) return [];
    const isVi = i18n.language?.toLowerCase().startsWith('vi') ?? true;
    return composeMonthlySlides({
      data,
      monthStr,
      isVi,
      user: user ? { name: user.name } : null,
      partner: partner ? { name: partner.name } : null,
      labels: {
        coverScrollHint: t('recap.stories.coverScrollHint'),
        statMoments: t('recap.stories.stat.moments'),
        statLetters: t('recap.stories.stat.letters'),
        statPhotos: t('recap.stories.stat.photos'),
        statSubMoments: t('recap.stories.stat.momentsSub'),
        topMomentCta: t('recap.stories.topMomentCta'),
        placesHeadline: (count) => t('recap.stories.placesHeadline', { count }),
        placesCaption: (count) => t('recap.stories.placesCaption', { count }),
        firstsKicker: t('recap.monthly.section.firsts.title'),
        letterCta: t('recap.monthly.section.letterHighlight.cta'),
        letterKicker: (sender, date) =>
          t('recap.monthly.section.letterHighlight.kicker', { sender, date }),
        topQuestionMeta: (count) =>
          t('recap.monthly.section.topQuestion.meta', { count }),
        closingTitleWithPartner: (p) =>
          t('recap.monthly.section.closing.titleWithPartner', { partner: p }),
        closingTitleSolo: t('recap.monthly.section.closing.titleSolo'),
        closingBody: t('recap.monthly.section.closing.body'),
        actionsSave: t('recap.stories.actions.save'),
        actionsShare: partner?.name
          ? t('recap.monthly.actions.shareLabel', { partner: partner.name })
          : t('recap.monthly.actions.shareLabelSolo'),
        actionsDetail: t('recap.stories.actions.detail'),
      },
      handlers: { onSave, onShare, onDetail },
    });
  }, [data, monthStr, i18n.language, user, partner, t, onSave, onShare, onDetail]);

  if (stage === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" />
        <Text className="mt-3 font-body text-[13px] text-white/70">
          {t('recap.monthly.loading')}
        </Text>
      </View>
    );
  }

  if (stage === 'empty') {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-center font-displayMedium text-[24px] leading-[28px] text-white">
          {t('recap.monthly.empty.title')}
        </Text>
        <Text className="mt-3 text-center font-body text-[14px] text-white/80">
          {t('recap.monthly.empty.body')}
        </Text>
        <Text
          onPress={onClose}
          className="mt-8 rounded-full bg-white/15 px-5 py-2.5 font-bodyBold text-[12px] text-white active:opacity-70"
        >
          {t('recap.monthly.closeLabel')}
        </Text>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <Text className="text-center font-displayMedium text-[20px] text-white">
          {t('recap.monthly.error.title')}
        </Text>
        <Text className="mt-3 text-center font-body text-[14px] text-white/80">
          {t('recap.monthly.error.body')}
        </Text>
        <Text
          onPress={onClose}
          className="mt-8 rounded-full bg-white/15 px-5 py-2.5 font-bodyBold text-[12px] text-white active:opacity-70"
        >
          {t('recap.monthly.closeLabel')}
        </Text>
      </View>
    );
  }

  return <RecapStoriesScreen slides={slides} onClose={onClose} />;
}
