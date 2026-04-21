import { useActionSheet } from '@expo/react-native-action-sheet';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, ScrollView, Text, ToastAndroid, View } from 'react-native';

import type { MomentCommentRow } from '@/api/moments';
import { TabBarSpacer } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import { CommentsSection } from './components/CommentsSection';
import { HeroGallery } from './components/HeroGallery';
import { ReactionsBar } from './components/ReactionsBar';
import { ReplyBar } from './components/ReplyBar';
import { PhotoLightbox } from './PhotoLightbox';
import {
  type MomentDetail,
  type ReactionAggregate,
  useMomentDetailViewModel,
} from './useMomentDetailViewModel';

// T396 (Sprint 63) — MomentDetail FULL REDESIGN.
// Previous layout (4:3 + small header) is replaced with a 520px immersive
// hero matching prototype moments.jsx L395-594. Body sits below the
// thumbnail strip (pt-12 clears the -28px overlap) and contains: caption,
// tag pills, and eventually (T400/T401) reactions bar + comments.
//
// MVVM: all data comes from useMomentDetailViewModel — the screen keeps
// only ephemeral UI state (active photo index, lightbox URI).
//
// T397/T398 (Sprint 63) — more-dots GlassButton fires a native ActionSheet
// (iOS UIAlertController / Android BottomSheetDialog via
// @expo/react-native-action-sheet). Edit option → push the create modal
// preloaded via `editingMomentId` param. Delete option → native confirm
// Alert → DELETE /api/moments/:id → pop back.

type Props = {
  id: string | undefined;
};

export function MomentDetailScreen({ id }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const { showActionSheetWithOptions } = useActionSheet();

  const vm = useMomentDetailViewModel(id);

  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onBack = () => router.back();
  const openLightbox = (uri: string) => setLightboxUri(uri);
  const closeLightbox = () => setLightboxUri(null);

  const showComingSoon = useCallback(() => {
    const msg = t('moments.detail.comingSoon');
    if (Platform.OS === 'android' && ToastAndroid?.show) {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
    // iOS stub — Share wiring lands in a later sprint; no noisy alert.
  }, [t]);

  const navigateToEdit = useCallback(() => {
    if (!vm.moment) return;
    router.push({
      pathname: '/moment-create',
      params: { editingMomentId: vm.moment.id },
    });
  }, [router, vm.moment]);

  const confirmDelete = useCallback(() => {
    if (!vm.moment) return;
    Alert.alert(
      t('moments.detail.deleteAlert.title'),
      t('moments.detail.deleteAlert.body'),
      [
        { text: t('moments.detail.deleteAlert.cancel'), style: 'cancel' },
        {
          text: t('moments.detail.deleteAlert.confirm'),
          style: 'destructive',
          onPress: async () => {
            const result = await vm.remove();
            if (result.ok) {
              router.back();
            } else {
              Alert.alert(
                t('moments.detail.deleteError.title'),
                t('moments.detail.deleteError.body'),
              );
            }
          },
        },
      ],
    );
  }, [router, t, vm]);

  const onMore = useCallback(() => {
    if (!vm.moment) return;
    const editLabel = t('moments.detail.more.edit');
    const deleteLabel = t('moments.detail.more.delete');
    const cancelLabel = t('moments.detail.more.cancel');
    const options = [editLabel, deleteLabel, cancelLabel];
    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
        userInterfaceStyle: 'light',
        tintColor: c.ink,
      },
      (selectedIndex) => {
        if (selectedIndex === 0) navigateToEdit();
        else if (selectedIndex === 1) confirmDelete();
      },
    );
  }, [c.ink, confirmDelete, navigateToEdit, showActionSheetWithOptions, t, vm.moment]);

  if (vm.loading) {
    return <DetailSkeleton />;
  }

  if (vm.error || !vm.moment) {
    return (
      <DetailError
        onBack={onBack}
        onRetry={vm.reload}
        backLabel={t('moments.detail.back')}
        message={t(
          vm.error === 'notFound' ? 'moments.detail.notFound' : 'moments.detail.error',
        )}
        retryLabel={t('moments.detail.retry')}
      />
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        <HeroGallery
          photos={vm.moment.photos}
          title={vm.moment.title}
          location={vm.moment.location}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
          onBack={onBack}
          onShare={showComingSoon}
          onMore={onMore}
          onPhotoPress={openLightbox}
        />
        <DetailBody
          moment={vm.moment}
          locale={i18n.language}
          reactions={vm.reactions}
          onReact={vm.react}
          comments={vm.comments}
          commentsLoaded={vm.commentsLoaded}
          currentUserId={vm.currentUserId}
          onDeleteComment={vm.removeComment}
          t={t}
        />
        <TabBarSpacer />
      </ScrollView>

      <ReplyBar onSend={vm.postComment} posting={vm.posting} />

      <PhotoLightbox
        visible={lightboxUri !== null}
        uri={lightboxUri}
        onClose={closeLightbox}
      />
    </View>
  );
}

