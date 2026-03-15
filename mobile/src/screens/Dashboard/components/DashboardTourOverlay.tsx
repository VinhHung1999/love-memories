import React, { useEffect } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { Body, Caption, Label } from '../../../components/Typography';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SpringPressable from '../../../components/SpringPressable';
import type { SpotlightRect, TourStepDef } from '../useDashboardTour';
import { useAppColors } from '../../../navigation/theme';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

// Padding around the measured rect for the spotlight border
const SPOT_PAD = 8;

// ── Spotlight box ─────────────────────────────────────────────────────────────

function SpotlightBox({ rect }: { rect: SpotlightRect }) {
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withTiming(1, { duration: 280 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect.x, rect.y]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(232,120,138,${glowOpacity.value})`,
  }));

  return (
    <Animated.View
      style={[
        glowStyle,
        {
          position: 'absolute',
          left:   rect.x - SPOT_PAD,
          top:    rect.y - SPOT_PAD,
          width:  rect.width  + SPOT_PAD * 2,
          height: rect.height + SPOT_PAD * 2,
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
  step, total, title, body, rect, onNext, onSkip,
}: {
  step: number;
  total: number;
  title: string;
  body: string;
  rect: SpotlightRect;
  onNext: () => void;
  onSkip: () => void;
}) {
  const colors = useAppColors();
  const CARD_W = SCREEN_W - 48;
  const spotCenterX = rect.x + rect.width / 2;
  const spotBottom  = rect.y + rect.height + SPOT_PAD;
  const spotTop     = rect.y - SPOT_PAD;

  // Auto position above when spotlight is in lower half of screen
  const above = rect.y > SCREEN_H * 0.5;

  const left = Math.max(24, Math.min(spotCenterX - CARD_W / 2, SCREEN_W - CARD_W - 24));
  const top  = above ? spotTop - 140 : spotBottom + 16;

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: CARD_W,
        backgroundColor: colors.bgCard,
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 10,
      }}>
      <Caption className="text-primary mb-1" style={{ fontWeight: '600' }}>
        {step + 1} / {total}
      </Caption>

      <Label className="text-textDark dark:text-darkTextDark font-semibold mb-1" style={{ fontSize: 15 }}>
        {title}
      </Label>
      <Body size="sm" className="text-textMid dark:text-darkTextMid mb-4" style={{ lineHeight: 18 }}>
        {body}
      </Body>

      <View className="flex-row items-center justify-between">
        <Pressable onPress={onSkip}>
          <Caption className="text-textLight dark:text-darkTextLight">Skip tour</Caption>
        </Pressable>
        <SpringPressable
          onPress={onNext}
          className="px-5 h-9 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.primary }}>
          <Label className="font-semibold" style={{ color: colors.white, fontSize: 13 }}>
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
  steps: TourStepDef[];
  onAdvance: () => void;
  onDismiss: () => void;
}

export default function DashboardTourOverlay({ step, steps, onAdvance, onDismiss }: Props) {
  if (!steps[step]) return null;

  const current = steps[step];

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

      <SpotlightBox rect={current.rect} />

      <TooltipCard
        step={step}
        total={steps.length}
        title={current.title}
        body={current.body}
        rect={current.rect}
        onNext={step < steps.length - 1 ? onAdvance : onDismiss}
        onSkip={onDismiss}
      />
    </Animated.View>
  );
}
