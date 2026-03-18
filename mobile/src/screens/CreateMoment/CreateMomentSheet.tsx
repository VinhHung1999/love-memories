import React, { useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Caption, Body } from '../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import type { Moment } from '../../types';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import AppBottomSheet from '../../components/AppBottomSheet';
import Input from '../../components/Input';
import LocationPicker from '../../components/LocationPicker';
import PhotoPicker from './components/PhotoPicker';
import TagInput from './components/TagInput';
import { useAppColors } from '../../navigation/theme';

interface Props {
  moment?: Moment;
  initialPhoto?: { uri: string; mimeType?: string };
  onClose: () => void;
}

export default function CreateMomentSheet({ moment: initialMoment, initialPhoto, onClose }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
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

        {/* ── Title ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`✨  ${t('moments.labels.title')}`}
        </Caption>
        <View className="px-5 mb-4">
          <Input
            bottomSheet
            placeholder={t('moments.placeholders.title')}
            value={vm.title}
            onChangeText={vm.setTitle}
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

        <View className="h-[1px] bg-border/40 dark:bg-darkBorder/40 mx-5 mb-4" />

        {/* ── Location (auto-filled) ── */}
        <View className="px-5 mb-4">
          {vm.isLocating ? (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator size="small" color={colors.primary} />
              <Body className="text-textLight dark:text-darkTextLight text-sm">
                {t('moments.labels.detectingLocation')}
              </Body>
            </View>
          ) : (
            <LocationPicker
              location={vm.location}
              latitude={vm.latitude}
              longitude={vm.longitude}
              onLocationChange={vm.handleLocationChange}
              label={t('moments.labels.location')}
            />
          )}
        </View>

        <View className="h-[1px] bg-border/40 dark:bg-darkBorder/40 mx-5 mb-4" />

        {/* ── Tags ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`🏷️  ${t('moments.labels.tags')}`}
        </Caption>
        <View className="px-5 mb-4">
          <TagInput
            tags={vm.tags}
            tagInput={vm.tagInput}
            onChangeTagInput={vm.setTagInput}
            onAddTag={vm.handleAddTag}
            onRemoveTag={vm.handleRemoveTag}
          />
        </View>

        <View className="h-[1px] bg-border/40 dark:bg-darkBorder/40 mx-5 mb-4" />

        {/* ── Spotify URL ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`🎵  ${t('moments.labels.spotifyUrl')}`}
        </Caption>
        <View className="px-5 mb-4">
          <Input
            bottomSheet
            placeholder={t('moments.placeholders.spotifyUrl')}
            value={vm.spotifyUrl}
            onChangeText={vm.setSpotifyUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

      </View>
    </AppBottomSheet>
  );
}
