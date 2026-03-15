import React, { useRef, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Caption } from '../../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coupleApi, settingsApi } from '../../../lib/api';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import type { CoupleProfile } from '../../../types';
import AppBottomSheet from '../../../components/AppBottomSheet';
import DatePickerField from '../../../components/DatePickerField';
import FieldLabel from '../../../components/FieldLabel';
import Input from '../../../components/Input';
import t from '../../../locales/en';

interface Props {
  couple: CoupleProfile | null;
  slogan?: string | null;
  onClose: () => void;
}

export default function EditCoupleSheet({ couple, slogan, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();
  const [coupleNameInput, setCoupleNameInput] = useState(couple?.name ?? '');
  const [sloganInput, setSloganInput] = useState(slogan ?? '');
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(
    couple?.anniversaryDate ? new Date(couple.anniversaryDate) : null,
  );

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
      onDismiss={onClose}>
      <View className="px-5 pt-4 pb-10">

        {/* Couple name */}
        <FieldLabel>{t.profile.labels.coupleName}</FieldLabel>
        <Input
          bottomSheet
          value={coupleNameInput}
          onChangeText={setCoupleNameInput}
          placeholder="Hung & Nhu"
          autoCapitalize="words"
        />

        {/* Slogan */}
        <FieldLabel>{t.profile.labels.slogan}</FieldLabel>
        <Input
          bottomSheet
          value={sloganInput}
          onChangeText={setSloganInput}
          placeholder={t.profile.placeholders.slogan}
          autoCapitalize="sentences"
        />

        {/* Anniversary date */}
        <DatePickerField
          label={t.profile.labels.anniversary}
          value={anniversaryDate ?? new Date()}
          onChange={setAnniversaryDate}
          maximumDate={new Date()}
          showBottomSheet={navigation.showBottomSheet}
        />

        {/* Clear anniversary */}
        {anniversaryDate ? (
          <Pressable onPress={() => setAnniversaryDate(null)} className="mb-2 -mt-1">
            <Caption className="text-textLight text-center">Clear anniversary date</Caption>
          </Pressable>
        ) : null}

      </View>
    </AppBottomSheet>
  );
}
