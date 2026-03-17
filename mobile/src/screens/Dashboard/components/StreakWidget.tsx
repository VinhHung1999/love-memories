import React, { useEffect, useRef } from 'react';
import { Pressable, View, Animated as RNAnimated } from 'react-native';
import { Body, Caption, Heading } from '../../../components/Typography';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  onPress: () => void;
}

const MILESTONES = [7, 30, 100] as const;

function getMilestoneKey(streak: number): string | null {
  if (streak >= 100) return 'milestone100';
  if (streak >= 30) return 'milestone30';
  if (streak >= 7) return 'milestone7';
  return null;
}

export function StreakWidget({ currentStreak, longestStreak, onPress }: StreakWidgetProps) {
  const colors = useAppColors();
  const { t } = useTranslation();
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  // Pulse animation on milestone
  const isMilestone = MILESTONES.includes(currentStreak as (typeof MILESTONES)[number]);
  useEffect(() => {
    if (!isMilestone) return;
    const pulse = RNAnimated.sequence([
      RNAnimated.timing(scaleAnim, { toValue: 1.06, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      RNAnimated.timing(scaleAnim, { toValue: 1.04, duration: 200, useNativeDriver: true }),
      RNAnimated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [currentStreak, isMilestone, scaleAnim]);

  const milestoneKey = getMilestoneKey(currentStreak);

  if (currentStreak === 0) {
    // Motivational empty state
    return (
      <Pressable onPress={onPress}>
        <View
          className="rounded-2xl px-4 py-4 flex-row items-center gap-3"
          style={{
            backgroundColor: colors.bgCard,
            borderWidth: 1,
            borderColor: 'rgba(232,120,138,0.15)',
            borderStyle: 'dashed',
          }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(232,120,138,0.10)' }}
          >
            <Body size="lg">🔥</Body>
          </View>
          <View className="flex-1">
            <Body size="md" className="font-semibold text-textDark dark:text-darkTextDark">
              {t('dashboard.streak.motivate')}
            </Body>
            <Caption className="text-textLight dark:text-darkTextLight mt-0.5">
              {t('dashboard.streak.longestStreak', { n: longestStreak })}
            </Caption>
          </View>
          <Caption className="text-primary font-semibold">→</Caption>
        </View>
      </Pressable>
    );
  }

  return (
    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 20 }}
        >
          <View className="px-4 py-4 flex-row items-center gap-3">
            {/* Fire icon */}
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}
            >
              <Heading size="xl">🔥</Heading>
            </View>

            {/* Streak info */}
            <View className="flex-1">
              {milestoneKey ? (
                <Caption className="text-white/80 font-semibold uppercase tracking-wider mb-0.5">
                  {t(`dashboard.streak.${milestoneKey}`)}
                </Caption>
              ) : null}
              <Heading size="lg" className="text-white leading-tight">
                {currentStreak === 1
                  ? t('dashboard.streak.oneDay')
                  : t('dashboard.streak.daysInARow', { n: currentStreak })}
              </Heading>
              {longestStreak > currentStreak ? (
                <Caption className="text-white/70 mt-0.5">
                  {t('dashboard.streak.longestStreak', { n: longestStreak })}
                </Caption>
              ) : null}
            </View>

            {/* Streak number badge */}
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}
            >
              <Heading size="lg" className="text-white">{String(currentStreak)}</Heading>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </RNAnimated.View>
  );
}
