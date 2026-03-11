import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseCard } from '../../../components/Card';

interface QuickActionButtonProps {
  icon: string;
  label: string;
  iconColor: string;
  bgClass: string;
  onPress: () => void;
}

export function QuickActionButton({
  icon,
  label,
  iconColor,
  bgClass,
  onPress,
}: QuickActionButtonProps) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <BaseCard className="py-4 items-center justify-center gap-1.5 shadow-sm">
        <View className={`w-10 h-10 rounded-2xl items-center justify-center ${bgClass}`}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <Text className="text-[11px] font-semibold text-textMid">{label}</Text>
      </BaseCard>
    </Pressable>
  );
}
