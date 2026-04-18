import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useWelcomeViewModel } from './useWelcomeViewModel';

// Polaroid stack ports `WelcomeScreen` from
// docs/design/prototype/memoura-v2/onboarding.jsx:5. Original positions
// `translate(calc(-50% + Xpx), Ypx) rotate(Rdeg)` are pre-resolved against the
// 260×320 stack frame: polaroid is 186 wide → centered offset = (260−186)/2 = 37,
// then add the prototype's per-card x.
const POLAROID_POSITIONS = [
  'top-[10px] left-[-3px] -rotate-[8deg] z-10',
  'top-[40px] left-[67px] rotate-[5deg] z-20',
  'top-[60px] left-[32px] -rotate-[2deg] z-30',
] as const;

export function WelcomeScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { onStart, onLogin } = useWelcomeViewModel();

  const polaroidGradients: readonly (readonly [string, string])[] = [
    [c.primarySoft, c.secondarySoft],
    [c.accentSoft, c.primarySoft],
    [c.secondarySoft, c.accentSoft],
  ];
  const polaroidLabels = [
    t('onboarding.welcome.polaroidLabels.one'),
    t('onboarding.welcome.polaroidLabels.two'),
    t('onboarding.welcome.polaroidLabels.three'),
  ];

  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="absolute inset-0"
      />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="items-center mt-[60px] h-[330px]">
          <View className="relative w-[260px] h-full">
            {POLAROID_POSITIONS.map((posClass, i) => (
              <View
                key={i}
                className={`absolute w-[186px] h-[220px] bg-white rounded-lg shadow-lg ${posClass}`}
              >
                <View className="absolute top-[10px] left-[10px] right-[10px] bottom-[36px] rounded-[2px] overflow-hidden">
                  <LinearGradient
                    colors={[polaroidGradients[i][0], polaroidGradients[i][1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0"
                  />
                  <Svg width="100%" height="100%" viewBox="0 0 100 100" opacity={0.35}>
                    <PolaroidSilhouette idx={i} fill={c.inkSoft} />
                  </Svg>
                </View>
                <Text className="absolute bottom-[8px] left-0 right-0 text-center font-displayItalic text-base text-ink-soft">
                  {polaroidLabels[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="flex-1" />

        <View className="absolute left-0 right-0 bottom-0 h-[360px]" pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.45)']}
            locations={[0, 0.45, 1]}
            className="absolute inset-0"
          />
        </View>

        <View className="px-7 pt-10 pb-12">
          <Text className="font-displayItalic uppercase text-white/90 text-xs leading-none tracking-[2.4px]">
            {t('onboarding.welcome.accent')}
          </Text>
          <Text className="mt-3 font-displayMediumItalic text-white text-[56px] leading-[54px]">
            {t('onboarding.welcome.title')}
          </Text>
          <Text className="mt-4 font-body text-white/90 text-[15px] leading-snug max-w-[300px]">
            {t('onboarding.welcome.body')}
          </Text>

          <View className="mt-7 gap-2.5">
            <Pressable
              onPress={onStart}
              accessibilityRole="button"
              className="flex-row items-center justify-center bg-white rounded-full py-4 px-5 shadow-lg active:opacity-90"
            >
              <Text className="font-bodyBold text-ink text-[15px]">
                {t('onboarding.welcome.ctaPrimary')}
              </Text>
              <Text className="font-bodyBold text-ink text-base ml-2">→</Text>
            </Pressable>
            <Pressable
              onPress={onLogin}
              accessibilityRole="button"
              className="flex-row items-center justify-center bg-transparent border border-white/45 rounded-full py-3.5 px-5 active:opacity-80"
            >
              <Text className="font-bodySemibold text-white text-sm">
                {t('onboarding.welcome.ctaSecondary')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function PolaroidSilhouette({ idx, fill }: { idx: number; fill: string }) {
  if (idx === 0) {
    return <Path d="M0,80 Q25,40 50,55 T100,50 L100,100 L0,100 Z" fill={fill} />;
  }
  if (idx === 1) {
    return (
      <>
        <Circle cx="35" cy="45" r="10" fill={fill} />
        <Circle cx="65" cy="50" r="12" fill={fill} />
      </>
    );
  }
  return <Path d="M20,60 Q50,30 80,60 Q65,85 50,85 Q35,85 20,60 Z" fill={fill} />;
}
