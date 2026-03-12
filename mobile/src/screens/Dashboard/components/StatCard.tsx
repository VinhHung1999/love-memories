import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BaseCard } from '../../../components/Card';
import { useCountUp } from './useCountUp';

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  count: number;
  iconColor: string;
  bgClass: string;
  onPress: () => void;
}

export function StatCard({
  icon: IconComponent,
  label,
  count,
  iconColor,
  bgClass,
  onPress,
}: StatCardProps) {
  const displayCount = useCountUp(count);
  return (
    <Pressable onPress={onPress} className="flex-1">
      <BaseCard className="px-3 py-2.5 items-center relative">
        {/* Icon */}
        <IconComponent size={15} color={iconColor} strokeWidth={1.5} />

        {/* Count */}
        <Text className="text-[22px] font-bold text-textDark leading-none mt-1">
          {displayCount}
        </Text>

        {/* Label */}
        <Text className="text-[9px] font-semibold text-textMid tracking-[1px] uppercase mt-0.5">
          {label}
        </Text>

        {/* Subtle bottom accent */}
        <View className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full ${bgClass}`} />
      </BaseCard>
    </Pressable>
  );
}
