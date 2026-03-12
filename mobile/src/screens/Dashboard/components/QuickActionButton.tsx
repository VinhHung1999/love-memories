import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BaseCard } from '../../../components/Card';

interface QuickActionButtonProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  iconColor: string;
  bgClass: string;
  onPress: () => void;
}

export function QuickActionButton({
  icon: IconComponent,
  label,
  iconColor,
  bgClass,
  onPress,
}: QuickActionButtonProps) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <BaseCard className="py-4 items-center justify-center gap-1.5 shadow-sm">
        <View className={`w-10 h-10 rounded-2xl items-center justify-center ${bgClass}`}>
          <IconComponent size={20} color={iconColor} strokeWidth={1.5} />
        </View>
        <Text className="text-[11px] font-headingSemi text-textMid">{label}</Text>
      </BaseCard>
    </Pressable>
  );
}
