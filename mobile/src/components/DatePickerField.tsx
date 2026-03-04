import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../navigation/theme';
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
  const [show, setShow] = useState(false);

  const handleChange = (_: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected);
  };

  return (
    <View className="mb-3">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable
        onPress={() => setShow(true)}
        className="flex-row items-center gap-2 rounded-2xl border-[1.5px] border-border px-[18px] h-[50px] bg-inputBg">
        <Icon name="calendar-outline" size={18} color={colors.textLight} />
        <Text className="text-base text-textDark flex-1">
          {value.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <Icon name="chevron-right" size={16} color={colors.textLight} />
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
}
