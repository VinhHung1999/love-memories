// Letter variant 2 — Polaroid + paper-cream excerpt sheet underneath.
// D4 refactor: keeps the rotated polaroid keepsake but replaces the
// plain bg-bg-elev card under it with a proper paper-cream sheet
// (notebook lines + body excerpt + Dancing-Script signature) so the
// slide reads as "snapshot pinned to a real letter".

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { PAPER_INK, PaperSheet, PaperSignature } from './PaperSheet';
import type { Slide } from '../../../types';

type LetterSlide = Extract<Slide, { kind: 'letter' }>;

export function LetterPolaroid({
  slide,
  onOpen,
}: {
  slide: LetterSlide;
  onOpen: () => void;
}) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.bg, c.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {/* D7 — flex column with polaroid header + scrollable paper sheet
          + footer CTA. Polaroid stays at fixed size, paper sheet grows
          to fill available height with internal ScrollView for long
          letters. */}
      <View className="flex-1 items-center px-5 pb-4 pt-12">
        <View
          className="overflow-hidden border-[6px] border-white shadow-elevated"
          style={{ width: 180, transform: [{ rotate: '-3deg' }] }}
        >
          {slide.thumbPhotoUrl ? (
            <Image
              source={{ uri: slide.thumbPhotoUrl }}
              resizeMode="cover"
              style={{ width: '100%', aspectRatio: 1 }}
            />
          ) : (
            <View className="bg-secondary-soft" style={{ width: '100%', aspectRatio: 1 }} />
          )}
          <View className="bg-white px-3 pb-3 pt-2">
            <Text className="font-script text-[18px] text-ink" numberOfLines={1}>
              {slide.title}
            </Text>
            <Text className="mt-0.5 font-bodyBold text-[8px] uppercase tracking-[2px] text-ink-mute">
              {slide.kicker}
            </Text>
          </View>
        </View>

        <PaperSheet
          approxHeight={520}
          className="mt-4 w-full max-w-[360px] flex-1 rounded-[16px] px-5 pb-5 pt-5 shadow-card"
        >
          <Text
            className="font-bodyBold text-[9px] uppercase tracking-[2.5px]"
            style={{ color: PAPER_INK }}
          >
            ✉ Trích thư
          </Text>
          {/* D7 — full body in ScrollView. Auto-advance paused via
              RecapStoriesScreen so user reads at their own pace. */}
          <ScrollView
            className="mt-2 flex-1"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              className="font-body text-[14px] leading-[22px]"
              style={{ color: PAPER_INK }}
            >
              {slide.content}
            </Text>
            <PaperSignature senderName={slide.senderName} />
          </ScrollView>
        </PaperSheet>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-4 flex-row items-center gap-2 rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
