import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import AvatarCircle from '../../../components/AvatarCircle';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';

interface RelationshipTimerProps {
  duration?: { years: number; months: number; days: number; totalDays: number } | null;
  slogan?: string | null;
  userAvatar?: string | null;
  userInitials?: string;
  partnerAvatar?: string | null;
  partnerInitials?: string;
}

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

        {/* Avatar row with animated heart connector */}
        <View className="flex-row items-center">
          <AvatarCircle uri={userAvatar} initials={userInitials} size={56} />

          {/* Connector: line — heart — line */}
          <View className="flex-1 flex-row items-center px-3">
            <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.primary + '33' }} />
            <Animated.View style={heartStyle} className="mx-2">
              <Heart
                size={22}
                color={colors.primary}
                fill={colors.primary}
                strokeWidth={0}
              />
            </Animated.View>
            <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.primary + '33' }} />
          </View>

          <AvatarCircle uri={partnerAvatar} initials={partnerInitials} size={56} />
        </View>

        {/* Days count */}
        <Text className="text-center text-[12px] text-textMid font-body mt-3">
          {daysLabel}
        </Text>

      </View>
    </Animated.View>
  );
}
