import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import FieldLabel from '../../../components/FieldLabel';
import ErrorBox from '../../../components/ErrorBox';
import { useAppColors } from '../../../navigation/theme';
import { profileApi } from '../../../lib/api';
import t from '../../../locales/en';

interface DeleteAccountSheetProps {
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteAccountSheet({ onClose, onDeleted }: DeleteAccountSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { sheetRef.current?.present(); }, []);

  const handleDelete = async () => {
    if (!password.trim()) return;
    setIsDeleting(true);
    setError(null);
    try {
      await profileApi.deleteAccount(password.trim());
      onDeleted();
    } catch {
      setError(t.profile.deleteAccount.failed);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      showHeader={false}
      onDismiss={onClose}>

      <View className="px-5 pb-10 pt-4">
        {/* Warning header */}
        <View className="items-center mb-5">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.10)' }}>
            <Icon name="alert-circle-outline" size={28} color={colors.error} />
          </View>
          <Text className="text-lg font-bold text-textDark text-center">
            {t.profile.deleteAccount.title}
          </Text>
          <Text className="text-xs text-error font-semibold mt-0.5">
            {t.profile.deleteAccount.subtitle}
          </Text>
        </View>

        {/* Warning text */}
        <View
          className="rounded-2xl px-4 py-3 mb-5"
          style={{ backgroundColor: 'rgba(239,68,68,0.06)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' }}>
          <Text className="text-[13px] text-textMid leading-relaxed">
            {t.profile.deleteAccount.warning}
          </Text>
        </View>

        {error ? <ErrorBox message={error} /> : null}

        {/* Password field */}
        <View className="mb-6">
          <FieldLabel>{t.profile.deleteAccount.passwordLabel}</FieldLabel>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder={t.profile.deleteAccount.passwordPlaceholder}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleDelete}
          />
        </View>

        {/* Confirm button */}
        <Button
          label={isDeleting ? t.profile.deleteAccount.deleting : t.profile.deleteAccount.confirmButton}
          onPress={handleDelete}
          disabled={!password.trim() || isDeleting}
          variant="outline"
        />
      </View>
    </AppBottomSheet>
  );
}
