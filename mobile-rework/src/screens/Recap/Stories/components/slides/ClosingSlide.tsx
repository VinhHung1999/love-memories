// Sprint 67 T459 — Closing slide. Sunset hero gradient + Dancing
// Script kicker (scope-expanded for Recap per Sprint 67 PO greenlight),
// large display title (whitespace pre-line for natural break), body,
// signature row with avatar pair + script font name + period.

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../types';

type ClosingSlide = Extract<Slide, { kind: 'closing' }>;

type Props = { slide: ClosingSlide };

export function ClosingSlide({ slide }: Props) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View className="flex-1 justify-end px-7 pb-24">
        <Text className="font-script text-[26px] text-white/95">Lời kết</Text>
        <Text
          className="mt-3 font-displayMedium text-[44px] leading-[48px] text-white"
          style={{
            textShadowColor: 'rgba(0,0,0,0.25)',
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 30,
          }}
        >
          {slide.title}
        </Text>
        <Text className="mt-4 font-bodyMedium text-[15px] leading-[22px] text-white/95">
          {slide.body}
        </Text>
        <View className="mt-6 flex-row items-center gap-3">
          <View className="flex-row">
            <View
              className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/70"
            >
              <LinearGradient
                colors={[c.heroA, c.heroB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="font-bodyBold text-[13px] text-white">
                  {slide.initialA}
                </Text>
              </LinearGradient>
            </View>
            <View
              className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/70"
              style={{ marginLeft: -10 }}
            >
              <LinearGradient
                colors={[c.secondary, c.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="font-bodyBold text-[13px] text-white">
                  {slide.initialB}
                </Text>
              </LinearGradient>
            </View>
          </View>
          <Text className="font-script text-[22px] text-white/95">
            {slide.signature}
          </Text>
        </View>
      </View>
    </View>
  );
}
