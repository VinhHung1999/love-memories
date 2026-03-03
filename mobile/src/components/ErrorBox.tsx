import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../navigation/theme';

export default function ErrorBox({ message }: { message: string }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center gap-[7px] bg-errorBg rounded-xl px-[14px] py-[10px] mb-3">
      <Icon name="alert-circle-outline" size={14} color={colors.errorColor} />
      <Text className="flex-1 text-[13px] leading-[18px] text-error">{message}</Text>
    </View>
  );
}
