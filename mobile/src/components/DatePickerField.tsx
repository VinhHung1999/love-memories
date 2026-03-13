import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
import AppBottomSheet from './AppBottomSheet';
import FieldLabel from './FieldLabel';
import t from '../locales/en';

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
  const sheetRef = useRef<BottomSheetModal>(null);
  const [tempDate, setTempDate] = useState(value);
  // Android-only: system dialog
  const [showAndroid, setShowAndroid] = useState(false);

  const handleChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroid(false);
      if (selected) onChange(selected);
      return;
    }
    if (selected) setTempDate(selected);
  }, [onChange]);

  const handleConfirm = useCallback(() => {
    onChange(tempDate);
    sheetRef.current?.dismiss();
  }, [onChange, tempDate]);

  const handleOpen = useCallback(() => {
    setTempDate(value);
    if (Platform.OS === 'android') {
      setShowAndroid(true);
    } else {
      sheetRef.current?.present();
    }
  }, [value]);

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
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS: AppBottomSheet with spinner */}
      {Platform.OS === 'ios' && (
        <AppBottomSheet
          ref={sheetRef}
          title={label ?? t.common.selectDate}
          icon={Calendar}
          actionLabel={t.common.done}
          onAction={handleConfirm}
        >
          <View className="items-center pb-6">
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              style={{ height: 200, width: '100%' }}
            />
          </View>
        </AppBottomSheet>
      )}
    </View>
  );
}
