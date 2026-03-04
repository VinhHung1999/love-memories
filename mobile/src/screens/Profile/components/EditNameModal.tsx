import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import t from '../../../locales/en';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import FieldLabel from '../../../components/FieldLabel';

interface Props {
  nameInput: string;
  isSaving: boolean;
  onChangeText: (v: string) => void;
  onSave: () => void;
  onDismiss?: () => void;
}

const EditNameModal = forwardRef<BottomSheetModal, Props>(
  ({ nameInput, isSaving, onChangeText, onSave, onDismiss }, ref) => {
    return (
      <AppBottomSheet
        ref={ref}
        title={t.profile.editName}
        onSave={onSave}
        isSaving={isSaving}
        saveDisabled={!nameInput.trim()}
        onDismiss={onDismiss}>
        <View className="px-5 pb-10">
          <FieldLabel>{t.profile.labels.name}</FieldLabel>
          <Input
            value={nameInput}
            onChangeText={onChangeText}
            placeholder={t.login.placeholders.name}
            autoFocus
            autoCapitalize="words"
          />
        </View>
      </AppBottomSheet>
    );
  },
);

EditNameModal.displayName = 'EditNameModal';
export default EditNameModal;
