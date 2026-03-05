import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../navigation/theme';

interface HeaderIconButtonProps {
  name: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  /** true (default) = white icon on bg-white/20 (for dark headers)
   *  false = dark icon on bg-textDark/8 (for light headers) */
  dark?: boolean;
}

export default function HeaderIconButton({
  name,
  onPress,
  disabled,
  size = 18,
  dark = true,
}: HeaderIconButtonProps) {
  const colors = useAppColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="w-9 h-9 rounded-xl items-center justify-center"
      style={{ backgroundColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(26,22,36,0.08)' }}>
      <Icon name={name} size={size} color={dark ? '#fff' : colors.textDark} />
    </TouchableOpacity>
  );
}
