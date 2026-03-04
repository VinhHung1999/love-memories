import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment } from '../../types';
import { useCreateMomentViewModel } from './useCreateMomentViewModel';
import AlertModal from '../../components/AlertModal';
import DatePickerField from '../../components/DatePickerField';
import FieldLabel from '../../components/FieldLabel';
import Input from '../../components/Input';
import LocationPicker from '../../components/LocationPicker';
import TagInput from '../../components/TagInput';
import AudioRecorder from './components/AudioRecorder';
import PhotoPicker from './components/PhotoPicker';

interface Props {
  moment?: Moment;
}

export default function CreateMomentForm({ moment: initialMoment }: Props) {
  const navigation = useNavigation();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  const vm = useCreateMomentViewModel({
    momentId: initialMoment?.id ?? null,
    initialMoment,
    onClose: () => navigation.goBack(),
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header ── */}
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <View
        className="flex-row items-center px-4 border-b border-border bg-white"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-9 h-9 items-center justify-center rounded-xl"
          hitSlop={8}>
          <Icon name="close" size={22} color={colors.textDark} />
        </TouchableOpacity>

        <Text className="flex-1 text-center text-base font-semibold text-textDark">
          {vm.isEdit ? t.moments.create.editTitle : t.moments.create.newTitle}
        </Text>

        <TouchableOpacity
          onPress={vm.handleSave}
          disabled={vm.isSaving}
          className={`px-4 py-2 rounded-xl ${vm.isSaving ? 'opacity-50' : ''}`}
          style={{ backgroundColor: colors.primary }}
          hitSlop={4}>
          <Text className="text-sm font-semibold text-white">
            {vm.isSaving ? t.common.loading : t.common.save}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        <View className="pt-4">

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

            <DatePickerField
              label={t.moments.labels.date}
              value={vm.date}
              onChange={vm.setDate}
              maximumDate={new Date()}
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
      </ScrollView>

      <AlertModal {...vm.alert} onDismiss={vm.dismissAlert} />
    </KeyboardAvoidingView>
  );
}
