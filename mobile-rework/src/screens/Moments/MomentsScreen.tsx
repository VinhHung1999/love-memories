import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { SafeScreen, TabBarSpacer } from '@/components';
import { useCameraSheetStore } from '@/stores/cameraSheetStore';
import { useAppColors } from '@/theme/ThemeProvider';

import { MomentCard } from './components/MomentCard';
import { MomentsEmpty } from './components/MomentsEmpty';
import { type MomentRow, useMomentsViewModel } from './useMomentsViewModel';

// T376 (Sprint 62) — Moments tab. Header (eyebrow + "Khoảnh khắc"), vertical
// FlatList timeline of MomentCards, pull-to-refresh, client-side pagination
// (page bump via onEndReached; backend returns full list in one call — see
// VM). Empty state opens the Camera action sheet (T377 store singleton) so
// the tab never looks like a dead-end.
//
// Gotchas addressed:
//   - TabBarSpacer as ListFooterComponent so last card doesn't clip under
//     the floating pill tab bar (T374 locked values: 150/116).
//   - `contentContainerClassName` with a dynamic class string won't apply
//     under NativeWind v4 JIT — we keep the centered loader/empty/error in
//     a dedicated branch that wraps a flex-1 View instead of relying on
//     FlatList's contentContainer.

export function MomentsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();

  const vm = useMomentsViewModel();

  const openCameraSheet = useCallback(() => {
    useCameraSheetStore.getState().open();
  }, []);

  const openDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/moment-detail', params: { id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: MomentRow }) => (
      <View className="px-5 pb-6">
        <MomentCard
          moment={item}
          locale={i18n.language}
          onPress={openDetail}
          morePhotosLabel={(count) => t('moments.list.morePhotos', { count })}
        />
      </View>
    ),
    [i18n.language, openDetail, t],
  );

  return (
    <SafeScreen edges={['top']}>
      <Header
        eyebrow={t('moments.list.eyebrow')}
        title={t('moments.list.title')}
      />

      {vm.loading && vm.moments.length === 0 ? (
        <CenterFill>
          <ActivityIndicator color={c.primary} />
        </CenterFill>
      ) : vm.error && vm.moments.length === 0 ? (
        <CenterFill>
          <Text className="font-bodyMedium text-ink text-[15px] text-center px-8">
            {t('moments.list.error')}
          </Text>
          <Pressable
            onPress={vm.reload}
            accessibilityRole="button"
            className="mt-5 px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
          >
            <Text className="font-bodySemibold text-white text-[14px]">
              {t('moments.list.retry')}
            </Text>
          </Pressable>
        </CenterFill>
      ) : vm.moments.length === 0 ? (
        <CenterFill>
          <MomentsEmpty
            title={t('moments.list.empty.title')}
            subtitle={t('moments.list.empty.subtitle')}
            ctaLabel={t('moments.list.empty.cta')}
            onCta={openCameraSheet}
          />
        </CenterFill>
      ) : (
        <FlatList
          data={vm.moments}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          onEndReachedThreshold={0.4}
          onEndReached={vm.hasMore ? vm.onEndReached : undefined}
          refreshControl={
            <RefreshControl
              refreshing={vm.refreshing}
              onRefresh={vm.onRefresh}
              tintColor={c.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<TabBarSpacer />}
        />
      )}
    </SafeScreen>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
};

function Header({ eyebrow, title }: HeaderProps) {
  return (
    <View className="px-5 pt-2 pb-3">
      <Text className="font-body text-ink-mute text-[12px] uppercase tracking-widest">
        {eyebrow}
      </Text>
      <Text className="font-displayMedium text-ink text-[32px] leading-[36px] mt-1">
        {title}
      </Text>
    </View>
  );
}

function CenterFill({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center">{children}</View>;
}
