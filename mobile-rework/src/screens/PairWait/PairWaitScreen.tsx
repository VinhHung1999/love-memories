import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
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
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from '@/components';
import { env } from '@/config/env';
import { useAppColors } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { usePairWaitViewModel } from './usePairWaitViewModel';

// Sprint 68 D2prime → BUG-6 (Boss build 134) — PairWait is now PairInvite
// per prototype L165-540. Cinematic hero gradient + radial wash + heart
// watermark + 4 floating sparkles, glassmorphism top bar (back-circle +
// "đang chờ ghép" status pill), Dancing-Script kicker → display-italic
// hero title, postcard invitation card with dashed "From → To" bar +
// stamp + code slots + expires pill, then share / copy actions and a
// privacy hint. VM logic (4s poll + push listener + notif-perm popup +
// hardware back-handler) is untouched — only the UI shell changed.

const HERO_HEIGHT = 380;
const SPARKLES: ReadonlyArray<readonly [number, number, number]> = [
  [20, 60, 4],
  [80, 40, 3],
  [60, 90, 5],
  [10, 30, 3],
];
const HEART_PATH =
  'M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11';

// Format the BE 8-char hex (e.g. "a1b2c3d4") as a friendly upper-case pair
// of 4-char groups joined by an em-dash so the postcard reads as a
// well-spaced code rather than a wall of hex.
function formatCode(code: string | null): string[] {
  if (!code) return [];
  const upper = code.toUpperCase();
  if (upper.length <= 4) return upper.split('');
  return [...upper.slice(0, 4).split(''), '-', ...upper.slice(4).split('')];
}

