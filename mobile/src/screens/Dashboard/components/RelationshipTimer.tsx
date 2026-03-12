import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
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
      <View className="rounded-3xl shadow-sm self-stretch bg-white border border-borderSoft px-5 py-3">

          {/* Header with hearts */}
          <View className="flex-row items-center justify-center gap-1.5 mb-2.5">
            <Heart size={8} strokeWidth={1.5} />
            <Text className="text-[8px] font-heading text-primary tracking-[1.8px] uppercase">
              {t.dashboard.couple.togetherFor}
            </Text>
            <Heart size={8} strokeWidth={1.5} />
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
            <Heart size={5} strokeWidth={1.5} />
            <Heart size={6} strokeWidth={1.5} />
            <Heart size={5} strokeWidth={1.5} />
          </View>
      </View>
    </Animated.View>
  );
}
