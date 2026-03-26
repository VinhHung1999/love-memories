import React, { useCallback, useRef, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Caption, Body } from '../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, ChevronDown } from 'lucide-react-native';
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
  const [showDatePicker, setShowDatePicker] = useState(false);
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

      <View className="pb-[100px] pt-2">

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

        {/* ── Date ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`📅  ${t('moments.labels.date')}`}
        </Caption>
        <View className="px-5 mb-4">
          <Pressable
            onPress={() => setShowDatePicker(prev => !prev)}
            className="flex-row items-center gap-2 rounded-2xl border-[1.5px] border-border dark:border-darkBorder px-[18px] py-[13px] bg-inputBg dark:bg-darkInputBg">
            <Calendar size={18} color={colors.textLight} strokeWidth={1.5} />
            <Body size="lg" className="text-textDark dark:text-darkTextDark flex-1">
              {vm.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Body>
            <ChevronDown
              size={16}
              color={colors.textLight}
              strokeWidth={1.5}
              style={{ transform: [{ rotate: showDatePicker ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {showDatePicker && (
            <View className="mt-2 rounded-2xl overflow-hidden bg-inputBg dark:bg-darkInputBg">
              <DateTimePicker
                value={vm.date}
                mode="date"
                display="inline"
                onChange={(_: DateTimePickerEvent, selected?: Date) => {
                  if (selected) {
                    vm.setDate(selected);
                    setShowDatePicker(false);
                  }
                }}
                maximumDate={new Date()}
                accentColor={colors.primary}
                style={{ height: 340, width: '100%' }}
              />
            </View>
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
