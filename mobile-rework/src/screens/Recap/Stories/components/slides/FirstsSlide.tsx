// Sprint 67 T459 — Firsts slide. Optional photo dim + 🎉 sticker pinned
// upper-right rotated, Dancing Script kicker, moment title centered.

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import { KenBurnsBackground } from '../KenBurnsBackground';
import type { Slide } from '../../types';

type FirstsSlide = Extract<Slide, { kind: 'firsts' }>;

type Props = { slide: FirstsSlide };

export function FirstsSlide({ slide }: Props) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      {slide.bgPhotoUrl ? (
        <KenBurnsBackground uri={slide.bgPhotoUrl} dim={0.45} />
      ) : (
        <LinearGradient
          colors={[c.heroB, c.heroC]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      )}

      <View
        className="absolute right-7"
        style={{ top: 110, transform: [{ rotate: '12deg' }] }}
      >
        <Text className="text-[88px]">{slide.sticker}</Text>
      </View>

      <View className="flex-1 justify-end px-7 pb-24">
        <Text className="font-script text-[40px] leading-[44px] text-white">
          {slide.kicker}
        </Text>
        <Text className="mt-3 font-displayMedium text-[34px] leading-[38px] text-white">
          {slide.title}
        </Text>
      </View>
    </View>
  );
}
