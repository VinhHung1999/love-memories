import React, { forwardRef, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import TagInput from './components/TagInput';
import AudioRecorder from './components/AudioRecorder';
import PhotoPicker from './components/PhotoPicker';

// ── Local layout helpers ───────────────────────────────────────────────────────

function SectionCard({ children, icon, title }: { children: React.ReactNode; icon: string; title: string }) {
  return (
    <View className="bg-white rounded-3xl px-4 pt-3 pb-4 mb-3 shadow-sm">
      <Text className="text-[10px] font-bold text-textLight tracking-[1.5px] uppercase mb-3">
        {icon}  {title}
      </Text>
      {children}
    </View>
  );
}

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

const SNAP_POINTS = ['92%'];

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

    const inputStyle = {
      backgroundColor: 'rgba(26,22,36,0.04)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textDark,
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: '#F8F5F2' }}
        handleIndicatorStyle={{ backgroundColor: colors.textLight, width: 36 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 px-5 pb-3 pt-1">
            <TouchableOpacity
              onPress={handleClose}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(26,22,36,0.06)' }}>
              <Icon name="close" size={18} color={colors.textDark} />
            </TouchableOpacity>
            <Text className="flex-1 text-base font-bold text-textDark tracking-tight">
              {vm.isEdit ? t.moments.create.editTitle : t.moments.create.newTitle}
            </Text>
            <TouchableOpacity
              onPress={vm.handleSave}
              disabled={vm.isSaving}
              className="px-4 py-2 rounded-2xl"
              style={{ backgroundColor: colors.primary, opacity: vm.isSaving ? 0.7 : 1 }}>
              <Text className="text-white font-semibold text-sm">
                {vm.isSaving ? t.moments.create.saving : t.moments.create.save}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Upload progress banner */}
          {vm.uploadProgress ? (
            <View
              className="mx-5 mb-3 px-4 py-2.5 rounded-2xl flex-row items-center gap-3"
              style={{ backgroundColor: colors.primaryMuted }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-sm text-primary font-medium flex-1">
                Uploading {vm.uploadProgress.done}/{vm.uploadProgress.total} photos...
              </Text>
            </View>
          ) : null}

          <BottomSheetScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60, paddingTop: 4 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {/* Photos */}
            <SectionCard icon="📷" title={t.moments.create.photos}>
              <PhotoPicker
                photos={vm.photos}
                onAddFromLibrary={vm.handleAddPhotoFromLibrary}
                onAddFromCamera={vm.handleAddPhotoFromCamera}
                onRemove={vm.handleRemovePhoto}
              />
            </SectionCard>

            {/* Details */}
            <SectionCard icon="✏️" title={t.moments.create.details}>
              <Field label={`${t.moments.labels.title} *`}>
                <TextInput
                  placeholder={t.moments.placeholders.title}
                  placeholderTextColor={colors.textLight}
                  value={vm.title}
                  onChangeText={vm.setTitle}
                  maxLength={200}
                  style={inputStyle}
                />
              </Field>

              <Field label={t.moments.labels.caption}>
                <TextInput
                  placeholder={t.moments.placeholders.caption}
                  placeholderTextColor={colors.textLight}
                  value={vm.caption}
                  onChangeText={vm.setCaption}
                  multiline
                  numberOfLines={3}
                  style={{ ...inputStyle, minHeight: 72, textAlignVertical: 'top' }}
                />
              </Field>

              <Field label={t.moments.labels.date}>
                <Pressable
                  onPress={() => vm.setShowDatePicker(true)}
                  className="flex-row items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: 'rgba(26,22,36,0.04)' }}>
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
                <View
                  className="flex-row items-center rounded-xl px-3"
                  style={{ backgroundColor: 'rgba(26,22,36,0.04)' }}>
                  <Icon name="map-marker-outline" size={18} color={colors.textLight} />
                  <TextInput
                    placeholder={t.moments.create.addLocation}
                    placeholderTextColor={colors.textLight}
                    value={vm.location}
                    onChangeText={vm.setLocation}
                    style={{ flex: 1, fontSize: 14, paddingVertical: 10, paddingHorizontal: 8, color: colors.textDark }}
                  />
                  <TouchableOpacity
                    onPress={vm.handleGetCurrentLocation}
                    disabled={vm.isGettingLocation}
                    className="w-8 h-8 rounded-full items-center justify-center ml-1"
                    style={{ backgroundColor: vm.isGettingLocation ? 'transparent' : colors.primaryMuted }}>
                    {vm.isGettingLocation
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Icon name="crosshairs-gps" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                </View>
              </Field>
            </SectionCard>

            {/* Tags */}
            <SectionCard icon="🏷️" title={t.moments.labels.tags}>
              <TagInput
                tags={vm.tags}
                tagInput={vm.tagInput}
                onChangeTagInput={vm.setTagInput}
                onAddTag={vm.handleAddTag}
                onRemoveTag={vm.handleRemoveTag}
              />
            </SectionCard>

            {/* Song + Voice Memo */}
            <SectionCard icon="🎵" title={t.moments.create.songAndMemo}>
              <Field label={t.moments.labels.spotifyUrl}>
                <TextInput
                  placeholder={t.moments.placeholders.spotifyUrl}
                  placeholderTextColor={colors.textLight}
                  value={vm.spotifyUrl}
                  onChangeText={vm.setSpotifyUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={inputStyle}
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
            </SectionCard>

          </BottomSheetScrollView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    );
  },
);

CreateMomentSheet.displayName = 'CreateMomentSheet';
export default CreateMomentSheet;
