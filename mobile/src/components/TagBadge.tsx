import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface TagBadgeProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'filter' | 'display';
}

/**
 * Tag/chip component.
 * - filter: pressable pill with active/inactive states (used in tag filter bars)
 * - display: read-only pill (used in moment detail tags)
 */
export default function TagBadge({
  label,
  active = false,
  onPress,
  onLongPress,
  variant = 'filter',
}: TagBadgeProps) {
  if (variant === 'display') {
    return (
      <View className="px-2 py-[2px] rounded-full bg-primary/12">
        <Text className="text-[10px] font-medium text-primary">{label}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`px-3 py-1.5 rounded-xl ${
        active ? 'bg-primary' : 'bg-white/70 border border-border'
      }`}>
      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-textMid'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
