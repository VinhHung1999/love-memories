import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';

export default function ErrorBox({ message }: { message: string }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center gap-[7px] bg-errorBg rounded-xl px-[14px] py-[10px] mb-3">
      <AlertCircle size={14} color={colors.errorColor} strokeWidth={1.5} />
      <Text className="flex-1 text-[13px] leading-[18px] text-error">{message}</Text>
    </View>
  );
}
