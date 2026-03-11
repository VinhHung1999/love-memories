import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import t from '../../../locales/en';

interface RelationshipTimerProps {
  duration?: { years: number; months: number; days: number; totalDays: number } | null;
  slogan?: string | null;
}

export function RelationshipTimer({ duration }: RelationshipTimerProps) {
  if (!duration) return null;

  return (
    <Animated.View entering={FadeIn.duration(600)}>
      {/* Duration Card */}
      <View className="rounded-3xl overflow-hidden shadow-lg shadow-primary/15 self-stretch">
        <LinearGradient
          colors={['#FFE4EA', '#FFD4DE', '#FFC4D0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 py-3">

          {/* Header with hearts */}
          <View className="flex-row items-center justify-center gap-1.5 mb-2.5">
            <Icon name="heart" size={8} color="#FF6B6B" />
            <Text className="text-[8px] font-heading text-primary tracking-[1.8px] uppercase">
              {t.dashboard.couple.togetherFor}
            </Text>
            <Icon name="heart" size={8} color="#FF6B6B" />
          </View>

          {/* Time Units Display */}
          <View className="flex-row items-center justify-center gap-3">
            {/* Years */}
            {duration.years > 0 && (
              <>
                <View className="items-center">
                  <Text className="text-[26px] font-heading text-textDark leading-none">
                    {duration.years}
                  </Text>
                  <Text className="text-[8px] font-headingSemi text-textMid tracking-[1.2px] uppercase mt-0.5">
                    {t.dashboard.couple.years}
                  </Text>
                </View>
                <View className="w-[1px] h-8 bg-primary/20" />
              </>
            )}

            {/* Months */}
            {duration.months > 0 && (
              <>
                <View className="items-center">
                  <Text className="text-[26px] font-heading text-textDark leading-none">
                    {duration.months}
                  </Text>
                  <Text className="text-[8px] font-headingSemi text-textMid tracking-[1.2px] uppercase mt-0.5">
                    {t.dashboard.couple.months}
                  </Text>
                </View>
                <View className="w-[1px] h-8 bg-primary/20" />
              </>
            )}

            {/* Days */}
            <View className="items-center">
              <Text className="text-[26px] font-heading text-textDark leading-none">
                {duration.days}
              </Text>
              <Text className="text-[8px] font-headingSemi text-textMid tracking-[1.2px] uppercase mt-0.5">
                {t.dashboard.couple.days}
              </Text>
            </View>
          </View>

          {/* Bottom decorative hearts */}
          <View className="flex-row items-center justify-center gap-1 mt-2.5">
            <Icon name="heart" size={5} color="#FF6B6B" />
            <Icon name="heart" size={6} color="#FF6B6B" />
            <Icon name="heart" size={5} color="#FF6B6B" />
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}
