import React, { useEffect } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { Body, Caption, Label } from '../../../components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SpringPressable from '../../../components/SpringPressable';

// ── Tour step definitions ──────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

// Tab icon width ≈ screen / 5 (5 tabs)
const TAB_W = SCREEN_W / 5;
const TAB_H = 60;

interface StepDef {
  title: string;
  body: string;
  // Center of the spotlight
  cx: () => number;
  cy: (bottomInset: number) => number;
  spotW: number;
  spotH: number;
  tooltipAbove: boolean; // tooltip above or below spotlight
}

const STEPS: StepDef[] = [
  {
    title: 'Our Moments',
    body: 'Capture your memories — photos, places, feelings',
    cx: () => TAB_W * 1.5,
    cy: (inset) => SCREEN_H - inset - TAB_H / 2,
    spotW: TAB_W - 8,
    spotH: TAB_H - 8,
    tooltipAbove: true,
  },
  {
    title: 'Daily Q&A',
    body: 'A question a day builds your story together',
    cx: () => TAB_W * 2.5,
    cy: (inset) => SCREEN_H - inset - TAB_H / 2,
    spotW: TAB_W - 8,
    spotH: TAB_H - 8,
    tooltipAbove: true,
  },
  {
    title: 'Love Letters',
    body: 'Write letters that arrive in the future',
    cx: () => TAB_W * 3.5,
    cy: (inset) => SCREEN_H - inset - TAB_H / 2,
    spotW: TAB_W - 8,
    spotH: TAB_H - 8,
    tooltipAbove: true,
  },
  {
    title: 'Your Heartbeat',
    body: 'Your heartbeat counter — every day counts',
    cx: () => SCREEN_W / 2,
    cy: () => SCREEN_H * 0.48,
    spotW: SCREEN_W - 48,
    spotH: 110,
    tooltipAbove: false,
  },
];

// ── Spotlight box ─────────────────────────────────────────────────────────────

function SpotlightBox({
  cx, cy, w, h,
}: {
  cx: number; cy: number; w: number; h: number;
}) {
  const glowOpacity = useSharedValue(0.6);

  useEffect(() => {
    glowOpacity.value = withTiming(1, { duration: 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cx, cy]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(232,120,138,${glowOpacity.value})`,
  }));

  return (
    <Animated.View
      style={[
        glowStyle,
        {
          position: 'absolute',
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          borderRadius: 14,
          borderWidth: 2.5,
          shadowColor: '#E8788A',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
        },
      ]}
    />
  );
}

// ── Tooltip card ──────────────────────────────────────────────────────────────

function TooltipCard({
  title, body, step, total, onNext, onSkip, above, cx, cy, spotH,
}: {
  title: string;
  body: string;
  step: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  above: boolean;
  cx: number;
  cy: number;
  spotH: number;
}) {
  const CARD_W = SCREEN_W - 48;
  const left = Math.max(24, Math.min(cx - CARD_W / 2, SCREEN_W - CARD_W - 24));
  const top = above
    ? cy - spotH / 2 - 130  // above spotlight
    : cy + spotH / 2 + 16;  // below spotlight

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: CARD_W,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
      }}>
      {/* Step count */}
      <Caption className="text-primary mb-1" style={{ fontWeight: '600' }}>
        {step + 1} / {total}
      </Caption>

      <Label className="text-textDark font-semibold mb-1" style={{ fontSize: 15 }}>
        {title}
      </Label>
      <Body size="sm" className="text-textMid mb-4" style={{ lineHeight: 18 }}>
        {body}
      </Body>

      <View className="flex-row items-center justify-between">
        <Pressable onPress={onSkip}>
          <Caption className="text-textLight">Skip tour</Caption>
        </Pressable>
        <SpringPressable
          onPress={onNext}
          className="px-5 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: '#E8788A' }}>
          <Label className="font-semibold" style={{ color: '#fff', fontSize: 13 }}>
            {step < total - 1 ? 'Next →' : 'Got it!'}
          </Label>
        </SpringPressable>
      </View>
    </View>
  );
}

// ── Main Overlay ──────────────────────────────────────────────────────────────

interface Props {
  step: number;
  onAdvance: () => void;
  onDismiss: () => void;
}

export default function DashboardTourOverlay({ step, onAdvance, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const def = STEPS[step];
  const cx = def.cx();
  const cy = def.cy(insets.bottom);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.60)',
        zIndex: 200,
      }}>
      {/* Tap backdrop to dismiss */}
      <Pressable style={{ flex: 1 }} onPress={onDismiss} />

      {/* Spotlight highlight */}
      <SpotlightBox cx={cx} cy={cy} w={def.spotW} h={def.spotH} />

      {/* Tooltip card */}
      <TooltipCard
        title={def.title}
        body={def.body}
        step={step}
        total={STEPS.length}
        onNext={step < STEPS.length - 1 ? onAdvance : onDismiss}
        onSkip={onDismiss}
        above={def.tooltipAbove}
        cx={cx}
        cy={cy}
        spotH={def.spotH}
      />
    </Animated.View>
  );
}
