import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import type { DatePlan } from '../../../types';
import { GradientCard } from '../../../components/GradientCard';
import t from '../../../locales/en';

interface CompactDateCardProps {
  plans: DatePlan[];
  onPress: () => void;
}

export function CompactDateCard({ plans, onPress }: CompactDateCardProps) {
  const colors = useAppColors();
  const firstPlan = plans[0];

  function fmtDateShort(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <GradientCard
      colors={[colors.secondary, colors.secondaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1 p-4 justify-between"
      pressableClassName="flex-1"
      onPress={onPress}>
      <View className="flex-row items-center gap-1.5">
        <View className="w-6 h-6 rounded-xl bg-white/20 items-center justify-center">
          <Icon name="calendar-heart" size={12} color="#fff" />
        </View>
        <Text className="text-[10px] font-semibold text-white/60 tracking-widest uppercase">
          {t.dashboard.compactDateCard.label}
        </Text>
      </View>
      {firstPlan ? (
        <View className="mt-2">
          <Text className="text-[12px] font-bold text-white" numberOfLines={1}>
            {firstPlan.title}
          </Text>
          <Text className="text-[10px] text-white/60 mt-0.5">
            {fmtDateShort(firstPlan.date)}
          </Text>
        </View>
      ) : (
        <Text className="text-[11px] text-white/50 italic mt-2">
          {t.dashboard.compactDateCard.noPlans}
        </Text>
      )}
    </GradientCard>
  );
}
