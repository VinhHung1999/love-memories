// Letter variant 4 — Postcard. D4 refactor: text column is now a paper-
// cream sheet (notebook rules + Dancing-Script signature) so the right
// half of the postcard reads as the actual handwritten message side.
// Photo column stays full-bleed.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { PAPER_INK, PAPER_INK_MUTE, PaperSheet, PaperSignature } from './PaperSheet';
import type { Slide } from '../../../types';

type LetterSlide = Extract<Slide, { kind: 'letter' }>;

export function LetterPostcard({
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
        colors={[c.heroC, c.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 items-center justify-center px-4">
        <View
          className="flex-row overflow-hidden rounded-lg border border-line shadow-elevated"
          style={{ width: '100%', maxWidth: 360, transform: [{ rotate: '-2deg' }] }}
        >
          {/* Photo column */}
          <View style={{ width: '42%', aspectRatio: 0.62 }}>
            {slide.thumbPhotoUrl ? (
              <Image
                source={{ uri: slide.thumbPhotoUrl }}
                resizeMode="cover"
                className="h-full w-full"
              />
            ) : (
              <LinearGradient
                colors={[c.heroA, c.heroB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
            )}
          </View>
          {/* Text column — paper sheet with notebook rules. */}
          <PaperSheet approxHeight={260} className="flex-1 p-4">
            <Text
              className="font-bodyBold text-[9px] uppercase tracking-[2px]"
              style={{ color: PAPER_INK_MUTE }}
            >
              {slide.kicker}
            </Text>
            <Text
              className="mt-1 font-script text-[20px] leading-[24px]"
              style={{ color: PAPER_INK }}
              numberOfLines={2}
            >
              {slide.title}
            </Text>
            {/* D5 — STATIC className per variant size (compact for postcard
                column). */}
            <Text
              className="mt-2 font-body text-[12px] leading-[18px]"
              style={{ color: PAPER_INK }}
              numberOfLines={5}
            >
              {slide.excerpt}
            </Text>
            <PaperSignature senderName={slide.senderName} />
          </PaperSheet>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-7 flex-row items-center gap-2 rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
