import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LinearGradient } from '@/components';
import type { HeroPerson } from '@/screens/Dashboard/useDashboardViewModel';
import { useAppColors } from '@/theme/ThemeProvider';
import {
  type RelationshipTime,
  useRelationshipTime,
} from '@/hooks/useRelationshipTime';

// T415 (Sprint 64) — Dashboard cinematic Timer Hero.
// Ported 1:1 from docs/design/prototype/memoura-v2/dashboard.jsx L158-340
// (minimal variant = linked-avatar layout). Replaces the EmptyHero /
// LatestMomentCard branch on DashboardScreen.
//
// Gradient: heroA → heroB → heroC at ~155° (RN approximation via start/end).
// LIVE pulse dot + heart dot share a 1.8s Reanimated loop.
// Realtime tick: useRelationshipTime drives 1s re-render of the numeric faces
// (h:m:s + daysSinceAnniversary). Parent TimerHero re-renders each second
// which is cheap — no Reanimated worklet juggling for values that React can
// just... render.
//
// Dancing Script carve-out: prototype uses Dancing Script accents on the
// "· {timerLabel}" row and the "{days} ngày nữa là kỷ niệm ♥" footer. This
// contradicts the "Dancing Script is Letters-only" rule in mobile-rework/
// CLAUDE.md — but Boss rule #6 (prototype > memory rules) wins. Flagging in
// the sprint commit note so the CLAUDE.md rule can be updated post-review.

type Props = {
  you: HeroPerson;
  partner: HeroPerson | null;
  anniversary: Date | null;
  timerLabel: string;
  daysUnit: string;
  yearsUnit: string;
  monthsUnit: string;
  countdownLabel: (days: number) => string;
  // D5b: avatar URLs passed from DashboardScreen via vm.you/partner.avatarUrl
};

