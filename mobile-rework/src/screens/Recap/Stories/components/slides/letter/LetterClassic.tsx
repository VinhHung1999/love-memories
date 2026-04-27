// Letter variant 1 — classic paper. Rotated wax-seal heart corner +
// secondarySoft → surface gradient + 5-line excerpt + Re-read pill.
// Original Sprint 67 T459 design lifted into its own file; the new
// LetterSlide router picks this when slide.variant === 'classic'.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Heart } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../../types';

type LetterSlide = Extract<Slide, { kind: 'letter' }>;

export function LetterClassic({
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
        colors={[c.secondarySoft, c.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View
        className="absolute right-7 h-[68px] w-[56px] items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-surface"
        style={{ top: 100, transform: [{ rotate: '8deg' }] }}
      >
        <LinearGradient
          colors={[c.primary, c.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Heart size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
        </LinearGradient>
      </View>

      <View className="flex-1 justify-center px-7">
        <Text className="font-bodyBold text-[10px] uppercase tracking-widest text-primary-deep">
          {slide.kicker}
        </Text>
        <Text
          className="mt-2 font-displayMedium text-[30px] leading-[34px] text-ink"
          style={{ maxWidth: '78%' }}
        >
          {slide.title}
        </Text>
        <Text
          className="mt-4 font-body text-[15px] leading-[24px] text-ink-soft"
          numberOfLines={6}
        >
          {slide.excerpt}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-7 flex-row items-center gap-2 self-start rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
