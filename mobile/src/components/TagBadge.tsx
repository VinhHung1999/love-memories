import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppColors } from '../navigation/theme';
import { Caption } from './Typography';

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
  const colors = useAppColors();

  if (variant === 'display') {
    return (
      <View className="px-2 py-[2px] rounded-full bg-primary/12">
        <Caption className="font-medium text-primary">{label}</Caption>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="px-3 py-1.5 rounded-xl border"
      style={{ backgroundColor: active ? colors.primary : 'rgba(255,255,255,0.7)', borderColor: active ? colors.primary : colors.border }}>
      <Caption className="font-semibold" style={{ color: active ? '#fff' : colors.textMid }}>
        {label}
      </Caption>
    </Pressable>
  );
}
