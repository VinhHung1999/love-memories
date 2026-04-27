// Sprint 67 T454 — Closing note (prototype `recap.jsx` L466-519). Big
// gradient heroA→heroB→heroC card with kicker (script font), display
// title (whitespace pre-line for the comma break), body, and a
// signature row (avatar pair + script font name + period).
//
// Dancing Script font scope expanded to Recap surface per PO 2026-04-27
// decision (sprint 67 update).

import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

type Props = {
  kicker: string;
  title: string;             // 'Cảm ơn Minh\nvì tháng này.'
  body: string;
  signature: string;         // 'Lu & Zu · Tháng 3, 2026'
  initialA: string;
  initialB: string;
};

export function ClosingNoteCard({
  kicker,
  title,
  body,
  signature,
  initialA,
  initialB,
}: Props) {
  const c = useAppColors();
  return (
    <View className="mx-4 mt-7 overflow-hidden rounded-[28px]">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <View className="px-6 pb-7 pt-8">
          <Text className="font-script text-[22px] text-white/90">{kicker}</Text>
          <Text
            className="mt-2.5 font-displayMedium text-[40px] leading-[42px] text-white"
            style={{ textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 30 }}
          >
            {title}
          </Text>
          <Text className="mt-3.5 font-bodyMedium text-[14px] leading-[21px] text-white/90">
            {body}
          </Text>
          <View className="mt-5 flex-row items-center gap-2">
            <View className="flex-row">
              <View className="h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white/70">
                <LinearGradient
                  colors={[c.heroA, c.heroB]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="font-bodyBold text-[12px] text-white">{initialA}</Text>
                </LinearGradient>
              </View>
              <View
                className="h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white/70"
                style={{ marginLeft: -8 }}
              >
                <LinearGradient
                  colors={[c.secondary, c.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="font-bodyBold text-[12px] text-white">{initialB}</Text>
                </LinearGradient>
              </View>
            </View>
            <Text className="font-script text-[20px] text-white/90">{signature}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
