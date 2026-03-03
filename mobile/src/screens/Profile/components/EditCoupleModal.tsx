import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import Input from '../../../components/Input';
import FieldLabel from '../../../components/FieldLabel';

function formatDateDisplay(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface Props {
  visible: boolean;
  coupleNameInput: string;
  anniversaryDate: Date | null;
  isSaving: boolean;
  onChangeName: (v: string) => void;
  onChangeAnniversary: (d: Date | null) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EditCoupleModal({
  visible, coupleNameInput, anniversaryDate, isSaving,
  onChangeName, onChangeAnniversary, onSave, onClose,
}: Props) {
  const colors = useAppColors();
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between border-b border-border">
          <Pressable onPress={onClose}>
            <Text className="text-textMid text-sm">{t.profile.cancel}</Text>
          </Pressable>
          <Text className="font-semibold text-textDark">{t.profile.editCouple}</Text>
          <Pressable onPress={onSave} disabled={isSaving}>
            {isSaving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text className="font-semibold text-sm text-primary">{t.profile.save}</Text>}
          </Pressable>
        </View>

        <View className="p-5">
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
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center justify-between bg-inputBg border border-border rounded-2xl px-4 h-[50px] mb-4">
            <Text className={anniversaryDate ? 'text-textDark text-sm' : 'text-textLight text-sm'}>
              {anniversaryDate ? formatDateDisplay(anniversaryDate) : t.profile.couple.noAnniversary}
            </Text>
            <Icon name="calendar-heart" size={18} color={colors.primary} />
          </Pressable>

          {/* Clear anniversary */}
          {anniversaryDate && (
            <Pressable onPress={() => onChangeAnniversary(null)} className="mb-4">
              <Text className="text-xs text-textLight text-center">Clear anniversary date</Text>
            </Pressable>
          )}

          {/* Android DatePicker — shows native dialog */}
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

          {/* iOS DatePicker — inline spinner with Done button */}
          {showDatePicker && Platform.OS === 'ios' && (
            <View className="bg-gray-50 rounded-2xl overflow-hidden mb-2">
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
        </View>
      </SafeAreaView>
    </Modal>
  );
}
