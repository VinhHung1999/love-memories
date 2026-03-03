import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import TagInput from './components/TagInput';
import AudioRecorder from './components/AudioRecorder';
import PhotoPicker from './components/PhotoPicker';

// ── Form Card ──────────────────────────────────────────────────────────────────

function FormCard({ children, icon, title }: { children: React.ReactNode; icon: string; title: string }) {
  const colors = useAppColors();
  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3"
      style={{ shadowColor: colors.textDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <Text className="text-[10px] font-bold text-textLight tracking-[1.5px] uppercase mb-3">
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

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

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CreateMomentScreen() {
  const colors = useAppColors();
  const vm = useCreateMomentViewModel();

  const inputStyle = {
    backgroundColor: 'rgba(26,22,36,0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textDark,
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FDF8F5' }}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View className="flex-row items-center gap-3 px-4 py-3 bg-transparent">
          <TouchableOpacity
            onPress={vm.handleBack}
            className="w-10 h-10 rounded-2xl items-center justify-center bg-white"
            style={{ shadowColor: colors.textDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}>
            <Icon name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-textDark tracking-tight">
            {vm.isEdit ? t.moments.create.editTitle : t.moments.create.newTitle}
          </Text>
          <TouchableOpacity
            onPress={vm.handleSave}
            disabled={vm.isSaving}
            className="px-4 py-2 rounded-xl"
            style={{
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 4,
              opacity: vm.isSaving ? 0.7 : 1,
            }}>
            <Text className="text-white font-semibold text-sm">
              {vm.isSaving ? t.moments.create.saving : t.moments.create.save}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable form */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Photos */}
          <FormCard icon="📷" title={t.moments.create.photos}>
            <PhotoPicker
              photos={vm.photos}
              onAddFromLibrary={vm.handleAddPhotoFromLibrary}
              onAddFromCamera={vm.handleAddPhotoFromCamera}
              onRemove={vm.handleRemovePhoto}
            />
          </FormCard>

          {/* Details */}
          <FormCard icon="✏️" title={t.moments.create.details}>
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
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
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

            <Field label={t.moments.labels.location}>
              <Pressable
                className="flex-row items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: 'rgba(26,22,36,0.04)' }}>
                <Icon name="map-marker-outline" size={18} color={colors.textLight} />
                <TextInput
                  placeholder={t.moments.create.addLocation}
                  placeholderTextColor={colors.textLight}
                  value={vm.location}
                  onChangeText={vm.setLocation}
                  className="flex-1 text-sm text-textDark"
                  style={{ fontSize: 14 }}
                />
              </Pressable>
            </Field>
          </FormCard>

          {/* Tags */}
          <FormCard icon="🏷️" title={t.moments.labels.tags}>
            <TagInput
              tags={vm.tags}
              tagInput={vm.tagInput}
              onChangeTagInput={vm.setTagInput}
              onAddTag={vm.handleAddTag}
              onRemoveTag={vm.handleRemoveTag}
            />
          </FormCard>

          {/* Song + Voice Memo */}
          <FormCard icon="🎵" title={t.moments.create.songAndMemo}>
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
          </FormCard>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
