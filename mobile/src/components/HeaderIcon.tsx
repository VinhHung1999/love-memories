import React from 'react';
import { Pressable } from 'react-native';
import { useAppColors } from '../navigation/theme';

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface HeaderIconProps {
  icon: LucideIcon;
  onPress?: () => void;
}

export default function HeaderIcon({ icon: Icon, onPress }: HeaderIconProps) {
  const colors = useAppColors();
  if (!onPress) return null;
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-xl"
      style={{ width: 36, height: 36, backgroundColor: colors.primary + '1A' }}>
      <Icon size={18} color={colors.primary} strokeWidth={1.75} />
    </Pressable>
  );
}
