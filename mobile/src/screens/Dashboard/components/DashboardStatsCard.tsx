import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Heart, Utensils } from 'lucide-react-native';
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
  momentsCount,
  foodSpotsCount,
  onMomentsPress,
  onFoodSpotsPress,
}: DashboardStatsCardProps) {
  const colors = useAppColors();
  const displayMoments = useCountUp(momentsCount);
  const displayFoodSpots = useCountUp(foodSpotsCount);

  return (
    <Animated.View entering={FadeIn.duration(500)} className="bg-white rounded-3xl border border-borderSoft">
      <View className="px-4 py-3">

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          {/* Moments Stat */}
          <Pressable onPress={onMomentsPress} className="flex-1 items-center py-2">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Heart size={14} color={colors.primary} strokeWidth={1.5} />
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
              <Utensils size={14} color={colors.secondary} strokeWidth={1.5} />
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
