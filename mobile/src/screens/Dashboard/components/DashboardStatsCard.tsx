import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import { useCountUp } from './useCountUp';

interface DashboardStatsCardProps {
  duration?: { years: number; months: number; days: number; totalDays: number } | null;
  momentsCount: number;
  foodSpotsCount: number;
  onMomentsPress: () => void;
  onFoodSpotsPress: () => void;
}

export function DashboardStatsCard({
  duration,
  momentsCount,
  foodSpotsCount,
  onMomentsPress,
  onFoodSpotsPress,
}: DashboardStatsCardProps) {
  const colors = useAppColors();
  const displayMoments = useCountUp(momentsCount);
  const displayFoodSpots = useCountUp(foodSpotsCount);

  return (
    <Animated.View entering={FadeIn.duration(500)} className="bg-white rounded-3xl shadow-lg shadow-primary/15">
      <View className="px-4 py-3">

        {/* Duration Section */}
        {duration ? (
          <View className="items-center mb-3 bg-primary/5 rounded-2xl py-2">
            <View className="flex-row items-center gap-1.5">
              <Icon name="heart" size={8} color="#FF6B6B" />
              <Text className="text-[9px] font-heading text-primary tracking-[1.5px] uppercase">
                {t.dashboard.couple.togetherFor}
              </Text>
              <Text className="text-[15px] font-heading text-textDark mx-1">
                {duration.years > 0 && `${duration.years}${t.dashboard.couple.years} `}
                {duration.months > 0 && `${duration.months}${t.dashboard.couple.months} `}
                {duration.days}{t.dashboard.couple.days}
              </Text>
              <Icon name="heart" size={8} color="#FF6B6B" />
            </View>
          </View>
        ) : null}

        {/* Divider */}
        <View className="h-[1px] bg-primary/15 mb-3" />

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          {/* Moments Stat */}
          <Pressable onPress={onMomentsPress} className="flex-1 items-center py-2">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Icon name="heart-multiple-outline" size={14} color={colors.primary} />
              <Text className="text-[20px] font-heading text-textDark leading-none">
                {displayMoments}
              </Text>
            </View>
            <Text className="text-[9px] font-headingSemi text-textMid tracking-[0.8px] uppercase">
              {t.dashboard.stats.moments}
            </Text>
          </Pressable>

          {/* Vertical Divider */}
          <View className="w-[1px] bg-primary/15 self-stretch" />

          {/* Food Spots Stat */}
          <Pressable onPress={onFoodSpotsPress} className="flex-1 items-center py-2">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Icon name="food-fork-drink" size={14} color={colors.secondary} />
              <Text className="text-[20px] font-heading text-textDark leading-none">
                {displayFoodSpots}
              </Text>
            </View>
            <Text className="text-[9px] font-headingSemi text-textMid tracking-[0.8px] uppercase">
              {t.dashboard.stats.foodSpots}
            </Text>
          </Pressable>
        </View>

      </View>
    </Animated.View>
  );
}
