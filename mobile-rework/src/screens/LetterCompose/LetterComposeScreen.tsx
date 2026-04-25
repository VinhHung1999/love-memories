import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Clock, Send, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient, SafeScreen } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import { formatScheduleDate } from '../Letters/relativeAgo';
import {
  AttachmentChips,
  AudioPreview,
  AudioRecordSheet,
  type AudioRecordSheetHandle,
  DiscardSheet,
  type DiscardSheetHandle,
  MoodPicker,
  PhotoPreviewRow,
  ScheduleSheet,
  type ScheduleSheetHandle,
} from './components';
import {
  useLetterComposeViewModel,
  type ComposeParams,
} from './useLetterComposeViewModel';

// T423 (Sprint 65) — Letter Compose screen. Replaces the T421 placeholder.
// Layout follows prototype `letters.jsx` L433-549:
//
//   ScreenHeader (close icon + title + subtitle + Send/Schedule pill)
//   ─────────────────────────────────────────
//   To pill (read-only "Gửi đến {partner}")
//   MoodPicker (8 emoji 44×44)
//   Title input (display 20)
//   Body textarea (body 14, min 200)
//   "Viết tiếp…" Dancing Script hint
//   AttachmentChips (Ảnh / Giọng nói / Hẹn gửi)
//   PhotoPreviewRow (only when photos)
//   AudioPreview    (only when audio)
//   ScheduleStatus  (only when scheduledAt set)
//
// Spec validation: cần ít nhất title.trim() OR content.trim() trước khi Send.
// Send pill text/icon flips Gửi ↔ Hẹn gửi based on scheduledAt.
//
// Back press: empty draft → DELETE + back. Dirty draft → DiscardSheet.

type Props = {
  params: ComposeParams;
};

