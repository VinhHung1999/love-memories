import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, RadialGradient, Rect, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useOnboardingDoneViewModel } from './useOnboardingDoneViewModel';

// Sprint 68 D4prime — OnboardingDone 1:1 with prototype `pairing.jsx` L1377-1573.
// Full redesign: 170° hero gradient, ambient radial wash overlay, 6 floating
// sparkles (memoPulse: scale 1↔1.4 + opacity, staggered durations + delays),
// giant heart watermark behind, "đã ghép đôi" status pill at top, linked
// 88×88 avatar pair with center beating heart, hero text block at top:248,
// 3 frosted "first things" cards, big white enter button with double-shadow,
// closing kicker.
//
// Reanimated v4 pulse/heartbeat: sharedValue mutated outside any worklet
// (memory feedback_reanimated_worklet_colors). useAppColors() consumed in
// the View body, never inside useAnimatedStyle.

const SPARKLES: ReadonlyArray<readonly [number, number, number, number]> = [
  [15, 22, 4, 0],
  [82, 28, 3, 0.4],
  [25, 70, 5, 0.8],
  [78, 78, 4, 0.2],
  [50, 14, 3, 0.6],
  [10, 50, 3, 0.3],
];

const HEART_PATH =
  'M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11';

export function OnboardingDoneScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const { selfName, partnerName, slogan, anniversaryLabel, entering, onEnter } =
    useOnboardingDoneViewModel();
  const { width, height } = useWindowDimensions();

  const self = (selfName ?? '').trim() || t('onboarding.done.titleSelfFallback');
  const partner =
    partnerName?.trim() || t('onboarding.done.titlePartnerFallback');
  const names = `${self} & ${partner}`;
  const trimmedSlogan = slogan?.trim() ?? '';
  const sinceLine = anniversaryLabel
    ? t('onboarding.done.sinceWithDate', { date: anniversaryLabel })
    : t('onboarding.done.sinceToday');

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        className="absolute inset-0"
      />

      {/* Ambient radial wash + giant heart watermark + sparkles all sit
          above the gradient and below interactive content. pointerEvents
          off so the bottom CTA still receives taps. */}
      <Svg
        pointerEvents="none"
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <RadialGradient id="ambientLight" cx="0.22" cy="0.18" rx="0.55" ry="0.55" fx="0.22" fy="0.18">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ambientShadow" cx="0.85" cy="0.92" rx="0.55" ry="0.55" fx="0.85" fy="0.92">
            <Stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#ambientLight)" />
        <Rect x="0" y="0" width={width} height={height} fill="url(#ambientShadow)" />
      </Svg>

      <View
        pointerEvents="none"
        className="absolute"
        style={{
          right: -120,
          top: -40,
          opacity: 0.06,
          transform: [{ rotate: '-12deg' }],
        }}
      >
        <Svg width={420} height={420} viewBox="0 0 24 24">
          <Path d={HEART_PATH} fill="#FFFFFF" />
        </Svg>
      </View>

      {SPARKLES.map(([x, y, size, delay], i) => (
        <Sparkle
          key={`spark-${i}`}
          xPercent={x}
          yPercent={y}
          size={size}
          delay={delay * 1000}
          duration={1600 + (i % 3) * 300}
        />
      ))}

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* Status pill — "đã ghép đôi" / "paired" — anchored 64px from
            top per prototype L1411-1432. */}
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 items-center"
          style={{ top: 64 }}
        >
          <View
            className="flex-row items-center rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              paddingLeft: 8,
              paddingRight: 14,
              paddingVertical: 7,
            }}
          >
            <View
              className="w-[18px] h-[18px] rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: '#7EC8B5' }}
            >
              <Text className="font-bodyBold text-white text-[10px]">✓</Text>
            </View>
            <Text
              className="font-bodyBold text-white text-[11px] uppercase"
              style={{ letterSpacing: 1.32 }}
            >
              {t('onboarding.done.status')}
            </Text>
          </View>
        </View>

        {/* Linked avatars hero — top:130, gap-4, rotate ±4°. */}
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 flex-row justify-center items-center"
          style={{ top: 130, gap: 4 }}
        >
          <AvatarTile
            initial={self.charAt(0).toUpperCase()}
            colors={[c.secondary, c.heroA]}
            rotate={-4}
          />
          <BeatingHeart accentColor={c.primary} />
          <AvatarTile
            initial={partner.charAt(0).toUpperCase()}
            colors={[c.accent ?? c.secondary, c.primary]}
            rotate={4}
          />
        </View>

        {/* Hero text block — absolute top:248. */}
        <View
          pointerEvents="none"
          className="absolute"
          style={{ left: 28, right: 28, top: 248 }}
        >
          <Text
            className="font-script text-[28px] leading-[28px] mb-2.5"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            {t('onboarding.done.eyebrow')}
          </Text>
          <Text
            className="font-displayItalic text-white text-[48px] leading-[49px]"
            style={{
              letterSpacing: -0.03 * 48,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 30,
            }}
          >
            {t('onboarding.done.title', { names })}
          </Text>

          <View
            className="self-start flex-row items-center mt-4 rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={9} stroke="#FFFFFF" strokeWidth={2} />
              <Path d="M12 7v5l3 2" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text
              className="ml-2 font-bodyBold text-white text-[11px] uppercase"
              style={{ letterSpacing: 1.1 }}
            >
              {sinceLine}
            </Text>
          </View>

          {trimmedSlogan ? (
            <Text className="mt-3 font-script text-white/85 text-[18px] leading-[22px]">
              {trimmedSlogan}
            </Text>
          ) : null}
        </View>

        {/* Spacer pushes CTA + cards block to bottom. */}
        <View className="flex-1" />

        {/* "First things" cards — left/right 16, bottom 132. */}
        <View className="absolute left-4 right-4" style={{ bottom: 132 }}>
          <View className="flex-row" style={{ gap: 8 }}>
            {(['moment', 'letter', 'question'] as const).map((kind) => (
              <FirstThingCard
                key={kind}
                emoji={t(`onboarding.done.firstThings.${kind}.icon`)}
                title={t(`onboarding.done.firstThings.${kind}.title`)}
                sub={t(`onboarding.done.firstThings.${kind}.sub`)}
                accentColor={c.primary}
              />
            ))}
          </View>
        </View>

        {/* Enter button + closing kicker — bottom 36, px 16. */}
        <View className="absolute left-0 right-0 px-4" style={{ bottom: 36 }}>
          <Pressable
            onPress={entering ? undefined : onEnter}
            accessibilityRole="button"
            accessibilityState={{ busy: entering }}
            className="w-full flex-row items-center justify-center rounded-full bg-white py-4 px-5 active:opacity-90"
            style={{
              shadowColor: '#000000',
              shadowOpacity: 0.25,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 16 },
              elevation: 10,
            }}
          >
            {entering ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <>
                {/* T329 carry-over: white-bg button — text must use the
                    light-mode ink hex so dark-mode `ink` doesn't flip the
                    label invisible. */}
                <Text className="font-bodyBold text-[#2A1A1E] text-[15px]">
                  {t('onboarding.done.cta')}
                </Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 10 }}>
                  <Path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#2A1A1E"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </>
            )}
          </Pressable>
          <Text className="mt-2.5 text-center font-script text-white/85 text-[18px]">
            {t('onboarding.done.kicker')}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// memoPulse — small white dot with scale + opacity pulsation. Each sparkle
