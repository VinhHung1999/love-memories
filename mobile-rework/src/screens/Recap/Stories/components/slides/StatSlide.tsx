// Sprint 67 T459 — Big-stat slide. Optional photo dim 40% behind a 180px
// display number. Tone selects the number color via theme tokens.

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { AnimatedCounter } from '../AnimatedCounter';
import { KenBurnsBackground } from '../KenBurnsBackground';
import type { Slide } from '../../types';

type StatSlide = Extract<Slide, { kind: 'stat' }>;

type Props = { slide: StatSlide };

const TONE_TEXT: Record<StatSlide['tone'], string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
};

export function StatSlide({ slide }: Props) {
  const c = useAppColors();
  const numberClass = TONE_TEXT[slide.tone];

  return (
    <View className="flex-1">
      {slide.bgPhotoUrl ? (
        <KenBurnsBackground uri={slide.bgPhotoUrl} dim={0.4} />
      ) : (
        <LinearGradient
          colors={[c.bg, c.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}
      <View className="flex-1 items-start justify-center px-7">
        <AnimatedCounter
          value={slide.value}
          className={`font-displayBold text-[180px] leading-[170px] tracking-tight ${numberClass}`}
        />
        <Text className="mt-2 font-bodySemibold text-[14px] uppercase tracking-[2.5px] text-white/95">
          {slide.label}
        </Text>
        {slide.sub ? (
          <Text className="mt-3 max-w-[80%] font-body text-[14px] leading-[20px] text-white/80">
            {slide.sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