export function PairWaitScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const userName = useAuthStore((s) => s.user?.name ?? null);
  const { inviteCode, slogan, copied, onCopyCode } = usePairWaitViewModel();

  const codeSlots = formatCode(inviteCode);
  const userInitial = (userName?.trim()?.charAt(0) ?? '?').toUpperCase();
  const userLabel = userName?.trim() || t('onboarding.pairWait.youFallback');
  const inviteUrl = inviteCode
    ? `${env.appBaseUrl.replace(/^https?:\/\//, '')}/i/${inviteCode.toLowerCase()}`
    : '';

  const onShareInvite = async () => {
    if (!inviteCode) return;
    const message = t('onboarding.pairWait.shareMessage', {
      url: inviteUrl,
      code: inviteCode.toLowerCase(),
    });
    try {
      await Share.share({ message });
    } catch {
      // user cancel or platform error — silent.
    }
  };

  return (
    <View className="flex-1 bg-bg">
      {/* Hero region — gradient + ambient wash + heart watermark + sparkles
          all clipped to the top 380px so the postcard sits cleanly on the
          surface bg below. */}
      <View
        pointerEvents="none"
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: HERO_HEIGHT }}
      >
        <LinearGradient
          colors={[c.heroA, c.heroB, c.heroC]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          className="absolute inset-0"
        />
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <RadialGradient id="waitWashLight" cx="0.25" cy="0.15" rx="0.55" ry="0.55" fx="0.25" fy="0.15">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="waitWashShadow" cx="0.85" cy="0.95" rx="0.55" ry="0.55" fx="0.85" fy="0.95">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#waitWashLight)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#waitWashShadow)" />
        </Svg>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -60,
            bottom: -50,
            opacity: 0.08,
            transform: [{ rotate: '-12deg' }],
          }}
        >
          <Svg width={280} height={280} viewBox="0 0 24 24">
            <Path d={HEART_PATH} fill="#FFFFFF" />
          </Svg>
        </View>
        {SPARKLES.map(([x, y, size], i) => (
          <Sparkle
            key={`spark-${i}`}
            xPercent={x}
            yPercent={y}
            size={size}
            delay={i * 200}
            duration={1500 + i * 300}
          />
        ))}
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* Glassmorphism top bar — back-circle (visual; the layout locks
            gesture and the stack has no useful pop target) + "đang chờ
            ghép" status pill on the right. */}
        <View className="px-6 h-14 flex-row items-center justify-between">
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 6l-6 6 6 6"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View
            className="flex-row items-center rounded-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <PulseDot color="#7EC8B5" />
            <Text
              className="ml-1.5 font-bodyBold text-white text-[11px] uppercase"
              style={{ letterSpacing: 1.1 }}
            >
              {t('onboarding.pairWait.status')}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero text */}
          <View className="px-7 pt-3">
            <Text className="font-script text-[22px] leading-[22px] text-white/90">
              {t('onboarding.pairWait.kicker')}
            </Text>
            <Text
              className="mt-1.5 font-displayItalic text-white text-[38px] leading-[40px]"
              style={{
                letterSpacing: -0.025 * 38,
                textShadowColor: 'rgba(0,0,0,0.2)',
                textShadowOffset: { width: 0, height: 4 },
                textShadowRadius: 30,
              }}
            >
              {t('onboarding.pairWait.title', {
                partner: t('onboarding.pairWait.partnerFallback'),
              })}
            </Text>
          </View>

          {/* Postcard invitation card — back layer for paper-stack feel,
              main card with stamp + code + expires pill. */}
          <View className="px-6 mt-7">
            <View className="relative">
              <View
                pointerEvents="none"
                className="absolute rounded-[28px]"
                style={{
                  top: 6,
                  left: 4,
                  right: -4,
                  bottom: -4,
                  backgroundColor: c.secondarySoft,
                  opacity: 0.7,
                  transform: [{ rotate: '-2deg' }],
                }}
              />
              <View
                className="rounded-[28px] overflow-hidden"
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.line,
                  shadowColor: '#000000',
                  shadowOpacity: 0.25,
                  shadowRadius: 30,
                  shadowOffset: { width: 0, height: 30 },
                  elevation: 8,
                }}
              >
                {/* Top "From → To" bar with dashed bottom border */}
                <View
                  className="px-4 py-3.5 flex-row items-center"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: c.line,
                    borderStyle: 'dashed',
                    gap: 10,
                  }}
                >
                  <View pointerEvents="none" className="absolute inset-0">
                    <LinearGradient
                      colors={[c.primarySoft, c.secondarySoft]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="absolute inset-0"
                    />
                  </View>
                  <View
                    className="w-[30px] h-[30px] rounded-full items-center justify-center overflow-hidden"
                    style={{ borderWidth: 2, borderColor: '#FFFFFF' }}
                  >
                    <LinearGradient
                      colors={[c.heroA, c.heroB]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="absolute inset-0"
                    />
                    <Text className="font-bodyBold text-white text-[12px]">
                      {userInitial}
                    </Text>
                  </View>
                  <Text className="font-bodyBold text-ink text-[12px]">
                    {userLabel}
                  </Text>
                  <Svg width={40} height={14} viewBox="0 0 40 14" style={{ flex: 1 }}>
                    <Path
                      d="M2 7 L 38 7"
                      stroke={c.primaryDeep}
                      strokeWidth={1.5}
                      strokeDasharray="2 3"
                      strokeLinecap="round"
                      opacity={0.6}
                    />
                    <Path
                      d="M32 3 L 38 7 L 32 11"
                      stroke={c.primaryDeep}
                      strokeWidth={1.5}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.6}
                    />
                  </Svg>
                  <Text className="font-bodyBold text-ink-mute text-[12px]">
                    {t('onboarding.pairWait.partnerFallback')}
                  </Text>
                  <View
                    className="w-[30px] h-[30px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor: c.surface,
                      borderWidth: 2,
                      borderColor: c.inkMute,
                      borderStyle: 'dashed',
                    }}
                  >
                    <Text className="font-bodyBold text-[14px]" style={{ color: c.inkMute }}>
                      ?
                    </Text>
                  </View>
                </View>

                {/* Body — stamp + code label + code slots + expires pill */}
                <View className="px-6 pt-6 pb-5 items-center relative">
                  {/* Stamp */}
                  <View
                    pointerEvents="none"
                    className="absolute items-center justify-center rounded-md overflow-hidden"
                    style={{
                      top: 12,
                      right: 14,
                      width: 56,
                      height: 64,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.6)',
                      borderStyle: 'dashed',
                      transform: [{ rotate: '8deg' }],
                      shadowColor: '#000000',
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 3,
                    }}
                  >
                    <LinearGradient
                      colors={[c.primary, c.primaryDeep]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="absolute inset-0"
                    />
                    <Text className="text-white text-[18px] leading-[20px]">♥</Text>
                    <Text
                      className="font-bodyBold text-white text-[8px] uppercase mt-0.5"
                      style={{ letterSpacing: 0.64 }}
                    >
                      memoura
                    </Text>
                    <Text
                      className="font-bodyBold text-white/85 text-[7px] uppercase"
                      style={{ letterSpacing: 0.42 }}
                    >
                      2026
                    </Text>
                  </View>

                  <Text
                    className="font-script text-[20px] leading-[22px]"
                    style={{ color: c.primaryDeep }}
                  >
                    {t('onboarding.pairWait.codeLabel')}
                  </Text>

                  <View className="flex-row items-center justify-center mt-3.5" style={{ gap: 5 }}>
                    {codeSlots.map((ch, i) =>
                      ch === '-' ? (
                        <Text
                          key={`sep-${i}`}
                          className="font-displayBold text-[32px] leading-[32px] text-center"
                          style={{ width: 12, color: c.inkMute }}
                        >
                          ·
                        </Text>
                      ) : (
                        <View
                          key={`slot-${i}`}
                          className="rounded-lg items-center justify-center"
                          style={{
                            width: 32,
                            height: 44,
                            backgroundColor: c.surfaceAlt,
                            borderWidth: 1,
                            borderColor: c.line,
                          }}
                        >
                          <Text className="font-displayBold text-ink text-[22px]">{ch}</Text>
                        </View>
                      ),
                    )}
                  </View>

                  <View
                    className="self-center flex-row items-center rounded-full mt-3.5 px-2.5 py-1"
                    style={{ backgroundColor: c.surfaceAlt, gap: 6 }}
                  >
                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 12 V 7 M 12 12 L 15 14"
                        stroke={c.inkMute}
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                    <Text className="font-bodyMedium text-[11px]" style={{ color: c.inkSoft }}>
                      {t('onboarding.pairWait.expiresHint')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {slogan?.trim() ? (
              <Text className="mt-4 font-script text-center text-[18px] text-ink-soft">
                {slogan.trim()}
              </Text>
            ) : null}
          </View>

          {/* Share actions — Zalo (brand blue), Copy (ink), Share (surface) */}
          <View className="px-6 mt-6 flex-row" style={{ gap: 8 }}>
            <ShareButton
              label={t('onboarding.pairWait.shareZalo')}
              variant="zalo"
              onPress={onShareInvite}
            />
            <ShareButton
              label={
                copied
                  ? t('onboarding.pairWait.copied')
                  : t('onboarding.pairWait.copyCode')
              }
              variant="ink"
              onPress={onCopyCode}
            />
            <ShareButton
              label={t('onboarding.pairWait.shareOther')}
              variant="surface"
              onPress={onShareInvite}
            />
          </View>

          <Text className="mt-6 px-6 pb-10 text-center font-body text-[13px] text-ink-soft leading-[18px]">
            {t('onboarding.pairWait.privacy')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PulseDot({ color }: { color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [progress]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + progress.value * 0.4,
    transform: [{ scale: 1 + progress.value * 0.4 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="w-1.5 h-1.5 rounded-full"
      style={[
        {
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
        animatedStyle,
      ]}
    />
  );
}

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
    opacity: 0.4 + progress.value * 0.5,
    transform: [{ scale: 1 + progress.value * 0.4 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full"
      style={[
        {
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: size,
          height: size,
          backgroundColor: 'rgba(255,255,255,0.6)',
        },
        animatedStyle,
      ]}
    />
  );
}

function ShareButton({
  label,
  variant,
  onPress,
}: {
  label: string;
  variant: 'zalo' | 'ink' | 'surface';
  onPress: () => void;
}) {
  const c = useAppColors();
  const bg = variant === 'zalo' ? '#0068FF' : variant === 'ink' ? c.ink : c.surface;
  const fg = variant === 'surface' ? c.ink : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={4}
      className="flex-1 items-center justify-center rounded-2xl py-3.5 active:opacity-90"
      style={
        variant === 'surface'
          ? {
              backgroundColor: bg,
              borderWidth: 1,
              borderColor: c.line,
            }
          : { backgroundColor: bg }
      }
    >
      <Text
        className="font-bodyBold text-[13px] text-center"
        style={{ color: fg }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
