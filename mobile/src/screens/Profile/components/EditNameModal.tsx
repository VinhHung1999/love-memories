import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between border-b border-border">
          <Pressable onPress={onClose}>
            <Text className="text-textMid text-sm">{t.profile.cancel}</Text>
          </Pressable>
          <Text className="font-semibold text-textDark">{t.profile.editName}</Text>
          <Pressable onPress={onSave} disabled={isSaving || !nameInput.trim()}>
            {isSaving
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text className={`font-semibold text-sm ${nameInput.trim() ? 'text-primary' : 'text-textLight'}`}>{t.profile.save}</Text>}
          </Pressable>
        </View>
        <View className="p-5">
          <FieldLabel>{t.profile.labels.name}</FieldLabel>
          <Input
            value={nameInput}
            onChangeText={onChangeText}
            placeholder={t.login.placeholders.name}
            autoFocus
            autoCapitalize="words"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
