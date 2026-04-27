// Letter variant 1 — classic paper sheet. D4 refactor: full paper-cream
// card with notebook lines + script title + body excerpt + Dancing-
// Script signature. The wax-seal heart sits in the corner of the paper
// card itself rather than floating on a bare gradient — gives the slide
// the "real letter you'd unfold" feel Boss asked for.

import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Heart } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { PAPER_INK, PAPER_INK_MUTE, PaperBody, PaperSheet } from './PaperSheet';
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
      <View className="flex-1 justify-center px-5">
        <PaperSheet
          approxHeight={520}
          className="rounded-[20px] px-6 pb-7 pt-7 shadow-elevated"
        >
          {/* Wax-seal heart corner — dashed-border stamp like the original
              Sprint 67 design but inside the paper card so it reads as
              part of the letter, not floating chrome. */}
          <View
            className="absolute right-4 top-4 h-[58px] w-[48px] items-center justify-center overflow-hidden rounded-md border-2 border-dashed"
            style={{ borderColor: 'rgba(42,26,30,0.2)', transform: [{ rotate: '8deg' }] }}
          >
            <LinearGradient
              colors={[c.primary, c.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <Heart size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            </LinearGradient>
          </View>

          <Text
            className="font-bodyBold text-[10px] uppercase tracking-widest"
            style={{ color: PAPER_INK_MUTE, maxWidth: '70%' }}
          >
            {slide.kicker}
          </Text>
          <Text
            className="mt-2 font-script text-[28px] leading-[34px]"
            style={{ color: PAPER_INK, maxWidth: '78%' }}
            numberOfLines={2}
          >
            {slide.title}
          </Text>
          <View className="mt-4">
            <PaperBody excerpt={slide.excerpt} senderName={slide.senderName} />
          </View>
        </PaperSheet>

        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className="mt-7 flex-row items-center gap-2 self-center rounded-full bg-ink px-5 py-3 active:opacity-80"
        >
          <Text className="font-bodyBold text-[13px] text-bg">{slide.ctaLabel}</Text>
          <ArrowRight size={14} color={c.bg} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