export function TimerHero({
  you,
  partner,
  anniversary,
  timerLabel,
  daysUnit,
  yearsUnit,
  monthsUnit,
  countdownLabel,
}: Props) {
  const c = useAppColors();
  const time = useRelationshipTime(anniversary);

  return (
    <View className="mx-5 mt-4 rounded-[28px] overflow-hidden shadow-hero">
      <LinearGradient
        colors={[c.heroA, c.heroB, c.heroC]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        className="absolute inset-0"
      />

      {/* Ambient lighting: top-left warm glow. D26 (Build 66): the
          bottom-right rgba(0,0,0,0.28) shadow-pool overlay was removed —
          Boss wanted the day count to sit directly on the hero gradient
          without a darkened scrim underneath. The warm glow on the top-
          left stays to preserve the soft "lit from above" feel. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.32)', 'transparent']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.6, y: 0.55 }}
        className="absolute inset-0"
      />

      {/* Giant heart watermark — SVG path, opacity 0.08, matches prototype
          L175-179: width/height 180, right:-30 top:-20, rotate -12deg.
          Using SVG Path so the fill is guaranteed #fff regardless of theme;
          Text glyph was picking up a dark red color on some palette configs. */}
      {/* position:'absolute' must be in the style object — react-native-svg's Svg
          is not a standard RN View so NativeWind className="absolute" is ignored.
          Without position:'absolute', the 180×180 SVG renders in normal flow and
          pushes the content View down = D7 excess space above the avatar row. */}
      <Svg
        width={220}
        height={220}
        viewBox="0 0 24 24"
        style={{ position: 'absolute', right: -30, top: -20, opacity: 0.22, transform: [{ rotate: '-12deg' }] }}
      >
        <Path
          d="M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11"
          fill="#fff"
        />
      </Svg>

      <View className="relative px-[22px] py-[22px]">
        {/* Top row: you avatar · dashed link · heart · dashed link · partner avatar · LIVE pill */}
        <View className="flex-row items-center">
          <AvatarTile
            initial={you.initial}
            avatarUrl={you.avatarUrl}
            gradient={[c.secondary, c.heroA]}
          />
          <DashedCurve direction="up" />
          <HeartDot color={c.primary} />
          <DashedCurve direction="down" />
          <AvatarTile
            initial={partner?.initial ?? '?'}
            avatarUrl={partner?.avatarUrl ?? null}
            gradient={[c.accent, c.primary]}
          />

          <View className="flex-1" />

          <LivePill />
        </View>

        {/* Names + Dancing Script timer label — D3 fix: no wrap, single baseline row */}
        <View className="mt-[18px] flex-row items-baseline">
          <Text
            className="font-displayMedium text-white text-[18px]"
            numberOfLines={1}
          >
            {formatNames(you.name, partner?.name ?? null)}
          </Text>
          <Text className="ml-2 font-scriptBold text-white/75 text-[16px]">
            · {timerLabel}
          </Text>
        </View>

        {/* Giant day count */}
        <View className="mt-[6px] flex-row items-baseline">
          <Text
            className="font-displayBoldItalic text-white text-[88px] leading-[90px]"
            style={{
              letterSpacing: 0,
              textShadowColor: 'rgba(0,0,0,0.25)',
              textShadowRadius: 30,
              textShadowOffset: { width: 0, height: 6 },
            }}
          >
            {time.totalDays.toLocaleString()}
          </Text>
          <Text className="ml-2 pb-[6px] font-bodyBold text-white text-[18px]">
            {daysUnit}
          </Text>
        </View>

        {/* Y / M / D breakdown strip — D13: mt-[14px]→[6px], tight under 88pt */}
        <View className="mt-[6px] flex-row gap-2">
          <BreakdownCell n={time.y} label={yearsUnit} />
          <BreakdownCell n={time.m} label={monthsUnit} />
          <BreakdownCell n={time.d} label={daysUnit} />
        </View>

        {/* Footer: HH:MM:SS clock + countdown to anniversary */}
        <View className="mt-[14px] flex-row items-center justify-between">
          <ClockTicker time={time} />
          <Text
            className="font-scriptBold text-white/90 text-[17px]"
            numberOfLines={1}
          >
            {countdownLabel(time.daysToAnniv)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Avatar tile — 56×56 gradient square with glossy top-left highlight + letter.
// ────────────────────────────────────────────────────────────────────────

function AvatarTile({
  initial,
  avatarUrl,
  gradient,
}: {
  initial: string;
  avatarUrl: string | null;
  gradient: [string, string];
}) {
  return (
    <View
      className="w-[56px] h-[56px] rounded-[18px] overflow-hidden items-center justify-center shadow-hero"
      style={{ borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)' }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      ) : (
        <>
          <LinearGradient
            colors={['rgba(255,255,255,0.55)', 'transparent']}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.8, y: 0.7 }}
            className="absolute inset-0"
          />
          <Text className="relative font-displayBold text-white text-[26px]">
            {initial}
          </Text>
        </>
      )}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Dashed curve between the avatar tiles — 28×20 SVG, up or down bezier.
// ────────────────────────────────────────────────────────────────────────

function DashedCurve({ direction }: { direction: 'up' | 'down' }) {
  const d = direction === 'up' ? 'M2 10 Q 14 2, 26 10' : 'M2 10 Q 14 18, 26 10';
  return (
    <View className="px-[2px]">
      <Svg width={28} height={20} viewBox="0 0 28 20">
        <Path
          d={d}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          strokeDasharray="2 3"
        />
      </Svg>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Heart dot — white pill with heart glyph, Reanimated beat loop.
// ────────────────────────────────────────────────────────────────────────

function HeartDot({ color }: { color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    // D9: double-pulse heartbeat matching prototype memoHeartBeat keyframes:
    //   0% → 15% → 30% → 45% → 60% → rest (1800ms total)
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 270, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 270, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.1,  { duration: 270, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 270, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 720 }),  // rest to fill 1800ms
      ),
      -1,
      false,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    // D9: outer white ring — 4px rgba(255,255,255,0.2) per prototype L211
    <View className="rounded-full items-center justify-center" style={{ width: 46, height: 46, backgroundColor: 'rgba(255,255,255,0.2)' }}>
      <Animated.View
        style={animatedStyle}
        className="w-[38px] h-[38px] rounded-full items-center justify-center bg-white/95 shadow-hero"
      >
        <Text
          className="font-displayBold text-[18px]"
          style={{ color, lineHeight: 24 }}  // D9: lineHeight 20→24 clears ascender clip
        >
          ♥
        </Text>
      </Animated.View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// LIVE pill — frost-tinted chip with a pulsing dot.
// ────────────────────────────────────────────────────────────────────────

function LivePill() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      className="flex-row items-center gap-[5px] px-[9px] py-[5px] rounded-full"
      style={{
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
      }}
    >
      <Animated.View
        style={dotStyle}
        className="w-[6px] h-[6px] rounded-full bg-white"
      />
      <Text className="font-bodyBold text-white text-[9px]">LIVE</Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Breakdown cell — Y / M / D chip.
// ────────────────────────────────────────────────────────────────────────

function BreakdownCell({ n, label }: { n: number; label: string }) {
  return (
    <View
      className="flex-1 px-3 py-[10px] rounded-[14px]"
      style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
      }}
    >
      <Text className="font-displayMedium text-white text-[22px] leading-[22px]">
        {n}
      </Text>
      <Text className="mt-[3px] font-bodySemibold text-white/75 text-[10px] uppercase">
        {label}
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Clock ticker — HH:MM faded + :SS emphasized.
// ────────────────────────────────────────────────────────────────────────

function ClockTicker({ time }: { time: RelationshipTime }) {
  return (
    <View className="flex-row items-baseline">
      <Text className="font-bodySemibold text-white/60 text-[11px]">
        {pad2(time.h)}:{pad2(time.min)}
      </Text>
      <Text className="font-bodyBold text-white text-[11px]">
        :{pad2(time.s)}
      </Text>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatNames(you: string, partner: string | null): string {
  const left = (you || '·').trim();
  if (!partner) return left;
  return `${left} & ${partner.trim() || '·'}`;
}
