// Letter variant 2 — Polaroid. Square thumbnail centered with white
// border + scribble caption (= title) + script signature line under
// the photo. Excerpt below the polaroid in body font. Reads as a
// keepsake snapshot rather than a paper letter.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

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
      <View className="flex-1 items-center justify-center px-7">
        <View
          className="overflow-hidden border-[6px] border-white shadow-elevated"
          style={{ width: 240, transform: [{ rotate: '-3deg' }] }}
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
          <View className="bg-white px-3 pb-4 pt-2">
            <Text className="font-script text-[20px] text-ink" numberOfLines={2}>
              {slide.title}
            </Text>
            <Text className="mt-1 font-bodyBold text-[9px] uppercase tracking-[2px] text-ink-mute">
              {slide.kicker}
            </Text>
          </View>
        </View>

        <Text
          className="mt-7 max-w-[88%] text-center font-body text-[14px] leading-[22px] text-ink-soft"
          numberOfLines={5}
        >
          {slide.excerpt}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-6 flex-row items-center gap-2 rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
