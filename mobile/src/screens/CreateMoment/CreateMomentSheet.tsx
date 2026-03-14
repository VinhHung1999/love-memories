import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Caption } from '../../components/Typography';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import AppBottomSheet from '../../components/AppBottomSheet';
import DatePickerField from '../../components/DatePickerField';
import FieldLabel from '../../components/FieldLabel';
import Input from '../../components/Input';
import LocationPicker from '../../components/LocationPicker';
import TagInput from '../../components/TagInput';
import AudioRecorder from './components/AudioRecorder';
import PhotoPicker from './components/PhotoPicker';

interface Props {
  moment?: Moment;
  onClose: () => void;
}

export default function CreateMomentSheet({ moment: initialMoment, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { showBottomSheet } = useAppNavigation();

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const vm = useCreateMomentViewModel({
    momentId: initialMoment?.id ?? null,
    initialMoment,
    onClose,
  });

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={vm.isEdit ? t.moments.create.editTitle : t.moments.create.newTitle}
      onSave={vm.handleSave}
      isSaving={vm.isSaving}
      onDismiss={onClose}>

      <View className="pb-[60px] pt-2">

        {/* ── Photos ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`📷  ${t.moments.create.photos}`}
        </Caption>
        <View className="px-5 mb-4">
          <PhotoPicker
            photos={vm.photos}
            onAddFromLibrary={vm.handleAddPhotoFromLibrary}
            onAddFromCamera={vm.handleAddPhotoFromCamera}
            onRemove={vm.handleRemovePhoto}
          />
        </View>

        <View className="h-[1px] bg-border/40 mx-5 mb-4" />

        {/* ── Details ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`✏️  ${t.moments.create.details}`}
        </Caption>
        <View className="px-5">
          <FieldLabel>{`${t.moments.labels.title} *`}</FieldLabel>
          <Input
            bottomSheet
            placeholder={t.moments.placeholders.title}
            value={vm.title}
            onChangeText={vm.setTitle}
            maxLength={200}
          />

          <FieldLabel>{t.moments.labels.caption}</FieldLabel>
          <Input
            bottomSheet
            placeholder={t.moments.placeholders.caption}
            value={vm.caption}
            onChangeText={vm.setCaption}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <DatePickerField
            label={t.moments.labels.date}
            value={vm.date}
            onChange={vm.setDate}
            maximumDate={new Date()}
            showBottomSheet={showBottomSheet}
          />

          <LocationPicker
            label={t.moments.labels.location}
            location={vm.location}
            latitude={vm.latitude}
            longitude={vm.longitude}
            onLocationChange={vm.handleLocationChange}
          />
        </View>

        <View className="h-[1px] bg-border/40 mx-5 mb-4" />

        {/* ── Tags ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`🏷️  ${t.moments.labels.tags}`}
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

        <View className="h-[1px] bg-border/40 mx-5 mb-4" />

        {/* ── Song + Voice Memo ── */}
        <Caption className="tracking-[0.8px] uppercase px-5 mb-2">
          {`🎵  ${t.moments.create.songAndMemo}`}
        </Caption>
        <View className="px-5">
          <FieldLabel>{t.moments.labels.spotifyUrl}</FieldLabel>
          <Input
            bottomSheet
            placeholder={t.moments.placeholders.spotifyUrl}
            value={vm.spotifyUrl}
            onChangeText={vm.setSpotifyUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <AudioRecorder
            isRecording={vm.isRecording}
            recordedPath={vm.recordedAudioPath}
            recordingDuration={vm.recordingDuration}
            isPlayingPreview={vm.isPlayingPreview}
            onStartRecording={vm.handleStartRecording}
            onStopRecording={vm.handleStopRecording}
            onPlayPreview={vm.handlePlayPreview}
            onDelete={vm.handleDeleteAudio}
          />
        </View>

      </View>
    </AppBottomSheet>
  );
}
