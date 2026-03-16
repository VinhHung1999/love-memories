import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Calendar } from 'lucide-react-native';
import AppBottomSheet from './AppBottomSheet';
import { useTranslation } from 'react-i18next';
interface Props {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  onClose: () => void;
}

export default function DatePickerSheet({
  value,
  onChange,
  label,
  maximumDate,
  minimumDate,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [tempDate, setTempDate] = useState(value);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const handleChange = useCallback((_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempDate(selected);
  }, []);

  const handleConfirm = useCallback(() => {
    onChange(tempDate);
    onClose();
  }, [onChange, tempDate, onClose]);

  return (
    <AppBottomSheet
      ref={sheetRef}
      title={label ?? t('common.selectDate')}
      icon={Calendar}
      actionLabel={t('common.done')}
      onAction={handleConfirm}
      onDismiss={onClose}
    >
      <View className="items-center pb-6">
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="inline"
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          style={{ height: 340, width: '100%' }}
        />
      </View>
    </AppBottomSheet>
  );
}
