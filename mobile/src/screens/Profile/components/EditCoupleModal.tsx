import React, { forwardRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import FieldLabel from '../../../components/FieldLabel';

function formatDateDisplay(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface Props {
  coupleNameInput: string;
  anniversaryDate: Date | null;
  isSaving: boolean;
  onChangeName: (v: string) => void;
  onChangeAnniversary: (d: Date | null) => void;
  onSave: () => void;
  onDismiss?: () => void;
}

const EditCoupleModal = forwardRef<BottomSheetModal, Props>(
  (
    { coupleNameInput, anniversaryDate, isSaving, onChangeName, onChangeAnniversary, onSave, onDismiss },
    ref,
  ) => {
    const colors = useAppColors();
    const [showDatePicker, setShowDatePicker] = useState(false);

    return (
      <AppBottomSheet
        ref={ref}
        title={t.profile.editCouple}
        onSave={onSave}
        isSaving={isSaving}
        onDismiss={() => {
          setShowDatePicker(false);
          onDismiss?.();
        }}>
        <View className="px-5 pt-4 pb-10">

          {/* Couple name */}
          <FieldLabel>{t.profile.labels.coupleName}</FieldLabel>
          <Input
            value={coupleNameInput}
            onChangeText={onChangeName}
            placeholder="Hung & Nhu"
            autoCapitalize="words"
          />

          {/* Anniversary date */}
          <FieldLabel>{t.profile.labels.anniversary}</FieldLabel>
          <Pressable
            onPress={() => setShowDatePicker(v => !v)}
            className="flex-row items-center justify-between bg-inputBg border border-border rounded-2xl px-4 h-[50px] mb-4">
            <Text className={anniversaryDate ? 'text-textDark text-sm' : 'text-textLight text-sm'}>
              {anniversaryDate ? formatDateDisplay(anniversaryDate) : t.profile.couple.noAnniversary}
            </Text>
            <Icon
              name={showDatePicker ? 'chevron-up' : 'calendar-heart'}
              size={18}
              color={colors.primary}
            />
          </Pressable>

          {/* Android DatePicker (native dialog) */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={anniversaryDate ?? new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (event.type !== 'dismissed' && date) onChangeAnniversary(date);
              }}
            />
          )}

          {/* iOS DatePicker (inline spinner) */}
          {showDatePicker && Platform.OS === 'ios' && (
            <View className="bg-gray-50 rounded-2xl overflow-hidden mb-4">
              <DateTimePicker
                value={anniversaryDate ?? new Date()}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, date) => { if (date) onChangeAnniversary(date); }}
              />
              <Pressable
                onPress={() => setShowDatePicker(false)}
                className="py-3 items-center border-t border-border">
                <Text className="text-primary font-semibold text-sm">Done</Text>
              </Pressable>
            </View>
          )}

          {/* Clear anniversary */}
          {anniversaryDate && !showDatePicker && (
            <Pressable onPress={() => onChangeAnniversary(null)} className="mb-2">
              <Text className="text-xs text-textLight text-center">Clear anniversary date</Text>
            </Pressable>
          )}

        </View>
      </AppBottomSheet>
    );
  },
);

EditCoupleModal.displayName = 'EditCoupleModal';
export default EditCoupleModal;
