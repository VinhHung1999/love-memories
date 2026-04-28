import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePairWaitViewModel } from './usePairWaitViewModel';

// Sprint 68 T467 — Wait screen.
//
// Visual structure (top to bottom):
//   1. Full-bleed three-stop gradient (heroA → heroB → heroC) per spec.
//   2. Animated 💞 pulse — Reanimated v4 sharedValue, scale 1↔1.08 with
//      a 1.6s sine cycle. Theme tokens are read here in the View, not in
//      the worklet (memory feedback_reanimated_worklet_colors).
//   3. Dancing-Script kicker "đang chờ".
//   4. Display-italic title "Còn một người nữa".
//   5. Body that splices the slogan if present, else generic fallback.
//   6. Tappable invite-code pill (haptic + clipboard, flashes "Đã copy").
//   7. Bottom CTA "Mở Zalo gửi mã" — re-share, NO navigation.
//
// No back button, no skip — pair commitment is one-way. Hardware back +
// edge-swipe are blocked by the VM (Android BackHandler) and the layout
// (gestureEnabled:false on this Stack.Screen) respectively.

export function PairWaitScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { inviteCode, slogan, copied, onCopyCode, onShareToZalo } = usePairWaitViewModel();

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const bodyText = slogan
    ? t('onboarding.pairWait.bodyWithSlogan', { slogan })
    : t('onboarding.pairWait.body');

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute inset-0">
        <LinearGradient
          colors={[c.heroA, c.heroB, c.heroC]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1 px-7">
        {/* Top filler so the hero composition centers visually under the
            notch / Dynamic Island instead of clinging to the very top. */}
        <View className="flex-1" />

        <View className="items-center">
          <Animated.View style={heartStyle}>
            <Text className="text-[72px] leading-[80px]">💞</Text>
          </Animated.View>

          <Text className="font-script text-white/85 text-[26px] mt-4">
            {t('onboarding.pairWait.kicker')}
          </Text>
          <Text className="font-displayItalic text-white text-[34px] leading-[40px] mt-1 text-center">
            {t('onboarding.pairWait.title')}
          </Text>
          <Text className="font-body text-white/80 text-[15px] leading-[22px] mt-4 text-center">
            {bodyText}
          </Text>

          {inviteCode ? (
            <Pressable
              onPress={onCopyCode}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.pairWait.copyCodeA11y')}
              hitSlop={8}
              className="mt-7 flex-row items-center bg-white/15 rounded-full px-5 py-3 border border-white/30 active:opacity-80"
            >
              <Text className="font-bodyBold text-white/70 text-[11px] uppercase tracking-[1.6px] mr-2">
                {t('onboarding.pairWait.codeLabel')}
              </Text>
              <Text className="font-displayBold text-white text-[20px] tracking-[2px]">
                {inviteCode.toUpperCase()}
              </Text>
            </Pressable>
          ) : null}

          {copied ? (
            <Text className="font-body text-white/85 text-[12px] mt-2">
              {t('onboarding.pairWait.copied')}
            </Text>
          ) : null}
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={onShareToZalo}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.pairWait.cta')}
          hitSlop={8}
          className="rounded-full py-4 px-6 bg-white/95 active:opacity-90 mb-6"
        >
          <Text className="font-bodyBold text-ink text-center text-[16px]">
            {t('onboarding.pairWait.cta')}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