type DetailBodyProps = {
  moment: MomentDetail;
  locale: string;
  reactions: readonly ReactionAggregate[];
  onReact: (emoji: string) => void;
  comments: MomentCommentRow[];
  commentsLoaded: boolean;
  currentUserId: string | null;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  t: (k: string, opts?: Record<string, unknown>) => string;
};

function DetailBody({
  moment,
  locale,
  reactions,
  onReact,
  comments,
  commentsLoaded,
  currentUserId,
  onDeleteComment,
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

  const tags = moment.tags ?? [];

  return (
    <View className="px-5 pt-12">
      <Text className="font-body text-ink-mute text-[12px]">
        {dateLabel} · {relative}
      </Text>

      {moment.caption ? (
        <Text className="font-body text-ink text-[15px] leading-[24px] mt-4">
          {moment.caption}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <View className="mt-4 flex-row flex-wrap gap-1.5">
          {tags.map((tag) => (
            <View
              key={tag}
              className="px-2.5 py-1.5 rounded-full bg-surface-alt"
            >
              <Text className="font-bodySemibold text-ink-soft text-[11px]">
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-6">
        <ReactionsBar reactions={reactions} onReact={onReact} />
      </View>

      <CommentsSection
        comments={comments}
        loaded={commentsLoaded}
        locale={locale}
        currentUserId={currentUserId}
        onDelete={onDeleteComment}
      />
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="flex-1 bg-bg">
      <View className="h-[520px] bg-surface-alt" />
      <View className="px-5 pt-12">
        <View className="h-3 rounded bg-surface-alt w-2/5" />
        <View className="h-3 rounded bg-surface-alt mt-4 w-full" />
        <View className="h-3 rounded bg-surface-alt mt-2 w-4/5" />
      </View>
    </View>
  );
}

type DetailErrorProps = {
  message: string;
  retryLabel: string;
  backLabel: string;
  onRetry: () => void;
  onBack: () => void;
};

function DetailError({ message, retryLabel, backLabel, onRetry, onBack }: DetailErrorProps) {
  return (
    <View className="flex-1 bg-bg items-center justify-center px-10">
      <Text className="font-bodyMedium text-ink text-[15px] text-center">
        {message}
      </Text>
      <View className="flex-row gap-3 mt-5">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          className="px-5 h-10 rounded-full bg-surface border border-line items-center justify-center active:opacity-80"
        >
          <Text className="font-bodySemibold text-ink text-[14px]">
            {backLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          className="px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
        >
          <Text className="font-bodySemibold text-white text-[14px]">
            {retryLabel}
          </Text>
        </Pressable>
      </View>
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

// Intl.RelativeTimeFormat is available in Hermes 0.12+ (RN 0.81). Falls
// back to a plain locale date string if Intl blows up on older runtimes.
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
