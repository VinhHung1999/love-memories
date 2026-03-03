import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../navigation/theme';

interface EmptyStateProps {
  icon?: string;            // MaterialCommunityIcons name
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useAppColors();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {icon && (
        <View className="w-20 h-20 rounded-full items-center justify-center mb-5 bg-primary/12">
          <Icon name={icon} size={36} color={colors.primary} />
        </View>
      )}
      <Text className="text-xl font-bold text-textDark text-center mb-2">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-textMid text-center mb-6 leading-relaxed">{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="px-6 py-3 rounded-2xl bg-primary">
          <Text className="text-white font-semibold text-sm">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
