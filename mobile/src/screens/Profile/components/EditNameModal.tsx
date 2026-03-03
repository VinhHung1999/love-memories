import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import Input from '../../../components/Input';
import FieldLabel from '../../../components/FieldLabel';

interface Props {
  visible: boolean;
  nameInput: string;
  isSaving: boolean;
  onChangeText: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EditNameModal({ visible, nameInput, isSaving, onChangeText, onSave, onClose }: Props) {
  const colors = useAppColors();
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (visible) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}>
      <BottomSheetView>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
          <Pressable onPress={onClose}>
            <Text className="text-sm text-textMid">{t.profile.cancel}</Text>
          </Pressable>
          <Text className="font-semibold text-textDark">{t.profile.editName}</Text>
          <Pressable onPress={onSave} disabled={isSaving || !nameInput.trim()}>
            {isSaving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text className={`font-semibold text-sm ${nameInput.trim() ? 'text-primary' : 'text-textLight'}`}>
                  {t.profile.save}
                </Text>}
          </Pressable>
        </View>

        {/* Content */}
        <View className="px-5 pt-4 pb-10">
          <FieldLabel>{t.profile.labels.name}</FieldLabel>
          <Input
            value={nameInput}
            onChangeText={onChangeText}
            placeholder={t.login.placeholders.name}
            autoFocus
            autoCapitalize="words"
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
