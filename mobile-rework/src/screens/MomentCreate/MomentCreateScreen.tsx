import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Calendar, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SafeScreen } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import { useMomentCreateViewModel } from './useMomentCreateViewModel';

// T378 (Sprint 62) — create a new moment. Single scrollable screen (Boss
// chose 1-screen over multi-step wizard). Header has close (left) · title
// (center) · save (right). Photos render in a 3-col grid with a trailing "+"
// cell when under the cap. Description is a flexible multiline field, date
// defaults to today and never accepts future dates (BE enforces too).
//
// Submit flow: tap Lưu → await POST /api/moments → router.dismiss() → each
// photo fires off to uploadQueue so the composer never blocks on uploads.
// Global UploadProgressToast (app/_layout.tsx) renders progress across
// whatever screen the user navigates to next.

type Props = {
  initialPhotos: string[];
};

export function MomentCreateScreen({ initialPhotos }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const vm = useMomentCreateViewModel(initialPhotos);

  const [pickingDate, setPickingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState<Date>(vm.takenAt);

  const onClose = () => router.back();

  const onSave = async () => {
    const result = await vm.onSubmit();
    if (result.ok) {
      // Fire-and-forget uploads continue in uploadQueue. Back out of the
      // modal immediately so the user sees their Dashboard card appear.
      router.back();
      return;
    }
    Alert.alert(t('compose.momentCreate.submitError'));
  };

  const openDatePicker = () => {
    setDateDraft(vm.takenAt);
    setPickingDate(true);
  };

  const onAndroidDate = (event: DateTimePickerEvent, picked?: Date) => {
    setPickingDate(false);
    if (event.type === 'set' && picked) vm.setTakenAt(picked);
  };

  const onIosDateChange = (_event: DateTimePickerEvent, picked?: Date) => {
    if (picked) setDateDraft(picked);
  };

  const closeIosPicker = () => setPickingDate(false);
  const confirmIosPicker = () => {
    vm.setTakenAt(dateDraft);
    setPickingDate(false);
  };

  const dateLabel = formatDate(vm.takenAt, i18n.language);
  const isToday = sameDay(vm.takenAt, new Date());

  return (
    <SafeScreen edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-1 pb-3 border-b border-line-on-surface/70">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('compose.momentCreate.close')}
          className="w-10 h-10 rounded-2xl bg-surface border border-line-on-surface items-center justify-center active:opacity-80"
        >
          <X size={18} strokeWidth={2.3} color={c.ink} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="font-displayMedium text-ink text-[18px] leading-[22px] flex-1 text-center mx-3"
        >
          {t('compose.momentCreate.title')}
        </Text>
        <Pressable
          onPress={onSave}
          disabled={!vm.canSubmit}
          accessibilityRole="button"
          accessibilityLabel={t('compose.momentCreate.save')}
          className={`h-10 px-5 rounded-full items-center justify-center ${
            vm.canSubmit ? 'bg-primary active:bg-primary-deep' : 'bg-surface-alt'
          }`}
        >
          <Text
            className={`font-bodySemibold text-[14px] ${
              vm.canSubmit ? 'text-white' : 'text-ink-mute'
            }`}
          >
            {t('compose.momentCreate.save')}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-10"
        >
          {/* Photos */}
          <View className="px-4 pt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px]">
                {t('compose.momentCreate.photosLabel')}
              </Text>
              <Text className="font-body text-ink-mute text-[11px]">
                {t('compose.momentCreate.photosCount', { count: vm.photos.length })}
              </Text>
            </View>
            <View className="flex-row flex-wrap -mx-1">
              {vm.photos.map((uri) => (
                <View key={uri} className="w-1/3 p-1">
                  <View className="aspect-square rounded-2xl overflow-hidden bg-surface-alt relative">
                    <Image source={{ uri }} className="w-full h-full" />
                    <Pressable
                      onPress={() => vm.removePhoto(uri)}
                      accessibilityRole="button"
                      accessibilityLabel={t('compose.momentCreate.removePhoto')}
                      hitSlop={6}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/70 items-center justify-center"
                    >
                      <X size={12} strokeWidth={2.5} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>
              ))}
              {vm.photos.length < vm.limits.max ? (
                <View className="w-1/3 p-1">
                  <Pressable
                    onPress={vm.addMorePhotos}
                    accessibilityRole="button"
                    accessibilityLabel={t('compose.momentCreate.addMore')}
                    className="aspect-square rounded-2xl border-[1.5px] border-dashed border-line-on-surface items-center justify-center bg-surface active:opacity-80"
                  >
                    <Plus size={22} color={c.primary} strokeWidth={2} />
                    <Text className="mt-1.5 font-bodyMedium text-ink-mute text-[11px]">
                      {t('compose.momentCreate.addMore')}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {/* Description */}
          <View className="px-4 pt-6">
            <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-2 pl-1">
              {t('compose.momentCreate.descriptionLabel')}
            </Text>
            <View className="rounded-2xl bg-surface border border-line-on-surface px-4 py-3.5 min-h-[140px]">
              <TextInput
                value={vm.description}
                onChangeText={vm.setDescription}
                placeholder={t('compose.momentCreate.descriptionPlaceholder')}
                placeholderTextColor={c.inkMute}
                multiline
                maxLength={vm.limits.descriptionMax}
                textAlignVertical="top"
                className="font-body text-ink text-[15px] leading-[22px] min-h-[112px]"
              />
            </View>
          </View>

          {/* Date */}
          <View className="px-4 pt-6">
            <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-2 pl-1">
              {t('compose.momentCreate.dateLabel')}
            </Text>
            <Pressable
              onPress={openDatePicker}
              accessibilityRole="button"
              className="flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border border-line-on-surface active:opacity-90"
            >
              <Calendar size={18} color={c.primary} strokeWidth={2} />
              <Text className="flex-1 font-bodyMedium text-ink text-[15px] ml-3">
                {dateLabel}
              </Text>
              {isToday ? (
                <Text className="font-body text-ink-mute text-[12px]">
                  {t('compose.momentCreate.dateToday')}
                </Text>
              ) : null}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Android date picker — inline native dialog */}
      {pickingDate && Platform.OS === 'android' ? (
        <DateTimePicker
          value={dateDraft}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onAndroidDate}
        />
      ) : null}

      {/* iOS date picker — bottom sheet with spinner + Done */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={pickingDate}
          transparent
          animationType="fade"
          onRequestClose={closeIosPicker}
        >
          <Pressable onPress={closeIosPicker} className="flex-1 bg-black/40 justify-end">
            <Pressable
              onPress={() => {}}
              className="bg-surface rounded-t-[24px]"
            >
              <SafeAreaView edges={['bottom']}>
                <View className="flex-row items-center justify-between px-5 pt-4 pb-2 border-b border-line-on-surface">
                  <Pressable onPress={closeIosPicker} hitSlop={8}>
                    <Text className="font-bodyMedium text-ink-mute text-[15px]">
                      {t('common.cancel')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={confirmIosPicker} hitSlop={8}>
                    <Text className="font-bodyBold text-primary-deep text-[15px]">
                      {t('compose.momentCreate.datePickerConfirm')}
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={dateDraft}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={onIosDateChange}
                />
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeScreen>
  );
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date, locale: string) {
  const lang = locale.startsWith('vi') ? 'vi-VN' : 'en-US';
  try {
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}
