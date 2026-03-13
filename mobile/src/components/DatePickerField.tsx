import React, { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useAppColors } from '../navigation/theme';
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
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const handleChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) onChange(selected);
      return;
    }
    // iOS: update temp date (user confirms with Done button)
    if (selected) setTempDate(selected);
  }, [onChange]);

  const handleConfirm = useCallback(() => {
    onChange(tempDate);
    setShow(false);
  }, [onChange, tempDate]);

  const handleCancel = useCallback(() => {
    setTempDate(value);
    setShow(false);
  }, [value]);

  const handleOpen = useCallback(() => {
    setTempDate(value);
    setShow(true);
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
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS: modal bottom sheet with spinner */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <Pressable
            onPress={handleCancel}
            className="flex-1 bg-black/40 justify-end"
          >
            <Pressable onPress={() => {}} className="bg-white rounded-t-2xl">
              {/* Header bar */}
              <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
                <Pressable onPress={handleCancel}>
                  <Text className="text-sm text-textMid">{t.common.cancel}</Text>
                </Pressable>
                <Text className="font-semibold text-textDark">{label ?? t.common.selectDate}</Text>
                <Pressable onPress={handleConfirm}>
                  <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                    {t.common.done}
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                style={{ height: 200 }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
