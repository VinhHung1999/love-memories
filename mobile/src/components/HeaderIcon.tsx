import React from 'react';
import { Pressable } from 'react-native';
import { useAppColors } from '../navigation/theme';

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface HeaderIconProps {
  icon: LucideIcon;
  onPress?: () => void;
  iconColor?: string;
  bg?: string;
}

export default function HeaderIcon({ icon: Icon, onPress, iconColor, bg }: HeaderIconProps) {
  const colors = useAppColors();
  if (!onPress) return null;
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-xl"
      style={{ width: 36, height: 36, backgroundColor: bg ?? '#F0E8EC' }}>
      <Icon size={18} color={iconColor ?? colors.textDark} strokeWidth={1.75} />
    </Pressable>
  );
}
