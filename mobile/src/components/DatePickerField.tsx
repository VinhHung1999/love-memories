import React, { useCallback, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
import { useAppNavigation } from '../navigation/useAppNavigation';
import DatePickerSheet from './DatePickerSheet';
import FieldLabel from './FieldLabel';

interface DatePickerFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePickerField({
  value,
  onChange,
  label,
  maximumDate,
  minimumDate,
}: DatePickerFieldProps) {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  // Android-only: system dialog
  const [showAndroid, setShowAndroid] = useState(false);

  const handleAndroidChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    setShowAndroid(false);
    if (selected) onChange(selected);
  }, [onChange]);

  const handleOpen = useCallback(() => {
    if (Platform.OS === 'android') {
      setShowAndroid(true);
    } else {
      navigation.showBottomSheet(DatePickerSheet, {
        value,
        onChange,
        label,
        maximumDate,
        minimumDate,
      });
    }
  }, [value, onChange, label, maximumDate, minimumDate, navigation]);

  return (
    <View className="mb-3">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        onPress={handleOpen}
        className="flex-row items-center gap-2 rounded-2xl border-[1.5px] border-border px-[18px] py-[13px] bg-inputBg">
        <Calendar size={18} color={colors.textLight} strokeWidth={1.5} />
        <Text className="text-base text-textDark flex-1">
          {value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <ChevronRight size={16} color={colors.textLight} strokeWidth={1.5} />
      </Pressable>

      {/* Android: system dialog */}
      {Platform.OS === 'android' && showAndroid && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}
