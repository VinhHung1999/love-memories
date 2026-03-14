import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
import DatePickerSheet from './DatePickerSheet';
import FieldLabel from './FieldLabel';
import { Body } from './Typography';

interface DatePickerFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  /** Parent must pass showBottomSheet from useAppNavigation() — portal context breaks useNavigation */
  showBottomSheet: (screen: React.ComponentType<any>, props?: Record<string, any>) => void;
}

export default function DatePickerField({
  value,
  onChange,
  label,
  maximumDate,
  minimumDate,
  showBottomSheet,
}: DatePickerFieldProps) {
  const colors = useAppColors();

  const handleOpen = useCallback(() => {
    showBottomSheet(DatePickerSheet, {
      value,
      onChange,
      label,
      maximumDate,
      minimumDate,
    });
  }, [value, onChange, label, maximumDate, minimumDate, showBottomSheet]);

  return (
    <View className="mb-3">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        onPress={handleOpen}
        className="flex-row items-center gap-2 rounded-2xl border-[1.5px] border-border px-[18px] py-[13px] bg-inputBg">
        <Calendar size={18} color={colors.textLight} strokeWidth={1.5} />
        <Body size="lg" className="text-textDark flex-1">
          {value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Body>
        <ChevronRight size={16} color={colors.textLight} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}
