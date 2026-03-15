import React, { useRef, useEffect, useState } from 'react';
import { View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../lib/auth';
import { profileApi } from '../../../lib/api';
import { useAppNavigation } from '../../../navigation/useAppNavigation';
import type { AuthUser } from '../../../types';
import AppBottomSheet from '../../../components/AppBottomSheet';
import FieldLabel from '../../../components/FieldLabel';
import Input from '../../../components/Input';
import { useTranslation } from 'react-i18next';
interface Props {
  user: AuthUser;
  onClose: () => void;
}

export default function EditNameSheet({ user, onClose }: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();
  const [nameInput, setNameInput] = useState(user.name);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const mutation = useMutation({
    mutationFn: () => profileApi.updateName(nameInput.trim()),
    onSuccess: (data) => {
      updateUser({ name: data.name });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      onClose();
    },
    onError: (err: Error) =>
      navigation.showAlert({ type: 'error', title: t('common.error'), message: err.message }),
  });

  return (
    <AppBottomSheet
      ref={sheetRef}
      title={t('profile.editName')}
      onSave={() => { if (nameInput.trim()) mutation.mutate(); }}
      isSaving={mutation.isPending}
      saveDisabled={!nameInput.trim()}
      onDismiss={onClose}>
      <View className="px-5 pb-10">
        <FieldLabel>{t('profile.labels.name')}</FieldLabel>
        <Input
          bottomSheet
          value={nameInput}
          onChangeText={setNameInput}
          placeholder={t('login.placeholders.name')}
          autoFocus
          autoCapitalize="words"
        />
      </View>
    </AppBottomSheet>
  );
}
