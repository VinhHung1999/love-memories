import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Heart } from 'lucide-react-native';
import AvatarCircle from '../../../components/AvatarCircle';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';

// Pale rose ring color around avatars
const AVATAR_RING = '#F9D0D8';
// Gradient midpoint for connector line
const CONNECTOR_MID = '#F4C5CC';

interface RelationshipTimerProps {
  duration?: { years: number; months: number; days: number; totalDays: number } | null;
  slogan?: string | null;
  userAvatar?: string | null;
  userInitials?: string;
  partnerAvatar?: string | null;
  partnerInitials?: string;
}

// ── Avatar with animated shimmer ring ────────────────────────────────────────
// Per design spec: opacity 1.0→0.55 AND scale 1.0→1.06, 2400ms cycle, ease-in-out
// Stagger at exactly half-phase (1200ms) for natural out-of-phase breathing

function AvatarWithRing({
  uri,
  initials,
  animDelay = 0,
}: {
  uri?: string | null;
  initials: string;
  animDelay?: number;
}) {
  const ringOpacity = useSharedValue(1);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    const pulseConfig = { duration: 1200, easing: Easing.inOut(Easing.ease) };
    ringOpacity.value = withDelay(
      animDelay,
      withRepeat(
        withSequence(
          withTiming(0.55, pulseConfig),
          withTiming(1.0, pulseConfig),
        ),
        -1,
        false,
      ),
    );
    ringScale.value = withDelay(
      animDelay,
      withRepeat(
        withSequence(
          withTiming(1.06, pulseConfig),
          withTiming(1.0, pulseConfig),
        ),
        -1,
        false,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View
      style={[
        ringStyle,
        { width: 60, height: 60, backgroundColor: AVATAR_RING, borderRadius: 30 },
      ]}
      className="items-center justify-center">
      <AvatarCircle uri={uri} initials={initials} size={56} />
    </Animated.View>
  );
}
 
// ── Main Component ────────────────────────────────────────────────────────────

export function RelationshipTimer({
  duration,
  userAvatar,
  userInitials = '?',
  partnerAvatar,
  partnerInitials = '?',
}: RelationshipTimerProps) {
  const colors = useAppColors();
  const heartScale = useSharedValue(1);

  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!duration) return null;

  const daysLabel = duration.years >= 1
    ? `${duration.years} ${t.dashboard.couple.yearUnit} · ${duration.totalDays} ${t.dashboard.couple.daysUnit} ${t.dashboard.couple.together}`
    : `${duration.totalDays} ${t.dashboard.couple.daysUnit} ${t.dashboard.couple.together}`;

  return (
    <Animated.View entering={FadeIn.duration(600)}>
      <View className="bg-white rounded-3xl border border-borderSoft px-5 py-4">

        {/* Avatar row */}
        <View className="flex-row items-center justify-between">
          {/* Left avatar — starts pulsing immediately */}
          <AvatarWithRing uri={userAvatar} initials={userInitials} animDelay={0} />

          {/* Connector: gradient line with floating heart centered on top */}
          <View className="flex-1 mx-3 items-center justify-center" style={{ height: 60 }}>
            {/* Gradient fade line */}
            <LinearGradient
              colors={['transparent', CONNECTOR_MID, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 0, right: 0, height: 1 }}
            />
            {/* Heart with white cutout behind it */}
            <Animated.View style={heartStyle} className="items-center justify-center">
              <View
                className="rounded-full bg-white items-center justify-center"
                style={{ width: 28, height: 28 }}>
                <Heart
                  size={20}
                  color={colors.primary}
                  fill={colors.primary}
                  strokeWidth={0}
                />
              </View>
            </Animated.View>
          </View>

          {/* Right avatar — half-phase offset (1200ms = 2400ms ÷ 2) */}
          <AvatarWithRing uri={partnerAvatar} initials={partnerInitials} animDelay={1200} />
        </View>

        {/* Days count */}
        <Text className="text-center text-[13px] text-textMid font-body mt-3">
          {daysLabel}
        </Text>

      </View>
    </Animated.View>
  );
}
