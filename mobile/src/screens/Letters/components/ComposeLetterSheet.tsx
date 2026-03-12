import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import { Check, Clock, ImagePlus, Mail, Mic, Trash2, X } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import AppBottomSheet from '../../../components/AppBottomSheet';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import FieldLabel from '../../../components/FieldLabel';
import ErrorBox from '../../../components/ErrorBox';
import { useComposeLetterViewModel, MOODS } from './useComposeLetterViewModel';
import type { LoveLetter } from '../../../types';

const MOOD_EMOJI: Record<string, string> = {
  love: '❤️', happy: '😊', miss: '🥺', grateful: '🙏', playful: '😄', romantic: '🌹',
};

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatScheduledAt(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function ComposeLetterSheet({
  onClose,
  initialLetter,
}: {
  onClose: () => void;
  initialLetter?: LoveLetter;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useAppColors();
  const vm = useComposeLetterViewModel(onClose, initialLetter);

  useEffect(() => { sheetRef.current?.present(); }, []);

  return (
    <AppBottomSheet
      ref={sheetRef}
      scrollable
      title={initialLetter ? t.loveLetters.editTitle : t.loveLetters.composeTitle}
      icon={Mail}
      subtitle={initialLetter ? t.loveLetters.editSubtitle : t.loveLetters.composeSubtitle}
      actionLabel={t.loveLetters.sendNow}
      onAction={vm.sendNow}
      actionLoading={vm.isSending}
      actionDisabled={!vm.isValid || vm.isSaving || vm.isSending}
      onDismiss={onClose}>

      <View className="px-5 pb-10 pt-4">
        {vm.error ? <ErrorBox message={vm.error} /> : null}

        {/* Title */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.titleLabel}</FieldLabel>
          <Input
            value={vm.title}
            onChangeText={vm.setTitle}
            placeholder={t.loveLetters.titlePlaceholder}
            returnKeyType="next"
          />
        </View>

        {/* Content */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.contentLabel}</FieldLabel>
          <Input
            value={vm.content}
            onChangeText={vm.setContent}
            placeholder={t.loveLetters.contentPlaceholder}
            multiline
            numberOfLines={8}
            style={{ minHeight: 160, textAlignVertical: 'top' }}
          />
        </View>

        {/* ── Photos section ── */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.photosLabel}</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 mt-1">
              {vm.pendingPhotos.map(photo => (
                <View key={photo.localId} className="relative">
                  <FastImage
                    source={{ uri: photo.uri }}
                    style={{ width: 72, height: 72, borderRadius: 12 }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <Pressable
                    onPress={() => vm.handleRemovePhoto(photo.localId)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error items-center justify-center">
                    <X size={11} strokeWidth={1.5} />
                  </Pressable>
                </View>
              ))}
              {vm.pendingPhotos.length < vm.maxPhotos ? (
                <Pressable
                  onPress={vm.handleAddPhoto}
                  className="w-[72px] h-[72px] rounded-xl border border-dashed border-primary/30 items-center justify-center mt-0"
                  style={{ backgroundColor: colors.primaryMuted + '33' }}>
                  <ImagePlus size={22} color={colors.primary} strokeWidth={1.5} />
                  <Text className="text-[10px] text-primary mt-0.5">
                    {vm.pendingPhotos.length}/{vm.maxPhotos}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>

        {/* ── Voice memo section ── */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.voiceMemoLabel}</FieldLabel>
          {vm.recordedAudioPath ? (
            /* Recorded — show playback controls */
            <View className="flex-row items-center gap-3 p-3 rounded-2xl bg-accent/10 border border-accent/20 mt-1">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-accent">
                <Check size={18} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-textDark">Voice memo recorded</Text>
                <Text className="text-xs text-textLight mt-0.5">
                  {formatSecs(vm.recordingDuration)} · m4a
                </Text>
              </View>
              <Pressable onPress={vm.handleDeleteAudio} hitSlop={8}>
                <Trash2 size={18} color={colors.textLight} strokeWidth={1.5} />
              </Pressable>
            </View>
          ) : (
            /* Record button */
            <TouchableOpacity
              onPress={vm.isRecording ? vm.handleStopRecording : vm.handleStartRecording}
              className="flex-row items-center gap-3 p-3 rounded-2xl border mt-1"
              style={{
                backgroundColor: vm.isRecording ? colors.primary + '14' : colors.accent + '1A',
                borderColor: vm.isRecording ? colors.primary + '4D' : colors.accent + '33',
              }}>
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: vm.isRecording ? colors.primary : colors.accent }}>
                {vm.isRecording ? (
                  <View className="w-3.5 h-3.5 rounded bg-white" />
                ) : (
                  <Mic size={18} strokeWidth={1.5} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-textDark">
                  {vm.isRecording ? t.loveLetters.recording : t.loveLetters.recordMemo}
                </Text>
                <Text className="text-xs text-textLight mt-0.5">
                  {vm.isRecording
                    ? `${formatSecs(vm.recordingDuration)} · ${t.loveLetters.stopRecording}`
                    : t.loveLetters.recordHint}
                </Text>
              </View>
              {vm.isRecording ? (
                <View className="w-2 h-2 rounded-full bg-primary" />
              ) : null}
            </TouchableOpacity>
          )}
        </View>

        {/* Mood picker */}
        <View className="mb-4">
          <FieldLabel>{t.loveLetters.moodLabel}</FieldLabel>
          <View className="flex-row gap-2 flex-wrap mt-1">
            {MOODS.map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => vm.setMood(m)}
                className="items-center justify-center rounded-2xl px-2 py-2 gap-0.5"
                style={{
                  minWidth: 52,
                  backgroundColor: vm.mood === m ? colors.primaryMuted : colors.gray100,
                  borderWidth: 2,
                  borderColor: vm.mood === m ? colors.primary : 'transparent',
                }}>
                <Text className="text-2xl">{MOOD_EMOJI[m]}</Text>
                <Text
                  className="text-[10px] font-semibold capitalize"
                  style={{ color: vm.mood === m ? colors.primary : colors.textLight }}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Schedule delivery ── */}
        <View className="mb-6">
          <Pressable
            onPress={vm.toggleScheduleMode}
            className="flex-row items-center gap-3 p-4 rounded-2xl border border-border/50 bg-gray-50">
            <Clock size={20} color={vm.scheduleMode ? colors.primary : colors.textLight} strokeWidth={1.5} />
            <View className="flex-1">
              <Text
                className="text-sm font-semibold"
                style={{ color: vm.scheduleMode ? colors.primary : colors.textDark }}>
                {t.loveLetters.scheduleLabel}
              </Text>
              {vm.scheduleMode && vm.scheduledAt ? (
                <Text className="text-xs text-textMid mt-0.5">
                  {formatScheduledAt(vm.scheduledAt)}
                </Text>
              ) : (
                <Text className="text-xs text-textLight mt-0.5">Tap to set delivery time</Text>
              )}
            </View>
            <View
              className="w-10 h-6 rounded-full"
              style={{ backgroundColor: vm.scheduleMode ? colors.primary : colors.gray100 }}>
              <View
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                style={{ left: vm.scheduleMode ? 22 : 2 }}
              />
            </View>
          </Pressable>

          {vm.scheduleMode && (vm.showDatePicker || Platform.OS === 'ios') ? (
            <DateTimePicker
              value={vm.scheduledAt ?? new Date(Date.now() + 3_600_000)}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={vm.handleDateChange}
            />
          ) : null}

          {vm.scheduleMode && Platform.OS === 'android' && !vm.showDatePicker ? (
            <Pressable
              onPress={() => vm.setShowDatePicker(true)}
              className="mt-2 py-2.5 rounded-xl border border-primary/30 items-center">
              <Text className="text-sm font-semibold text-primary">
                {vm.scheduledAt
                  ? formatScheduledAt(vm.scheduledAt)
                  : 'Pick date & time'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Actions */}
        <Button
          label={t.loveLetters.saveDraft}
          loading={vm.isSaving}
          onPress={vm.saveDraft}
          variant="outline"
          disabled={!vm.isValid || vm.isSaving || vm.isSending}
        />
      </View>
    </AppBottomSheet>
  );
}
