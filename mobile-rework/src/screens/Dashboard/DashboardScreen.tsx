import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { SafeScreen, TabBarSpacer } from '@/components';
import { useCameraSheetStore } from '@/stores/cameraSheetStore';
import { useAppColors } from '@/theme/ThemeProvider';

import { EmptyHero } from './components/EmptyHero';
import {
  LatestMomentCard,
  formatRelative,
} from './components/LatestMomentCard';
import { ShareCodeCard } from './ShareCodeCard';
import { useDashboardViewModel } from './useDashboardViewModel';

// T307 (Sprint 60) — created the greeting + ShareCodeCard shell.
// T375 (Sprint 62) — plugged in useDashboardViewModel so the home tab now
// branches empty ↔ has-data:
//   count === 0 → <EmptyHero /> (polaroid hero + 2 CTA, both open Camera
//                 BottomSheet via useCameraSheetStore — T377)
//   count  >  0 → <LatestMomentCard /> (top moment, tap → moment-detail)
// ShareCodeCard stays above both — it unmounts itself once the partner joins,
// so paired couples only see greeting + moments section. Reactive refresh
// is handled upstream by useMomentsViewModel subscribing to
// momentsStore.version (T378 bumps after POST + each photo upload).

export function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const vm = useDashboardViewModel();

  const greeting = vm.userName
    ? t('home.greeting', { name: vm.userName })
    : t('tabs.home');

  const openCameraSheet = useCallback(() => {
    useCameraSheetStore.getState().open();
  }, []);

  const openDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/moment-detail', params: { id } });
    },
    [router],
  );

  const justNow = t('moments.detail.justNow');
  const relativeLabel = useMemo(() => {
    if (!vm.latest) return '';
    return formatRelative(
      new Date(vm.latest.createdAt),
      i18n.language,
      justNow,
    );
  }, [vm.latest, i18n.language, justNow]);

  const showInitialLoader = vm.loading && vm.count === 0 && !vm.error;

  return (
    <SafeScreen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {greeting}
          </Text>
          <Text className="mt-1 font-body text-ink-mute text-[13px]">
            {t('home.greetingTime')}
          </Text>
        </View>

        <ShareCodeCard />

        {showInitialLoader ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator color={c.primary} />
          </View>
        ) : vm.latest ? (
          <LatestMomentCard
            moment={vm.latest}
            eyebrow={t('home.latest.eyebrow')}
            relativeLabel={relativeLabel}
            onPress={openDetail}
          />
        ) : (
          <EmptyHero
            title={t('home.empty.title')}
            subtitle={t('home.empty.subtitle')}
            primaryLabel={t('home.empty.ctaPrimary')}
            secondaryLabel={t('home.empty.ctaSecondary')}
            polaroidCaption={t('home.empty.polaroidCaption')}
            onPrimary={openCameraSheet}
            onSecondary={openCameraSheet}
          />
        )}

        <TabBarSpacer />
      </ScrollView>
    </SafeScreen>
  );
}
