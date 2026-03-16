import React from 'react';
import { Pressable, View } from 'react-native';
import { Heading, Caption } from '../../../components/Typography';
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
        <Heading size="lg" className="text-textDark dark:text-darkTextDark leading-none mt-1">
          {displayCount}
        </Heading>

        {/* Label */}
        <Caption className="font-semibold text-textMid dark:text-darkTextMid tracking-[1px] uppercase mt-0.5" style={{ fontSize: 9 }}>
          {label}
        </Caption>

        {/* Subtle bottom accent */}
        <View className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full ${bgClass}`} />
      </BaseCard>
    </Pressable>
  );
}
