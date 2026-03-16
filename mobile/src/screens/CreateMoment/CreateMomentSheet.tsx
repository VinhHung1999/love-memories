import React, { useCallback, useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Caption } from '../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import type { Moment } from '../../types';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import AppBottomSheet from '../../components/AppBottomSheet';
import Input from '../../components/Input';
import PhotoPicker from './components/PhotoPicker';

interface Props {
  moment?: Moment;
  initialPhoto?: { uri: string; mimeType?: string };
  onClose: () => void;
}

export default function CreateMomentSheet({ moment: initialMoment, initialPhoto, onClose }: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  // Dismiss sheet before navigating back so animation doesn't glitch
  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
    onClose();
  }, [onClose]);

  const vm = useCreateMomentViewModel({
    momentId: initialMoment?.id ?? null,
    initialMoment,
    initialPhoto,
    onClose: handleClose,
  });

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={vm.isEdit ? t('moments.create.editTitle') : t('moments.create.newTitle')}
      onSave={vm.handleSave}
      isSaving={vm.isSaving}
      onDismiss={onClose}>

      <View className="pb-[80px] pt-2">

        {/* ── Photos ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`📷  ${t('moments.create.photos')}`}
        </Caption>
        <View className="px-5 mb-4">
          <PhotoPicker
            photos={vm.photos}
            onAddFromLibrary={vm.handleAddPhotoFromLibrary}
            onAddFromCamera={vm.handleAddPhotoFromCamera}
            onRemove={vm.handleRemovePhoto}
          />
        </View>

        <View className="h-[1px] bg-border/40 dark:bg-darkBorder/40 mx-5 mb-4" />

        {/* ── Caption ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`✏️  ${t('moments.labels.caption')}`}
        </Caption>
        <View className="px-5 mb-4">
          <Input
            bottomSheet
            placeholder={t('moments.placeholders.caption')}
            value={vm.caption}
            onChangeText={vm.setCaption}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

      </View>
    </AppBottomSheet>
  );
}
