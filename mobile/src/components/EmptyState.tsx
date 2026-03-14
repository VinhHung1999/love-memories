import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppColors } from '../navigation/theme';
import { Heading } from './Typography';

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: IconComponent,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useAppColors();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {IconComponent && (
        <View className="w-20 h-20 rounded-full items-center justify-center mb-5 bg-primary/12">
          <IconComponent size={36} color={colors.primary} strokeWidth={1.5} />
        </View>
      )}
      <Heading size="lg" className="text-textDark text-center mb-2">{title}</Heading>
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
