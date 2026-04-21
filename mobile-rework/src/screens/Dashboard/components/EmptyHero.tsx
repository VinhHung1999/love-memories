import { Camera, Plus } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

// T375 — Dashboard empty state. Polaroid stack hero (3 tilted frames, the top
// one carries a pulsing heart) + headline + 2-CTA pair.
// T381 (Sprint 62) — CTAs split by intent: primary "Thêm khoảnh khắc đầu tiên"
// pushes moment-create directly (skip sheet — user signaled intent), secondary
// "Mở camera" opens the Camera BottomSheet for camera/library/photobooth
// choice. Boss rule 2026-04-21 via Telegram. Prototype ref: empty-states.jsx
// `EmptyHomeBody`.

type Props = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  polaroidCaption: string;
  onAddMoment: () => void;
  onOpenCamera: () => void;
};

export function EmptyHero({
  title,
  subtitle,
  primaryLabel,
  secondaryLabel,
  polaroidCaption,
  onAddMoment,
  onOpenCamera,
}: Props) {
  const c = useAppColors();

  return (
    <View className="mx-5 mt-4">
      {/* Hero card — gradient bg with polaroid stack + copy */}
      <View className="rounded-3xl overflow-hidden min-h-[340px] shadow-hero">
        <LinearGradient
          colors={[c.heroA, c.heroB, c.heroC]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          className="absolute inset-0"
        />

        <View className="px-5 pt-8 pb-7 items-center">
          <PolaroidStack caption={polaroidCaption} />

          <Text className="mt-6 font-displayMedium text-white text-[26px] leading-[32px] text-center max-w-[260px]">
            {title}
          </Text>
          <Text className="mt-3 font-body text-white/85 text-[13px] leading-[20px] text-center max-w-[280px]">
            {subtitle}
          </Text>
        </View>
      </View>

      {/* CTA pair (T381) — Primary: direct push to moment-create (skip sheet
          when user signaled clear intent). Secondary: open Camera sheet for
          source choice. */}
      <View className="flex-row gap-2.5 mt-3.5">
        <Pressable
          onPress={onAddMoment}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          className="flex-1 flex-row items-center justify-center h-12 rounded-2xl bg-primary shadow-pill active:bg-primary-deep"
        >
          <Plus size={16} strokeWidth={2.5} color="#ffffff" />
          <Text className="font-bodySemibold text-white text-[14px] ml-2">
            {primaryLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenCamera}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          className="flex-1 flex-row items-center justify-center h-12 rounded-2xl bg-surface border border-line-on-surface active:opacity-80"
        >
          <Camera size={16} strokeWidth={2} color={c.ink} />
          <Text className="font-bodySemibold text-ink text-[14px] ml-2">
            {secondaryLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Polaroid stack — 3 tilted frames (-10° / +6° / -2°), top one carries a
// pulsing heart + first-moment caption. Reanimated shared value drives the
// loop; the frame scale is on Animated.View transform (className can't
// express arbitrary scale values reactively, one of the allowed carve-outs).
// ──────────────────────────────────────────────────────────────────────

function PolaroidStack({ caption }: { caption: string }) {
  return (
    <View className="relative w-[180px] h-[210px]">
      <PolaroidFrame x={-24} y={6} rotate={-10} variant="stripe" />
      <PolaroidFrame x={10} y={-4} rotate={6} variant="accent" />
      <PolaroidFrame x={-4} y={10} rotate={-2} variant="heart" caption={caption} />
    </View>
  );
}

type PolaroidFrameProps = {
  x: number;
  y: number;
  rotate: number;
  variant: 'stripe' | 'accent' | 'heart';
  caption?: string;
};

function PolaroidFrame({ x, y, rotate, variant, caption }: PolaroidFrameProps) {
  const transformClass = polaroidTransform(x, y, rotate);
  const fillClass =
    variant === 'stripe'
      ? 'bg-surface-alt'
      : variant === 'accent'
        ? 'bg-accent-soft'
        : 'bg-primary-soft';

  return (
    <View
      className={`absolute top-0 left-1/2 w-[140px] h-[170px] -ml-[70px] bg-white rounded-md p-2 ${transformClass}`}
    >
      <View
        className={`flex-1 rounded-sm items-center justify-center ${fillClass}`}
      >
        {variant === 'heart' ? <HeartPulse /> : null}
      </View>
      <Text
        numberOfLines={1}
        className="h-[18px] mt-1.5 font-displayItalic text-ink-mute text-[12px] text-center"
      >
        {variant === 'heart' ? caption : ''}
      </Text>
    </View>
  );
}

function HeartPulse() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text className="text-primary text-[38px] leading-[42px]">♡</Text>
    </Animated.View>
  );
}

// Arbitrary-degree rotation + pixel translation aren't in Tailwind's default
// rotate scale. NativeWind v4 supports arbitrary values via `rotate-[Ndeg]`
// and `translate-{x,y}-[Npx]`, but the JIT needs literal class strings at
// build time — so we enumerate the exact triplets we use. Adding a new tilt
// = extending this switch.
function polaroidTransform(x: number, y: number, rotate: number): string {
  if (x === -24 && y === 6 && rotate === -10)
    return 'translate-x-[-24px] translate-y-[6px] rotate-[-10deg]';
  if (x === 10 && y === -4 && rotate === 6)
    return 'translate-x-[10px] translate-y-[-4px] rotate-[6deg]';
  if (x === -4 && y === 10 && rotate === -2)
    return 'translate-x-[-4px] translate-y-[10px] rotate-[-2deg]';
  return '';
}
