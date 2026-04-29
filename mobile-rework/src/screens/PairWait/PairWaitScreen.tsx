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
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
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
  const {
    inviteCode,
    slogan,
    copied,
    regenerating,
    onCopyCode,
    onBackPress,
    onRegenerate,
  } = usePairWaitViewModel();

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
        {/* Glassmorphism top bar — back-circle now opens a destructive
            sign-out Alert (PW-2) so the creator can bail out of an
            accidental couple commit; status pill stays "đang chờ ghép". */}
        <View className="px-6 h-14 flex-row items-center justify-between">
          <Pressable
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.pairWait.signOutA11y')}
            hitSlop={8}
            className="w-9 h-9 rounded-full items-center justify-center active:opacity-80"
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
          </Pressable>
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

          {/* PW-7 (Boss build 135 directive 2026-04-29) — "đang chờ"
              card with three-ring radar pulse. Tells the creator the
              poll is live without leaving them staring at the postcard.
              Radar animates with Reanimated v4 — 3 concentric rings
              cycling 0.5 → 1.5 scale + 0.5 → 0 opacity, staggered
              0/0.6/1.2s so they ripple outward. */}
          <WaitingRadarCard partnerLabel={t('onboarding.pairWait.partnerFallback')} />

          {/* Postcard invitation card — back layer for paper-stack feel,
              main card with code + expires pill, stamp overhanging the
              top-right corner so it reads as a sticker pinned onto the
              postcard rather than baked into the body. */}
          <View className="px-6 mt-5">
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
              {/* Stamp — sits OUTSIDE the overflow-hidden main card so the
                  rotated rectangle can overhang the rounded corner. PW-3
                  bumped from 56×64 inside-the-body → 72×84 overhanging. */}
              <View
                pointerEvents="none"
                className="absolute items-center justify-center rounded-md overflow-hidden z-10"
                style={{
                  top: -8,
                  right: -8,
                  width: 72,
                  height: 84,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.6)',
                  borderStyle: 'dashed',
                  transform: [{ rotate: '8deg' }],
                  shadowColor: '#000000',
                  shadowOpacity: 0.18,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={[c.primary, c.primaryDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0"
                />
                <Text className="text-white text-[24px] leading-[26px]">♥</Text>
                <Text
                  className="font-bodyBold text-white text-[10px] uppercase mt-0.5"
                  style={{ letterSpacing: 0.8 }}
                >
                  memoura
                </Text>
                <Text
                  className="font-bodyBold text-white/85 text-[9px] uppercase"
                  style={{ letterSpacing: 0.54 }}
                >
                  2026
                </Text>
              </View>
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

                {/* Body — code label + code slots + expires pill. Stamp
                    moved out to the wrapper level (PW-3) so it can overhang
                    the rounded corner without being clipped. */}
                <View className="px-6 pt-6 pb-5 items-center">
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

                {/* PW-8 (Boss build 135 directive 2026-04-29) — perforated
                    divider with bg-coloured circle cutouts on both edges
                    that fake the ticket-stub aesthetic, followed by a real
                    QR code (deep-link URL) + scan hint. Two affordances
                    sharing one postcard: nominal code copy/share above,
                    in-person QR pair below. */}
                <PerforatedDivider bgColor={c.bg} lineColor={c.line} />

                <View
                  className="px-5 pb-5 pt-1 flex-row items-center"
                  style={{ gap: 16 }}
                >
                  <View
                    className="rounded-xl bg-white p-2"
                    style={{
                      borderWidth: 1,
                      borderColor: c.line,
                    }}
                  >
                    {inviteUrl ? (
                      <QRCode
                        value={`https://${inviteUrl}`}
                        size={80}
                        color={c.ink}
                        backgroundColor="#FFFFFF"
                        quietZone={4}
                        ecl="M"
                      />
                    ) : (
                      <View style={{ width: 80, height: 80 }} />
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-script text-[18px] leading-[18px] text-ink-mute">
                      {t('onboarding.pairWait.qrAltOr')}
                    </Text>
                    <Text
                      className="mt-1 font-displayItalic text-ink text-[18px] leading-[21px]"
                      style={{ letterSpacing: -0.015 * 18 }}
                    >
                      {t('onboarding.pairWait.qrTitle')}
                    </Text>
                    <Text
                      className="mt-1.5 font-body text-[11px] leading-[15px]"
                      style={{ color: c.inkMute }}
                    >
                      {t('onboarding.pairWait.qrHint')}
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

          {/* PW-4: single full-width Share CTA + tiny copy chip strip below.
              The 3-button row drowned the primary action — Boss build 135
              feedback. Share opens the system share sheet (RN.Share); the
              chip below copies the deep-link URL with a check-mark toggle. */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={onShareInvite}
              accessibilityRole="button"
              hitSlop={4}
              className="rounded-full flex-row items-center justify-center py-4 active:opacity-90"
              style={{
                backgroundColor: c.ink,
                shadowColor: c.ink,
                shadowOpacity: 0.33,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 12 },
                elevation: 6,
                gap: 10,
              }}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 4v12M7 9l5-5 5 5M5 18v2a1 1 0 001 1h12a1 1 0 001-1v-2"
                  stroke={c.bg}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text className="font-bodyBold text-[14px]" style={{ color: c.bg }}>
                {t('onboarding.pairWait.shareInvite')}
              </Text>
            </Pressable>

            <Pressable
              onPress={onCopyCode}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.pairWait.copyLink')}
              hitSlop={4}
              className="mt-2.5 flex-row items-center rounded-full px-3.5 py-2.5 active:opacity-80"
              style={{
                backgroundColor: c.surface,
                borderWidth: 1,
                borderColor: c.line,
                gap: 10,
              }}
            >
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66L12 6.34M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66L12 17.66"
                  stroke={c.inkMute}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                className="flex-1 font-body text-[11.5px]"
                style={{ color: c.inkSoft }}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {inviteUrl || t('onboarding.pairWait.copyLink')}
              </Text>
              <Text
                className="font-bodyBold text-[11px]"
                style={{ color: copied ? c.accent : c.inkMute }}
              >
                {copied
                  ? `✓ ${t('onboarding.pairWait.copied')}`
                  : `⧉ ${t('onboarding.pairWait.copyLink')}`}
              </Text>
            </Pressable>

            {/* PW-9: regenerate code — ghost link below the copy chip.
                Confirm Alert in the VM warns the old code dies on
                regenerate so a partner mid-typing the previous code
                doesn't get a confusing 400. */}
            <Pressable
              onPress={onRegenerate}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.pairWait.regenCta')}
              hitSlop={6}
              disabled={regenerating}
              className="mt-3 items-center active:opacity-70"
              style={{ opacity: regenerating ? 0.6 : 1 }}
            >
              <Text
                className="font-bodyMedium text-[12px] underline"
                style={{ color: c.inkMute }}
              >
                {regenerating
                  ? t('onboarding.pairWait.regenLoading')
                  : t('onboarding.pairWait.regenCta')}
              </Text>
            </Pressable>
          </View>

          {/* PW-5: "Khi người ta vào, hai đứa có" benefits card.
              Surface card with display-italic header + 4 dashed-divided
              rows (moments / letters / dailyq / recap) — each row carries
              a tinted icon disc + bold title + soft-ink body. Reassures
              the creator while they wait that the pair-up unlocks
              real things (matches prototype L480-565). */}
          <BenefitsCard partnerLabel={t('onboarding.pairWait.partnerFallback')} />

          {/* PW-6: privacy footnote — lock icon + body. */}
          <View
            className="mt-3 px-6 pb-2 flex-row items-center justify-center"
            style={{ gap: 8 }}
          >
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 11V8a7 7 0 0114 0v3"
                stroke={c.inkMute}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <Rect x={4} y={11} width={16} height={9} rx={2} stroke={c.inkMute} strokeWidth={1.8} />
            </Svg>
            <Text className="font-body text-[11.5px] text-ink-mute">
              {t('onboarding.pairWait.privacyFootnote')}
            </Text>
          </View>

          <Text className="mt-3 px-6 pb-10 text-center font-body text-[13px] text-ink-soft leading-[18px]">
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

// PW-7 (Boss build 135 directive 2026-04-29) — "đang chờ" radar card.
// Soft gradient pill with three concentric ring borders cycling outward
// (Reanimated v4 stagger). Right-side pulsing dot + uppercase status +
// display-italic copy + body soft tells the creator the loop is alive.
function WaitingRadarCard({ partnerLabel }: { partnerLabel: string }) {
  const { t } = useTranslation();
  const c = useAppColors();
  return (
    <View
      className="mx-6 mt-6 rounded-[22px] flex-row items-center px-4 py-4 overflow-hidden"
      style={{
        borderWidth: 1,
        borderColor: c.line,
        gap: 14,
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
      <View className="w-14 h-14 items-center justify-center">
        <RadarRing color={c.primary} delay={0} />
        <RadarRing color={c.primary} delay={800} />
        <RadarRing color={c.primary} delay={1600} />
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{
            backgroundColor: c.surface,
            borderWidth: 2,
            borderColor: c.primary,
            borderStyle: 'dashed',
          }}
        >
          <Text className="font-bodyBold text-[18px]" style={{ color: c.primary }}>
            ?
          </Text>
        </View>
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <PulseDot color={c.primary} />
          <Text
            className="font-bodyBold text-[11px] uppercase"
            style={{ color: c.primaryDeep, letterSpacing: 1.1 }}
          >
            {t('onboarding.pairWait.waitingFor', { partner: partnerLabel })}
          </Text>
        </View>
        <Text
          className="mt-1.5 font-displayItalic text-ink text-[16px] leading-[19px]"
          style={{ letterSpacing: -0.01 * 16 }}
        >
          {t('onboarding.pairWait.waitingHeadline')}
        </Text>
        <Text
          className="mt-1 font-body text-[12px] leading-[17px]"
          style={{ color: c.inkSoft }}
        >
          {t('onboarding.pairWait.waitingBody', { partner: partnerLabel })}
        </Text>
      </View>
    </View>
  );
}

function RadarRing({ color, delay }: { color: string; delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 - progress.value * 0.5,
    transform: [{ scale: 0.5 + progress.value * 1 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full"
      style={[
        {
          width: 56,
          height: 56,
          borderWidth: 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// PW-8 (Boss build 135 directive 2026-04-29) — perforated divider with
// bg-coloured circle cutouts on both edges. Sells the ticket-stub
// aesthetic: the dashed line PLUS the cutouts = "tear here". Without
// the circles a plain dashed line feels like underline, not perforation.
function PerforatedDivider({
  bgColor,
  lineColor,
}: {
  bgColor: string;
  lineColor: string;
}) {
  return (
    <View className="relative" style={{ height: 18 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: '50%',
          borderTopWidth: 1.5,
          borderTopColor: lineColor,
          borderStyle: 'dashed',
          transform: [{ translateY: -0.75 }],
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          left: -10,
          top: '50%',
          width: 20,
          height: 20,
          backgroundColor: bgColor,
          transform: [{ translateY: -10 }],
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          right: -10,
          top: '50%',
          width: 20,
          height: 20,
          backgroundColor: bgColor,
          transform: [{ translateY: -10 }],
        }}
      />
    </View>
  );
}

// PW-5 (Boss build 135 directive 2026-04-29) — "Khi người ta vào, hai
// đứa có" benefits card. Surface card with display-italic header and 4
// dashed-divided rows pairing a tinted icon disc with title + body so
// the creator has something concrete to read while polling.
function BenefitsCard({ partnerLabel }: { partnerLabel: string }) {
  const { t } = useTranslation();
  const c = useAppColors();
  const benefits = [
    {
      key: 'moments' as const,
      tint: c.primary,
      soft: c.primarySoft,
      Icon: BenefitIconCamera,
    },
    {
      key: 'letters' as const,
      tint: c.accent,
      soft: c.accentSoft,
      Icon: BenefitIconEnvelope,
    },
    {
      key: 'dailyq' as const,
      tint: c.secondary,
      soft: c.secondarySoft,
      Icon: BenefitIconQuestion,
    },
    {
      key: 'recap' as const,
      tint: c.primaryDeep,
      soft: c.primarySoft,
      Icon: BenefitIconScrapbook,
    },
  ] as const;
  return (
    <View
      className="mx-6 mt-6 rounded-[22px] px-4 py-4"
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <Text
        className="font-displayItalic text-ink text-[20px] leading-[22px]"
        style={{ letterSpacing: -0.02 * 20 }}
      >
        {t('onboarding.pairWait.benefitsTitle', { partner: partnerLabel })}
      </Text>
      {benefits.map((b, i) => (
        <View
          key={b.key}
          className="flex-row items-start mt-3.5"
          style={{ gap: 12 }}
        >
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: b.soft }}
          >
            <b.Icon color={b.tint} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="font-bodyBold text-ink text-[13.5px] leading-[16px]">
              {t(`onboarding.pairWait.benefits.${b.key}.title`)}
            </Text>
            <Text
              className="mt-1 font-body text-[12px] leading-[17px]"
              style={{ color: c.inkSoft }}
            >
              {t(`onboarding.pairWait.benefits.${b.key}.body`)}
            </Text>
          </View>
          {i < benefits.length - 1 ? null : null}
        </View>
      ))}
    </View>
  );
}

function BenefitIconCamera({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2.5} stroke={color} strokeWidth={2} />
      <Circle cx={9} cy={11} r={1.6} fill={color} />
      <Path
        d="M3 17l5-4 4 3 3-2 6 5"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BenefitIconEnvelope({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7l8 6 8-6M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7l2-2h12l2 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BenefitIconQuestion({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BenefitIconScrapbook({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M8 12h8M8 16h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