export function LetterComposeScreen({ params }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const locale = i18n.language;

  const audioSheetRef = useRef<AudioRecordSheetHandle>(null);
  const scheduleSheetRef = useRef<ScheduleSheetHandle>(null);
  const discardSheetRef = useRef<DiscardSheetHandle>(null);

  const vm = useLetterComposeViewModel(params);

  const [toast, setToast] = useState<string | null>(null);

  const partnerName = vm.partnerName ?? t('letters.partnerFallback');
  const isScheduling = vm.scheduledAt !== null;

  const onBackPress = useCallback(() => {
    if (vm.dirty) {
      discardSheetRef.current?.open();
      return true;
    }
    void vm.discardDraft().finally(() => {
      router.back();
    });
    return true;
  }, [router, vm]);

  // Hardware back (Android) + iOS edge-swipe behaviour falls back to default.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [onBackPress]),
  );

  const onSubmit = useCallback(async () => {
    const result = await vm.submit();
    if (!result.ok) {
      const reason = result.reason;
      setToast(t(`letters.compose.toast.error.${reason}`));
      setTimeout(() => setToast(null), 2200);
      return;
    }
    if (result.mode === 'scheduled') {
      setToast(
        t('letters.compose.toast.scheduled', {
          date: formatScheduleDate(result.date.toISOString(), locale),
        }),
      );
    } else {
      setToast(
        t('letters.compose.toast.sent', { partner: partnerName }),
      );
    }
    setTimeout(() => router.back(), 1400);
  }, [locale, partnerName, router, t, vm]);

  const onConfirmSchedule = useCallback(
    (date: Date) => {
      void vm.setScheduledAt(date);
    },
    [vm],
  );

  const onClearSchedule = useCallback(() => {
    void vm.setScheduledAt(null);
  }, [vm]);

  if (vm.loading) {
    return (
      <SafeScreen edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.primary} />
        </View>
      </SafeScreen>
    );
  }

  if (vm.error || !vm.draftId) {
    return (
      <SafeScreen edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-bodyMedium text-ink text-[15px] text-center">
            {t('letters.compose.error.message')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-5 px-5 h-10 rounded-full bg-surface border border-line-on-surface items-center justify-center active:opacity-80"
          >
            <Text className="font-bodySemibold text-ink text-[14px]">
              {t('letters.compose.error.back')}
            </Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <View className="flex-row items-center justify-between gap-3 px-4 pt-2 pb-3">
          <Pressable
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="w-10 h-10 rounded-2xl bg-surface border border-line-on-surface items-center justify-center shadow-chip active:opacity-80"
          >
            <X size={18} strokeWidth={2.4} color={c.ink} />
          </Pressable>
          <View className="flex-1 min-w-0">
            <Text
              className="font-displayMedium text-ink text-[22px] leading-[24px]"
              numberOfLines={1}
            >
              {t('letters.compose.title')}
            </Text>
            <Text
              className="font-body text-ink-mute text-[12px] mt-0.5"
              numberOfLines={1}
            >
              {t('letters.compose.subtitle', { partner: partnerName })}
            </Text>
          </View>
          <Pressable
            onPress={onSubmit}
            disabled={!vm.canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !vm.canSubmit }}
            className="flex-row items-center gap-1.5 h-10 px-4 rounded-full active:opacity-90"
            style={{
              backgroundColor: vm.canSubmit ? c.primary : c.surfaceAlt,
              opacity: vm.canSubmit ? 1 : 0.7,
            }}
          >
            {isScheduling ? (
              <Clock size={14} strokeWidth={2.4} color="#ffffff" />
            ) : (
              <Send size={14} strokeWidth={2.4} color="#ffffff" />
            )}
            <Text className="font-bodyBold text-white text-[13px]">
              {isScheduling
                ? t('letters.compose.scheduleCta')
                : t('letters.compose.sendCta')}
            </Text>
            <ChevronRight size={12} strokeWidth={2.6} color="#ffffff" />
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* To pill */}
          <View className="flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-surface border border-line-on-surface">
            <Text className="font-bodyBold text-ink-mute text-[12px]">
              {t('letters.compose.to')}
            </Text>
            <View className="flex-row items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-surface-alt">
              <LinearGradient
                colors={[c.secondary, c.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-5 h-5 rounded-full items-center justify-center"
              >
                <Text className="font-bodyBold text-white text-[10px] leading-[12px]">
                  {(partnerName.trim().charAt(0) || '·').toUpperCase()}
                </Text>
              </LinearGradient>
              <Text className="font-bodySemibold text-ink text-[13px]">
                {partnerName}
              </Text>
            </View>
          </View>

          <MoodPicker
            label={t('letters.compose.moodLabel')}
            active={vm.mood}
            onSelect={vm.setMood}
          />

          <View className="mt-4 rounded-2xl bg-surface border border-line-on-surface px-4 py-3.5">
            <TextInput
              value={vm.title}
              onChangeText={vm.setTitle}
              placeholder={t('letters.compose.titlePlaceholder')}
              placeholderTextColor={c.inkMute}
              className="font-displayMedium text-ink text-[20px]"
              maxLength={120}
            />
            <View
              className="h-px my-3"
              style={{ backgroundColor: c.lineOnSurface }}
            />
            <TextInput
              value={vm.content}
              onChangeText={vm.setContent}
              placeholder={t('letters.compose.bodyPlaceholder')}
              placeholderTextColor={c.inkMute}
              multiline
              textAlignVertical="top"
              className="font-body text-ink text-[14px] leading-[22px] min-h-[200px]"
            />
            <Text className="mt-2 font-script text-ink-mute text-[26px] leading-[28px]">
              {t('letters.compose.continueHint')}
            </Text>
          </View>

          <AttachmentChips
            photosLabel={t('letters.compose.attach.photos')}
            audioLabel={t('letters.compose.attach.audio')}
            scheduleLabel={t('letters.compose.attach.schedule')}
            hasPhotos={vm.photos.length > 0}
            hasAudio={vm.audio !== null}
            hasSchedule={vm.scheduledAt !== null}
            photosDisabled={vm.photosRemaining <= 0}
            onPhotos={() => void vm.pickPhotos()}
            onAudio={() => audioSheetRef.current?.open()}
            onSchedule={() => scheduleSheetRef.current?.open(vm.scheduledAt)}
          />

          <PhotoPreviewRow
            photos={vm.photos}
            remaining={vm.photosRemaining}
            max={vm.maxPhotos}
            counterLabel={t('letters.compose.photoCounter')}
            onRemove={(id) => void vm.removePhoto(id)}
          />

          {vm.audio ? (
            <AudioPreview
              audio={vm.audio}
              onRemove={() => void vm.removeAudio()}
            />
          ) : null}

          {vm.scheduledAt ? (
            <View
              className="mt-3 flex-row items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-accent-soft"
              style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.accent }}
            >
              <Clock size={14} strokeWidth={2.2} color={c.accent} />
              <Text className="flex-1 font-bodySemibold text-ink text-[12px]">
                {t('letters.compose.scheduledFor', {
                  date: formatScheduleDate(
                    vm.scheduledAt.toISOString(),
                    locale,
                  ),
                })}
              </Text>
              <Pressable onPress={onClearSchedule} accessibilityRole="button">
                <Text className="font-bodyBold text-primary text-[11px] uppercase tracking-wider">
                  {t('letters.compose.scheduleClear')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        {toast ? (
          <View
            pointerEvents="none"
            className="absolute left-6 right-6 items-center"
            style={{ bottom: insets.bottom + 80 }}
          >
            <View
              className="px-4 py-3 rounded-2xl"
              style={{ backgroundColor: c.ink }}
            >
              <Text
                className="font-bodyBold text-[13px] text-center"
                style={{ color: c.bg }}
              >
                {toast}
              </Text>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <AudioRecordSheet
        ref={audioSheetRef}
        title={t('letters.compose.audioSheet.title')}
        hint={t('letters.compose.audioSheet.hint')}
        startLabel={t('letters.compose.audioSheet.start')}
        stopLabel={t('letters.compose.audioSheet.stop')}
        permDeniedLabel={t('letters.compose.audioSheet.permDenied')}
        onComplete={(uri, durationMs) =>
          void vm.setAudioFromRecording(uri, durationMs)
        }
      />
      <ScheduleSheet
        ref={scheduleSheetRef}
        title={t('letters.compose.scheduleSheet.title')}
        hint={t('letters.compose.scheduleSheet.hint')}
        confirmLabel={t('letters.compose.scheduleSheet.confirm')}
        clearLabel={t('letters.compose.scheduleSheet.clear')}
        cancelLabel={t('letters.compose.scheduleSheet.cancel')}
        onConfirm={onConfirmSchedule}
        onClear={onClearSchedule}
      />
      <DiscardSheet
        ref={discardSheetRef}
        title={t('letters.compose.discardSheet.title')}
        body={t('letters.compose.discardSheet.body')}
        saveLabel={t('letters.compose.discardSheet.save')}
        discardLabel={t('letters.compose.discardSheet.discard')}
        cancelLabel={t('letters.compose.discardSheet.cancel')}
        onSave={() => {
          void vm.saveDraftAndExit().finally(() => router.back());
        }}
        onDiscard={() => {
          void vm.discardDraft().finally(() => router.back());
        }}
      />
    </SafeScreen>
  );
}