// runs its own loop with a per-instance delay so the field doesn't beat in
// unison.
function Sparkle({
  xPercent,
  yPercent,
  size,
  delay,
  duration,
}: {
  xPercent: number;
  yPercent: number;
  size: number;
  delay: number;
  duration: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + progress.value * 0.5,
    transform: [{ scale: 1 + progress.value * 0.4 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full bg-white"
      style={[
        {
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: size,
          height: size,
          shadowColor: '#FFFFFF',
          shadowOpacity: 0.8,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
      ]}
    />
  );
}

function AvatarTile({
  initial,
  colors,
  rotate,
}: {
  initial: string;
  colors: [string, string];
  rotate: number;
}) {
  return (
    <View
      pointerEvents="none"
      className="w-[88px] h-[88px] rounded-3xl overflow-hidden items-center justify-center"
      style={{
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        transform: [{ rotate: `${rotate}deg` }],
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <RadialGradient id={`tileWash-${initial}-${rotate}`} cx="0.30" cy="0.20" rx="0.60" ry="0.60" fx="0.30" fy="0.20">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#tileWash-${initial}-${rotate})`} />
      </Svg>
      <Text
        className="font-displayBold text-white text-[40px]"
        style={{ letterSpacing: -0.04 * 40 }}
      >
        {initial}
      </Text>
    </View>
  );
}

function BeatingHeart({ accentColor }: { accentColor: string }) {
  const beat = useSharedValue(1);
  useEffect(() => {
    beat.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(beat);
  }, [beat]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beat.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="w-[52px] h-[52px] rounded-full bg-white items-center justify-center"
      style={[
        {
          marginHorizontal: -8,
          zIndex: 2,
          shadowColor: '#000000',
          shadowOpacity: 0.25,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 12 },
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <Text
        className="font-bodyBold text-[26px]"
        style={{ color: accentColor }}
      >
        ♥
      </Text>
    </Animated.View>
  );
}

function FirstThingCard({
  emoji,
  title,
  sub,
  accentColor,
}: {
  emoji: string;
  title: string;
  sub: string;
  accentColor: string;
}) {
  return (
    <View
      className="flex-1 rounded-[18px] px-2.5 py-3"
      style={{
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
      }}
    >
      <View
        className="w-8 h-8 rounded-[10px] items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
      >
        <Text
          className="font-displayBold text-[16px]"
          style={{ color: accentColor }}
        >
          {emoji}
        </Text>
      </View>
      <Text className="mt-2 font-bodyBold text-white text-[11px] leading-[14px]">
        {title}
      </Text>
      <Text className="mt-0.5 font-body text-white/70 text-[10px]">{sub}</Text>
    </View>
  );
}
