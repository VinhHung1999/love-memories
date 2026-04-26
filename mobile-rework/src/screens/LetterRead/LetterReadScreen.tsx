import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import {
  formatLongDate,
  formatTimeShort,
} from '../Letters/relativeAgo';
import { paletteFor, PAL_GRADIENTS } from '../Letters/palette';
import {
  AuthorBlock,
  PaperCard,
  ReadHeader,
  ReplyCard,
} from './components';
import { useLetterReadViewModel } from './useLetterReadViewModel';

// T422 (Sprint 65) — full-bleed Letter Read overlay. Replaces the Sprint 60
// stub at app/(modal)/letter-read.tsx. Layout follows prototype
// `letters.jsx` L290-430:
//
//   1. Full-bleed linear-gradient bg, palette top → bg fade by 45%
//   2. ScrollView content over the gradient — top inset, ReadHeader,
//      AuthorBlock, PaperCard, ReplyCard.
//   3. Mark-read happens server-side automatically on GET /:id (Lu Q6
//      approved). VM bumps lettersStore.invalidate() so the inbox pulse pill
//      updates next focus.
//   4. StatusBar light (white-on-gradient) for the entire screen — the
//      gradient extends edge-to-edge so a static "light" style is correct
//      regardless of scroll position.
//
// Reply CTA pushes /letter-compose?replyTo=…; the heart taps a ComingSoonSheet
// per Lu Q-C (no BE reaction endpoint yet, B-letter-reactions queued P2).

type Props = {
  id: string | undefined;
};

export function LetterReadScreen({ id }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const locale = i18n.language;
  // Spec L89: light status bar over the gradient hero, auto once the user
  // scrolls past the bg fade (~45% of the gradient height ≈ 220-260px). Cheap
  // boolean toggle — no Animated.Value needed since the only consumer is the
  // <StatusBar /> component which re-renders fine on state change.
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const past = e.nativeEvent.contentOffset.y > 240;
      setScrolledPastHero((prev) => (prev === past ? prev : past));
    },
    [],
  );

  const vm = useLetterReadViewModel(id);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/letters');
  }, [router]);

  const onShare = useCallback(() => {
    if (!vm.letter) return;
    void Share.share({
      message: `${vm.letter.title}\n\n${vm.letter.content}\n\n— Memoura`,
    });
  }, [vm.letter]);

  const onReply = useCallback(() => {
    if (!vm.letter) return;
    router.push({
      pathname: '/letter-compose',
      params: { replyTo: vm.letter.id },
    });
  }, [router, vm.letter]);

  if (vm.loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={c.primary} />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (vm.error || !vm.letter) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-8">
        <Text className="font-bodyMedium text-ink text-[15px] text-center">
          {t('letters.read.error.message')}
        </Text>
        <View className="flex-row gap-2 mt-5">
          <Pressable
            onPress={() => vm.reload()}
            accessibilityRole="button"
            className="px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
          >
            <Text className="font-bodySemibold text-white text-[14px]">
              {t('letters.read.error.retry')}
            </Text>
          </Pressable>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            className="px-5 h-10 rounded-full bg-surface border border-line-on-surface items-center justify-center active:opacity-80"
          >
            <Text className="font-bodySemibold text-ink text-[14px]">
              {t('letters.read.error.back')}
            </Text>
          </Pressable>
        </View>
        <StatusBar style="auto" />
      </View>
    );
  }

  const letter = vm.letter;
  const palette = paletteFor(letter);
  const grad = PAL_GRADIENTS[palette];

  const accentDate = formatLongDate(
    letter.deliveredAt ?? letter.createdAt,
    locale,
  );
  const authorTime = formatTimeShort(
    letter.deliveredAt ?? letter.createdAt,
    locale,
  );
  const authorName = letter.sender.name ?? t('letters.partnerFallback');
  const authorCaption = t('letters.read.fromAuthor', {
    name: authorName,
    time: authorTime,
  });

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[grad[0], grad[1], c.bg, c.bg]}
        locations={[0, 0.25, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />
      <ScrollView
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        <View style={{ height: insets.top + 8 }} />
        <ReadHeader
          dateLabel={accentDate}
          onBack={onBack}
          onShare={onShare}
        />
        <AuthorBlock
          authorName={authorName}
          authorAvatarUrl={letter.sender.avatar}
          caption={authorCaption}
        />
        <PaperCard
          letter={letter}
          signaturePrefix={t('letters.read.signaturePrefix')}
          greetingPrefix={t('letters.heroGreeting')}
          recipientDisplayName={
            letter.recipient.name ?? t('letters.partnerFallback')
          }
        />
        <ReplyCard
          eyebrow={t('letters.read.reply.eyebrow')}
          body={t('letters.read.reply.body')}
          writeLabel={t('letters.read.reply.write')}
          onWrite={onReply}
        />
        <View style={{ height: insets.bottom + 12 }} />
      </ScrollView>
      <StatusBar style={scrolledPastHero ? 'auto' : 'light'} />
    </View>
  );
}
