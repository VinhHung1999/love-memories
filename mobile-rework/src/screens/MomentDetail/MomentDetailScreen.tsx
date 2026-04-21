import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { SafeScreen, TabBarSpacer } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import { PhotoLightbox } from './PhotoLightbox';
import { type MomentDetail, useMomentDetailViewModel } from './useMomentDetailViewModel';

// T379 (Sprint 62) — MomentDetail view. Shows one moment's photo gallery +
// meta + caption, with a pinch-zoom lightbox (PhotoLightbox) on photo tap.
// Header is minimal (back arrow + title). Edit/Delete ship Sprint 63.
//
// Gallery is a native `FlatList` pagingEnabled — avoids adding a carousel lib
// that would have to be compat-checked against Reanimated v4. Index badge
// updates on scroll-end to match the snapped page.

type Props = {
  id: string | undefined;
};

export function MomentDetailScreen({ id }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const { width } = useWindowDimensions();

  const vm = useMomentDetailViewModel(id);

  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<MomentDetail['photos'][number]>>(null);

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / Math.max(width, 1));
      setActiveIndex(idx);
    },
    [width],
  );

  const onBack = () => router.back();
  const openLightbox = (uri: string) => setLightboxUri(uri);
  const closeLightbox = () => setLightboxUri(null);

  return (
    <SafeScreen edges={['top']}>
      {/* Header — back + title, no action menu (Edit/Delete → Sprint 63) */}
      <View className="flex-row items-center px-4 pt-1 pb-3 border-b border-line-on-surface/70">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('moments.detail.back')}
          className="w-10 h-10 rounded-2xl bg-surface border border-line-on-surface items-center justify-center active:opacity-80"
        >
          <ArrowLeft size={18} strokeWidth={2.3} color={c.ink} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="font-displayMedium text-ink text-[18px] leading-[22px] flex-1 text-center mx-3"
        >
          {t('moments.detail.title')}
        </Text>
        {/* Spacer to visually balance the back button width */}
        <View className="w-10 h-10" />
      </View>

      {vm.loading ? (
        <DetailSkeleton />
      ) : vm.error || !vm.moment ? (
        <DetailError
          onRetry={vm.reload}
          message={t(
            vm.error === 'notFound' ? 'moments.detail.notFound' : 'moments.detail.error',
          )}
          retryLabel={t('moments.detail.retry')}
        />
      ) : (
        <FlatList
          data={[vm.moment]}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <DetailBody
              moment={item}
              listRef={listRef}
              activeIndex={activeIndex}
              onPhotoScrollEnd={onScrollEnd}
              onPhotoTap={openLightbox}
              locale={i18n.language}
              t={t}
            />
          )}
          ListFooterComponent={<TabBarSpacer />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <PhotoLightbox
        visible={lightboxUri !== null}
        uri={lightboxUri}
        onClose={closeLightbox}
      />
    </SafeScreen>
  );
}

type DetailBodyProps = {
  moment: MomentDetail;
  listRef: React.RefObject<FlatList<MomentDetail['photos'][number]> | null>;
  activeIndex: number;
  onPhotoScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onPhotoTap: (uri: string) => void;
  locale: string;
  t: (k: string, opts?: Record<string, unknown>) => string;
};

function DetailBody({
  moment,
  listRef,
  activeIndex,
  onPhotoScrollEnd,
  onPhotoTap,
  locale,
  t,
}: DetailBodyProps) {
  const dateLabel = useMemo(
    () => formatFullDate(new Date(moment.date), locale),
    [moment.date, locale],
  );
  const relative = useMemo(
    () => formatRelative(new Date(moment.createdAt), locale, t),
    [moment.createdAt, locale, t],
  );

  const hasPhotos = moment.photos.length > 0;
  const showIndex = moment.photos.length > 1;

  return (
    <View>
      {/* Gallery — horizontal paging. 4:3 ratio per spec. */}
      {hasPhotos ? (
        <View className="relative">
          <FlatList
            ref={listRef}
            data={moment.photos}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPhotoScrollEnd}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onPhotoTap(item.url)}
                accessibilityRole="imagebutton"
                accessibilityLabel={item.filename}
                className="active:opacity-90 w-screen aspect-[4/3] bg-surface-alt"
              >
                <Image
                  source={{ uri: item.url }}
                  resizeMode="cover"
                  className="w-full h-full"
                />
              </Pressable>
            )}
          />
          {showIndex ? (
            <View className="absolute bottom-3 left-4 px-2.5 py-1 rounded-full bg-ink/60">
              <Text className="font-bodyMedium text-white text-[11px]">
                {activeIndex + 1} / {moment.photos.length}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Meta + title + caption */}
      <View className="px-5 pt-6">
        <Text className="font-body text-ink-mute text-[12px]">
          {dateLabel} · {relative}
        </Text>
        <Text className="font-displayMedium text-ink text-[26px] leading-[32px] mt-2">
          {moment.title}
        </Text>
        {moment.caption ? (
          <Text className="font-body text-ink text-[15px] leading-[24px] mt-4">
            {moment.caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="flex-1">
      <View className="w-screen aspect-[4/3] bg-surface-alt" />
      <View className="px-5 pt-6">
        <View className="h-3 rounded bg-surface-alt w-2/5" />
        <View className="h-5 rounded bg-surface-alt mt-4 w-3/4" />
        <View className="h-3 rounded bg-surface-alt mt-3 w-full" />
        <View className="h-3 rounded bg-surface-alt mt-2 w-4/5" />
      </View>
    </View>
  );
}

type DetailErrorProps = {
  message: string;
  retryLabel: string;
  onRetry: () => void;
};

function DetailError({ message, retryLabel, onRetry }: DetailErrorProps) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Text className="font-bodyMedium text-ink text-[15px] text-center">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        className="mt-5 px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
      >
        <Text className="font-bodySemibold text-white text-[14px]">
          {retryLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function formatFullDate(date: Date, locale: string) {
  const lang = locale.startsWith('vi') ? 'vi-VN' : 'en-US';
  try {
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

// Simple relative-time helper. Intl.RelativeTimeFormat is available in Hermes
// 0.12+ (RN 0.81). Fallback to locale-aware date string if Intl blows up.
function formatRelative(
  date: Date,
  locale: string,
  t: (k: string) => string,
): string {
  const lang = locale.startsWith('vi') ? 'vi-VN' : 'en-US';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return t('moments.detail.justNow');
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return rtf.format(-diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return rtf.format(-diffDay, 'day');
    const diffMonth = Math.round(diffDay / 30);
    if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
    return rtf.format(-Math.round(diffMonth / 12), 'year');
  } catch {
    return date.toLocaleDateString(lang);
  }
}
