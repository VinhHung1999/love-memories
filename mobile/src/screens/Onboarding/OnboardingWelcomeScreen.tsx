import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { Body, Heading } from '../../components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native'; // eslint-disable-line @typescript-eslint/no-unused-vars
import type { OnboardingStackParamList } from '../../navigation/index';
import { Heart } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import SpringPressable from '../../components/SpringPressable';
import t from '../../locales/en';
import { useAppColors } from '../../navigation/theme';

// ── Progress Dots ─────────────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className="rounded-full"
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            backgroundColor: i === step ? colors.primary : colors.primary + '40',
          }}
        />
      ))}
    </View>
  );
}

// ── Floating Heart ────────────────────────────────────────────────────────────

function FloatingHeart({
  x, y, size, delay, opacity,
}: {
  x: number; y: number; size: number; delay: number; opacity: number;
}) {
  const colors = useAppColors();
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 3000 }),
          withTiming(8, { duration: 3000 }),
        ),
        -1,
        true,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity,
    position: 'absolute',
    left: x,
    top: y,
  }));

  return (
    <Animated.View style={animStyle}>
      <Heart size={size} color={colors.primary} fill={colors.primary} strokeWidth={0} />
    </Animated.View>
  );
}

// ── Pulsing Center Heart ──────────────────────────────────────────────────────

function PulsingHeart() {
  const colors = useAppColors();
  const scale = useSharedValue(1);
  const outerScale = useSharedValue(0.8);
  const outerOpacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      true,
    );
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1800 }),
        withTiming(0.8, { duration: 0 }),
      ),
      -1,
      false,
    );
    outerOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1800 }),
        withTiming(0.25, { duration: 0 }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: outerOpacity.value,
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary,
  }));

  return (
    <View className="items-center justify-center" style={{ width: 120, height: 120 }}>
      <Animated.View style={ringStyle} />
      <Animated.View style={heartStyle}>
        <Heart size={72} color={colors.primary} fill={colors.primary} strokeWidth={0} />
      </Animated.View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingWelcomeScreen() {
  const colors = useAppColors();
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _route = useRoute<RouteProp<OnboardingStackParamList, 'OnboardingCouple'>>();

  const btnScale = useSharedValue(0.8);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    btnScale.value = withDelay(600, withSpring(1, { damping: 12, stiffness: 120 }));
    btnOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
    opacity: btnOpacity.value,
  }));

  const handleStart = () => {
    navigation.navigate('OnboardingCouple');
  };

  return (
    <LinearGradient
      colors={[colors.primaryLighter, colors.baseBg, '#FFF5EE']}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View className="flex-1 items-center justify-between px-8 pt-16 pb-12">

        {/* Progress dots */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ProgressDots step={0} total={4} />
        </Animated.View>

        {/* Illustration area */}
        <View className="flex-1 items-center justify-center relative" style={{ width: '100%' }}>
          {/* Floating background hearts */}
          <FloatingHeart x={20}  y={10}  size={18} delay={0}    opacity={0.25} />
          <FloatingHeart x={260} y={30}  size={14} delay={400}  opacity={0.20} />
          <FloatingHeart x={50}  y={120} size={10} delay={800}  opacity={0.18} />
          <FloatingHeart x={240} y={90}  size={22} delay={200}  opacity={0.22} />
          <FloatingHeart x={130} y={0}   size={12} delay={600}  opacity={0.15} />
          <FloatingHeart x={15}  y={180} size={16} delay={1000} opacity={0.20} />
          <FloatingHeart x={260} y={180} size={12} delay={500}  opacity={0.18} />

          {/* Center pulsing heart */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <PulsingHeart />
          </Animated.View>
        </View>

        {/* Text content */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} className="items-center mb-10">
          <Heading
            size="xl"
            className="text-textDark dark:text-darkTextDark text-center leading-tight mb-3"
            style={{ fontSize: 30, lineHeight: 38 }}>
            {t.onboarding.welcome.title}
          </Heading>
          <Body size="md" className="text-textMid dark:text-darkTextMid text-center" style={{ lineHeight: 22 }}>
            {t.onboarding.welcome.subtitle}
          </Body>
        </Animated.View>

        {/* CTA button */}
        <Animated.View style={[btnStyle, { width: '100%' }]}>
          <SpringPressable
            onPress={handleStart}
            className="w-full h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary }}>
            <Body size="lg" className="font-semibold" style={{ color: '#fff', letterSpacing: 0.3 }}>
              {t.onboarding.welcome.cta}  →
            </Body>
          </SpringPressable>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}
