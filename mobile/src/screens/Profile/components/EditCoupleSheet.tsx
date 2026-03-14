import React, { useRef, useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Caption, Label } from '../../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarHeart, ChevronUp } from 'lucide-react-native';
import { coupleApi, settingsApi } from '../../../lib/api';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import { useAppColors } from '../../../navigation/theme';
import type { CoupleProfile } from '../../../types';
import AppBottomSheet from '../../../components/AppBottomSheet';
import FieldLabel from '../../../components/FieldLabel';
import Input from '../../../components/Input';
import t from '../../../locales/en';

function formatDateDisplay(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface Props {
  couple: CoupleProfile | null;
  slogan?: string | null;
  onClose: () => void;
}

export default function EditCoupleSheet({ couple, slogan, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();
  const [coupleNameInput, setCoupleNameInput] = useState(couple?.name ?? '');
  const [sloganInput, setSloganInput] = useState(slogan ?? '');
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(
    couple?.anniversaryDate ? new Date(couple.anniversaryDate) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      await coupleApi.update({
        name: coupleNameInput.trim() || undefined,
        anniversaryDate: anniversaryDate ? anniversaryDate.toISOString() : null,
      });
      await settingsApi.set('app_slogan', sloganInput.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couple'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'app_slogan'] });
      onClose();
    },
    onError: (err: Error) =>
      navigation.showAlert({ type: 'error', title: t.common.error, message: err.message }),
  });

  return (
    <AppBottomSheet
      ref={sheetRef}
      title={t.profile.editCouple}
      onSave={() => mutation.mutate()}
      isSaving={mutation.isPending}
      onDismiss={() => { setShowDatePicker(false); onClose(); }}>
      <View className="px-5 pt-4 pb-10">

        {/* Couple name */}
        <FieldLabel>{t.profile.labels.coupleName}</FieldLabel>
        <Input
          value={coupleNameInput}
          onChangeText={setCoupleNameInput}
          placeholder="Hung & Nhu"
          autoCapitalize="words"
        />

        {/* Slogan */}
        <FieldLabel>{t.profile.labels.slogan}</FieldLabel>
        <Input
          value={sloganInput}
          onChangeText={setSloganInput}
          placeholder={t.profile.placeholders.slogan}
          autoCapitalize="sentences"
        />

        {/* Anniversary date */}
        <FieldLabel>{t.profile.labels.anniversary}</FieldLabel>
        <Pressable
          onPress={() => setShowDatePicker(v => !v)}
          className="flex-row items-center justify-between bg-inputBg border border-border rounded-2xl px-4 h-[50px] mb-4">
          <Label style={{ color: anniversaryDate ? colors.textDark : colors.textLight }}>
            {anniversaryDate ? formatDateDisplay(anniversaryDate) : t.profile.couple.noAnniversary}
          </Label>
          {showDatePicker
            ? <ChevronUp size={18} color={colors.primary} strokeWidth={1.5} />
            : <CalendarHeart size={18} color={colors.primary} strokeWidth={1.5} />}
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
              if (event.type !== 'dismissed' && date) setAnniversaryDate(date);
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
              onChange={(_, date) => { if (date) setAnniversaryDate(date); }}
            />
            <Pressable
              onPress={() => setShowDatePicker(false)}
              className="py-3 items-center border-t border-border">
              <Label className="text-primary">Done</Label>
            </Pressable>
          </View>
        )}

        {/* Clear anniversary */}
        {anniversaryDate && !showDatePicker && (
          <Pressable onPress={() => setAnniversaryDate(null)} className="mb-2">
            <Caption className="text-textLight text-center">Clear anniversary date</Caption>
          </Pressable>
        )}

      </View>
    </AppBottomSheet>
  );
}
