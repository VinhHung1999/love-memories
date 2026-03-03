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
import AlertModal from '../../components/AlertModal';
import AppBottomSheet from '../../components/AppBottomSheet';
import FieldLabel from '../../components/FieldLabel';
import Input from '../../components/Input';
import TagInput from './components/TagInput';
import AudioRecorder from './components/AudioRecorder';
import PhotoPicker from './components/PhotoPicker';

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
          isSaving={vm.isSaving}
          onDismiss={vm.resetForm}>

          <View className="pb-[60px] pt-2">

            {/* Upload progress banner */}
            {vm.uploadProgress ? (
              <View className="mx-5 mb-3 px-4 py-2.5 rounded-2xl flex-row items-center gap-3 bg-primary/12">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm text-primary font-medium flex-1">
                  Uploading {vm.uploadProgress.done}/{vm.uploadProgress.total} photos...
                </Text>
              </View>
            ) : null}

            {/* ── Photos ── */}
            <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
              {`📷  ${t.moments.create.photos}`}
            </Text>
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
            <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
              {`✏️  ${t.moments.create.details}`}
            </Text>
            <View className="px-5">
              <FieldLabel>{`${t.moments.labels.title} *`}</FieldLabel>
              <Input
                placeholder={t.moments.placeholders.title}
                value={vm.title}
                onChangeText={vm.setTitle}
                maxLength={200}
              />

              <FieldLabel>{t.moments.labels.caption}</FieldLabel>
              <Input
                placeholder={t.moments.placeholders.caption}
                value={vm.caption}
                onChangeText={vm.setCaption}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Date */}
              <View className="mb-3">
                <FieldLabel>{t.moments.labels.date}</FieldLabel>
                <Pressable
                  onPress={() => vm.setShowDatePicker(true)}
                  className="flex-row items-center gap-2 rounded-2xl border-[1.5px] border-border px-[18px] h-[50px] bg-inputBg">
                  <Icon name="calendar-outline" size={18} color={colors.textLight} />
                  <Text className="text-base text-textDark flex-1">
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
              </View>

              {/* Location */}
              <View className="mb-4">
                <FieldLabel>{t.moments.labels.location}</FieldLabel>
                <View className="flex-row items-center rounded-2xl border-[1.5px] border-border px-[14px] h-[50px] bg-inputBg">
                  <Icon name="map-marker-outline" size={18} color={colors.textLight} />
                  <TextInput
                    className="flex-1 text-base text-textDark px-2"
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
              </View>
            </View>

            <View className="h-[1px] bg-border/40 mx-5 mb-4" />

            {/* ── Tags ── */}
            <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
              {`🏷️  ${t.moments.labels.tags}`}
            </Text>
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
            <Text className="text-[11px] font-bold text-textLight tracking-[0.8px] uppercase px-5 mb-2">
              {`🎵  ${t.moments.create.songAndMemo}`}
            </Text>
            <View className="px-5">
              <FieldLabel>{t.moments.labels.spotifyUrl}</FieldLabel>
              <Input
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

        <AlertModal {...vm.alert} onDismiss={vm.dismissAlert} />
      </>
    );
  },
);

CreateMomentSheet.displayName = 'CreateMomentSheet';
export default CreateMomentSheet;
