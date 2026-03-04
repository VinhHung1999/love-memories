import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface HeaderIconButtonProps {
  name: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}

export default function HeaderIconButton({
  name,
  onPress,
  disabled,
  size = 18,
}: HeaderIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="w-9 h-9 rounded-xl items-center justify-center bg-white/20">
      <Icon name={name} size={size} color="#fff" />
    </TouchableOpacity>
  );
}
