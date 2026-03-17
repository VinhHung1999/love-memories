import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Body, Caption, Label } from '../../../components/Typography';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  /** True if the user already answered today's question */
  answeredToday: boolean;
  onPress: () => void;
}

function getMilestoneKey(streak: number): string | null {
  if (streak >= 100) return 'milestone100';
  if (streak >= 30) return 'milestone30';
  if (streak >= 7) return 'milestone7';
  return null;
}

function getState1Copy(streak: number, t: (k: string, opts?: Record<string, unknown>) => string): string {
  if (streak === 0) return t('dashboard.streak.motivateZero');
  if (streak < 7) return t('dashboard.streak.motivateLow');
  return t('dashboard.streak.motivateKeep', { n: streak });
}

export function StreakWidget({ currentStreak, longestStreak, answeredToday, onPress }: StreakWidgetProps) {
  const colors = useAppColors();
  const { t } = useTranslation();

  // ── Animation values ─────────────────────────────────────────────────────

  // Flame: dim+small in State 1, full+breathing in State 2
  const flameScale   = useSharedValue(answeredToday ? 1 : 0.5);
  const flameOpacity = useSharedValue(answeredToday ? 1 : 0.4);

  // State 2 content layers
  const s2Opacity      = useSharedValue(answeredToday ? 1 : 0);
  const pillScale      = useSharedValue(answeredToday ? 1 : 0);
  const pillOpacity    = useSharedValue(answeredToday ? 1 : 0);
  const bottomOffset   = useSharedValue(answeredToday ? 0 : 12);
  const bottomOpacity  = useSharedValue(answeredToday ? 1 : 0);

  // Count-up display number
  const [displayCount, setDisplayCount] = useState(answeredToday ? currentStreak : 0);

  // Track previous answeredToday to detect false→true transition
  const prevAnswered = useRef(answeredToday);
  const breathingStarted = useRef(answeredToday);

  // ── Start breathing animation (infinite flame pulse) ─────────────────────
  const startBreathing = () => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  };

  // ── Mount: if already answered, start breathing immediately ──────────────
  useEffect(() => {
    if (answeredToday && !breathingStarted.current) {
      startBreathing();
      breathingStarted.current = true;
    }
    if (answeredToday && breathingStarted.current && !prevAnswered.current) {
      // fresh transition handled below
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Detect false → true transition ───────────────────────────────────────
  useEffect(() => {
    if (answeredToday && !prevAnswered.current) {
      // Phase 2: flame ignition (200ms)
      flameOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      flameScale.value   = withDelay(200, withSpring(1.0, { mass: 0.8, stiffness: 200, damping: 12 }, () => {
        // After entrance settles, start breathing
        startBreathing();
        breathingStarted.current = true;
      }));

      // Phase 3: number count-up (350ms)
      const target = currentStreak;
      const step   = target > 30 ? 3 : 1;
      let count = 0;
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          count = Math.min(count + step, target);
          setDisplayCount(count);
          if (count >= target) clearInterval(interval);
        }, 20);
      }, 350);

      // Phase 5: "Done today" pill (500ms)
      pillScale.value   = withDelay(500, withSpring(1.0, { mass: 0.5, stiffness: 250, damping: 16 }));
      pillOpacity.value = withDelay(500, withTiming(1, { duration: 150 }));

      // Phase 1: state 2 content fades in (100ms)
      s2Opacity.value = withDelay(100, withTiming(1, { duration: 280 }));

      // Phase 4: bottom row (600ms)
      bottomOffset.value  = withDelay(600, withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }));
      bottomOpacity.value = withDelay(600, withTiming(1, { duration: 200 }));

      return () => clearTimeout(timer);
    }
    prevAnswered.current = answeredToday;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredToday]);

  // ── Animated styles ───────────────────────────────────────────────────────
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
    opacity: flameOpacity.value,
  }));
  const s2Style        = useAnimatedStyle(() => ({ opacity: s2Opacity.value }));
  const pillStyle      = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
    opacity: pillOpacity.value,
  }));
  const bottomRowStyle = useAnimatedStyle(() => ({
    opacity: bottomOpacity.value,
    transform: [{ translateY: bottomOffset.value }],
  }));

  const milestoneKey = getMilestoneKey(currentStreak);

  // ── STATE 1: Not yet answered ─────────────────────────────────────────────
  if (!answeredToday) {
    return (
      <Pressable onPress={onPress}>
        <View
          className="rounded-2xl flex-row items-center gap-3"
          style={{
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: 'rgba(232,120,138,0.18)',
            paddingHorizontal: 16,
            paddingVertical: 14,
            minHeight: 80,
          }}
        >
          {/* Dim flame icon */}
          <Animated.View
            className="items-center justify-center"
            style={[
              flameStyle,
              {
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#FFE4EA',
              },
            ]}
          >
            <Body size="md">🔥</Body>
          </Animated.View>

          {/* Copy */}
          <View className="flex-1">
            <Label className="font-medium" style={{ color: colors.textDark, fontSize: 14 }}>
              {getState1Copy(currentStreak, t)}
            </Label>
            <Caption className="mt-0.5" style={{ color: colors.textLight }}>
              {t('dashboard.streak.daysInARow', { n: currentStreak > 0 ? currentStreak : '' }).trim() ||
                'Answer today\'s question together'}
            </Caption>
          </View>

          {/* "Answer" pill */}
          <View
            className="rounded-full items-center justify-center"
            style={{
              backgroundColor: '#FFE4EA',
              paddingHorizontal: 12,
              height: 30,
            }}
          >
            <Caption className="font-semibold" style={{ color: colors.primary }}>
              {t('dashboard.streak.answerBtn')}
            </Caption>
          </View>
        </View>
      </Pressable>
    );
  }

  // ── STATE 2: Already answered today ───────────────────────────────────────
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#FFF0F6', '#FFF5EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, borderWidth: 1, borderColor: '#F2A5B0' }}
      >
        <Animated.View style={[s2Style, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }]}>
          {/* Top row */}
          <View className="flex-row items-center gap-3">
            {/* Flame */}
            <Animated.View style={flameStyle}>
              <Body size="lg">🔥</Body>
            </Animated.View>

            {/* Streak number + days */}
            <View className="flex-row items-baseline gap-1.5 flex-1">
              <Label
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: colors.textDark,
                  lineHeight: 32,
                }}
              >
                {String(displayCount)}
              </Label>
              <Caption style={{ color: colors.textMid, fontSize: 13 }}>
                {t('dashboard.streak.days')}
              </Caption>
            </View>

            {/* "Done today" teal pill */}
            <Animated.View
              className="flex-row items-center gap-1 rounded-full"
              style={[
                pillStyle,
                {
                  backgroundColor: colors.accent,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                },
              ]}
            >
              <Caption className="font-medium" style={{ color: '#FFFFFF', fontSize: 11 }}>
                ✓ {t('dashboard.streak.donePill')}
              </Caption>
            </Animated.View>
          </View>

          {/* Milestone banner */}
          {milestoneKey ? (
            <Animated.View style={bottomRowStyle} className="mt-2">
              <Caption style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                {t(`dashboard.streak.${milestoneKey}`)}
              </Caption>
            </Animated.View>
          ) : null}

          {/* Bottom row: best streak */}
          {!milestoneKey && longestStreak > 0 ? (
            <Animated.View style={[bottomRowStyle, { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }]}>
              <Caption style={{ color: colors.textLight }}>
                {t('dashboard.streak.longestStreak', { n: longestStreak })}
              </Caption>
            </Animated.View>
          ) : null}
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
}
