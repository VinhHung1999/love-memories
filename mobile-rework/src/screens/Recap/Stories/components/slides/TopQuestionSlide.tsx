// Sprint 67 T459 — Top question slide. Gradient + huge translucent
// opening quote watermark, question text large display, two avatars
// stacked + "asked N times" meta below.

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { Slide } from '../../types';

type TopQuestionSlide = Extract<Slide, { kind: 'topQuestion' }>;

type Props = { slide: TopQuestionSlide };

export function TopQuestionSlide({ slide }: Props) {
  const c = useAppColors();
  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.accentSoft, c.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <Text
        className="absolute font-displayBold"
        style={{
          top: 40,
          right: 30,
          fontSize: 240,
          lineHeight: 240,
          color: c.accent,
          opacity: 0.18,
        }}
      >
        “
      </Text>

      <View className="flex-1 justify-center px-7">
        <Text className="font-displayMedium text-[34px] leading-[40px] text-ink">
          {slide.text}
        </Text>
        <View className="mt-7 flex-row items-center gap-3">
          <View className="flex-row">
            <View
              className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2"
              style={{ borderColor: c.bg }}
            >
              <LinearGradient
                colors={[c.heroA, c.heroB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="font-bodyBold text-[12px] text-white">{slide.initialA}</Text>
              </LinearGradient>
            </View>
            <View
              className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2"
              style={{ marginLeft: -10, borderColor: c.bg }}
            >
              <LinearGradient
                colors={[c.secondary, c.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="font-bodyBold text-[12px] text-white">{slide.initialB}</Text>
              </LinearGradient>
            </View>
          </View>
          <Text className="font-body text-[13px] text-ink-soft">{slide.meta}</Text>
        </View>
      </View>
    </View>
  );
}
