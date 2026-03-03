import React, { forwardRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import { Card, CardTitle } from '../../components/Card';
import AlertModal from '../../components/AlertModal';
import AppBottomSheet from '../../components/AppBottomSheet';
import TagInput from './components/TagInput';
import AudioRecorder from './components/AudioRecorder';
import PhotoPicker from './components/PhotoPicker';

// ── Local field layout helper ──────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-[10px] font-semibold text-textLight tracking-[0.5px] uppercase mb-1.5">
        {label}
      </Text>
      {children}
    </View>
  );
}

// ── Sheet ──────────────────────────────────────────────────────────────────────

interface Props {
  momentId?: string | null;
  onSuccess?: () => void;
}

const CreateMomentSheet = forwardRef<BottomSheetModal, Props>(
  ({ momentId, onSuccess }, ref) => {
    const colors = useAppColors();

    const handleClose = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [ref]);

    const vm = useCreateMomentViewModel({
      momentId: momentId ?? null,
      onClose: () => {
        handleClose();
        onSuccess?.();
      },
    });

    return (
      <>
        <AppBottomSheet
          ref={ref}
          scrollable
          title={vm.isEdit ? t.moments.create.editTitle : t.moments.create.newTitle}
          onSave={vm.handleSave}
          isSaving={vm.isSaving}>

          <View className="pb-[60px] pt-1">

            {/* Upload progress banner */}
            {vm.uploadProgress ? (
              <View className="mx-4 mb-3 px-4 py-2.5 rounded-2xl flex-row items-center gap-3 bg-primary/12">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm text-primary font-medium flex-1">
                  Uploading {vm.uploadProgress.done}/{vm.uploadProgress.total} photos...
                </Text>
              </View>
            ) : null}

            {/* Photos */}
            <Card>
              <CardTitle>{`📷  ${t.moments.create.photos}`}</CardTitle>
              <PhotoPicker
                photos={vm.photos}
                onAddFromLibrary={vm.handleAddPhotoFromLibrary}
                onAddFromCamera={vm.handleAddPhotoFromCamera}
                onRemove={vm.handleRemovePhoto}
              />
            </Card>

            {/* Details */}
            <Card>
              <CardTitle>{`✏️  ${t.moments.create.details}`}</CardTitle>

              <Field label={`${t.moments.labels.title} *`}>
                <TextInput
                  className="bg-textDark/4 rounded-xl px-3 py-[10px] text-[14px] text-textDark"
                  placeholder={t.moments.placeholders.title}
                  placeholderTextColor={colors.textLight}
                  value={vm.title}
                  onChangeText={vm.setTitle}
                  maxLength={200}
                />
              </Field>

              <Field label={t.moments.labels.caption}>
                <TextInput
                  className="bg-textDark/4 rounded-xl px-3 py-[10px] text-[14px] text-textDark min-h-[72px]"
                  placeholder={t.moments.placeholders.caption}
                  placeholderTextColor={colors.textLight}
                  value={vm.caption}
                  onChangeText={vm.setCaption}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Field>

              <Field label={t.moments.labels.date}>
                <Pressable
                  onPress={() => vm.setShowDatePicker(true)}
                  className="flex-row items-center gap-2 rounded-xl px-3 py-2.5 bg-textDark/4">
                  <Icon name="calendar-outline" size={18} color={colors.textLight} />
                  <Text className="text-sm text-textDark flex-1">
                    {vm.date.toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </Text>
                  <Icon name="chevron-right" size={16} color={colors.textLight} />
                </Pressable>
                {vm.showDatePicker && (
                  <DateTimePicker
                    value={vm.date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={vm.handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </Field>

              {/* Location field with GPS button */}
              <Field label={t.moments.labels.location}>
                <View className="flex-row items-center rounded-xl px-3 bg-textDark/4">
                  <Icon name="map-marker-outline" size={18} color={colors.textLight} />
                  <TextInput
                    className="flex-1 text-[14px] py-[10px] px-2 text-textDark"
                    placeholder={t.moments.create.addLocation}
                    placeholderTextColor={colors.textLight}
                    value={vm.location}
                    onChangeText={vm.setLocation}
                  />
                  <TouchableOpacity
                    onPress={vm.handleGetCurrentLocation}
                    disabled={vm.isGettingLocation}
                    className={`w-8 h-8 rounded-full items-center justify-center ml-1 ${
                      vm.isGettingLocation ? 'bg-transparent' : 'bg-primary/12'
                    }`}>
                    {vm.isGettingLocation
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Icon name="crosshairs-gps" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                </View>
              </Field>
            </Card>

            {/* Tags */}
            <Card>
              <CardTitle>{`🏷️  ${t.moments.labels.tags}`}</CardTitle>
              <TagInput
                tags={vm.tags}
                tagInput={vm.tagInput}
                onChangeTagInput={vm.setTagInput}
                onAddTag={vm.handleAddTag}
                onRemoveTag={vm.handleRemoveTag}
              />
            </Card>

            {/* Song + Voice Memo */}
            <Card>
              <CardTitle>{`🎵  ${t.moments.create.songAndMemo}`}</CardTitle>
              <Field label={t.moments.labels.spotifyUrl}>
                <TextInput
                  className="bg-textDark/4 rounded-xl px-3 py-[10px] text-[14px] text-textDark"
                  placeholder={t.moments.placeholders.spotifyUrl}
                  placeholderTextColor={colors.textLight}
                  value={vm.spotifyUrl}
                  onChangeText={vm.setSpotifyUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </Field>
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
            </Card>

          </View>
        </AppBottomSheet>

        <AlertModal {...vm.alert} onDismiss={vm.dismissAlert} />
      </>
    );
  },
);

CreateMomentSheet.displayName = 'CreateMomentSheet';
export default CreateMomentSheet;
