// Sprint 67 T454 — Section 06 Top Q card (prototype `recap.jsx` L324-367).
// Quote-style card on accentSoft → surface gradient. Big translucent
// opening quote in the corner; question text in display font; two
// stacked partner-initial avatars + "asked N times" meta below.
//
// `nullCopy` renders when no Daily Q response exists this period — the
// section still mounts so the prototype kicker "06" stays in place.

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

type Props = {
  text: string;
  meta: string;             // 'Mình đã hỏi nhau 4 lần trong tháng'
  initialA: string;
  initialB: string;
};

export function TopQuestionCard({ text, meta, initialA, initialB }: Props) {
  const c = useAppColors();
  return (
    <View className="mt-3.5 overflow-hidden rounded-[22px] border border-line">
      <LinearGradient
        colors={[c.accentSoft, c.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="px-5 pb-4 pt-5">
          <Text
            className="absolute right-4 -top-4 font-displayBold text-[120px] leading-[120px]"
            style={{ color: c.accent, opacity: 0.15 }}
          >
            “
          </Text>
          <Text className="font-displayMedium text-[22px] leading-[27px] text-ink">
            {text}
          </Text>
          <View className="mt-3.5 flex-row items-center gap-2">
            <View className="flex-row">
              <View className="h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full border-2 border-surface">
                <LinearGradient
                  colors={[c.heroA, c.heroB]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="font-bodyBold text-[10px] text-white">{initialA}</Text>
                </LinearGradient>
              </View>
              <View
                className="h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full border-2 border-surface"
                style={{ marginLeft: -6 }}
              >
                <LinearGradient
                  colors={[c.secondary, c.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="font-bodyBold text-[10px] text-white">{initialB}</Text>
                </LinearGradient>
              </View>
            </View>
            <Text className="font-body text-[12px] text-ink-mute">{meta}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
