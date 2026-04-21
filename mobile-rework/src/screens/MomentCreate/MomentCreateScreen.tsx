import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
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

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import { useMomentCreateViewModel } from './useMomentCreateViewModel';

// T383 (Sprint 62) — diary-style composer per
// docs/design/prototype/memoura-v2/add-moment.jsx. VM signature untouched
// from T378; this is a pure View rebuild.
//
// Layout: 280px primary-soft→bg hero gradient behind a close chip + 34px
// "Giữ lại" display title + "{date} · {partner} sẽ thấy" subtitle. Subtitle
// is tappable — opens the date picker (no separate date row, prototype
// folds date into subtitle). Below: horizontal photo strip (140×180 tilted
// polaroid style), transparent caption textarea, four static hashtag
// placeholder chips (Sprint 63 will wire tags), big pill Save button.
//
// Partner name: authStore only carries user.name; /api/couple isn't worth a
// synchronous fetch on open. Falls back to t('partnerFallback') — "nửa kia"
// / "your love" — per PO Lu 2026-04-21.

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

  const partnerName = t('compose.momentCreate.partnerFallback');

  const isToday = sameDay(vm.takenAt, new Date());
  const dateLabel = isToday
    ? t('compose.momentCreate.dateToday')
    : formatDate(vm.takenAt, i18n.language);

  const heroSubtitle = t('compose.momentCreate.heroSubtitle', {
    date: dateLabel,
    partner: partnerName,
  });
  const saveLabel = t('compose.momentCreate.savePartner', {
    partner: partnerName,
  });

  const onClose = () => router.back();

  const onSave = async () => {
    const result = await vm.onSubmit();
    if (result.ok) {
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

  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={[c.primarySoft, c.bg]}
        className="absolute left-0 right-0 top-0 h-[280px]"
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-16"
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView edges={['top']}>
            {/* Close chip (left), no header save — Save lives at end of scroll */}
            <View className="flex-row items-center px-4 pt-2 pb-2">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('compose.momentCreate.close')}
                className="w-10 h-10 rounded-2xl bg-surface border border-line-on-surface items-center justify-center shadow-chip active:opacity-80"
                hitSlop={8}
              >
                <X size={18} strokeWidth={2.3} color={c.ink} />
              </Pressable>
            </View>

            {/* Hero title + tappable subtitle (opens date picker) */}
            <View className="px-6 pt-5 pb-2">
              <Text
                className="font-display text-ink text-[34px] leading-[40px] tracking-tight"
                numberOfLines={1}
              >
                {t('compose.momentCreate.heroTitle')}
              </Text>
              <Pressable
                onPress={openDatePicker}
                accessibilityRole="button"
                accessibilityLabel={t('compose.momentCreate.dateLabel')}
                hitSlop={6}
                className="mt-2 self-start active:opacity-70"
              >
                <Text className="font-body text-ink-mute text-[13px] leading-[18px]">
                  {heroSubtitle}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Horizontal photo strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="pl-4 pr-4 pt-4 pb-2 gap-2"
          >
            {vm.photos.map((uri, i) => (
              <View
                key={uri}
                className="w-[140px] h-[180px] rounded-[18px] overflow-hidden bg-surface-alt shadow-hero"
                style={{ transform: [{ rotate: i % 2 === 0 ? '-1deg' : '1.2deg' }] }}
              >
                <Image source={{ uri }} className="w-full h-full" />
                <Pressable
                  onPress={() => vm.removePhoto(uri)}
                  accessibilityRole="button"
                  accessibilityLabel={t('compose.momentCreate.removePhoto')}
                  hitSlop={6}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/60 items-center justify-center"
                >
                  <X size={12} strokeWidth={2.5} color="#ffffff" />
                </Pressable>
              </View>
            ))}
            {vm.photos.length < vm.limits.max ? (
              <Pressable
                onPress={vm.addMorePhotos}
                accessibilityRole="button"
                accessibilityLabel={t('compose.momentCreate.addMore')}
                className="w-[140px] h-[180px] rounded-[18px] border-[1.5px] border-dashed border-line-on-surface bg-surface items-center justify-center active:opacity-80"
              >
                <Plus size={22} strokeWidth={2} color={c.primary} />
                <Text className="mt-1.5 font-bodySemibold text-ink-mute text-[11px]">
                  {t('compose.momentCreate.photosCount', {
                    count: vm.photos.length,
                  })}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>

          {/* Caption — transparent, no border, flows with page */}
          <View className="px-6 pt-4">
            <TextInput
              value={vm.description}
              onChangeText={vm.setDescription}
              placeholder={t('compose.momentCreate.descriptionPlaceholder')}
              placeholderTextColor={c.inkMute}
              multiline
              maxLength={vm.limits.descriptionMax}
              textAlignVertical="top"
              className="font-body text-ink text-[15px] leading-[24px] min-h-[96px]"
            />
          </View>

          {/* Hashtag placeholder chips — static decoration, Sprint 63 will wire */}
          <View className="flex-row flex-wrap gap-1.5 px-4 pt-3">
            <PlaceholderChip icon="📍" label="Đà Lạt" />
            <PlaceholderChip icon="#" label="dulich" />
            <PlaceholderChip icon="#" label="capheviavn" />
            <PlaceholderChip icon="+" label="tag" dashed />
          </View>

          {/* Save button — full width pill, primary bg + primary drop shadow */}
          <View className="px-4 pt-7">
            <Pressable
              onPress={onSave}
              disabled={!vm.canSubmit}
              accessibilityRole="button"
              accessibilityLabel={saveLabel}
              className="rounded-full py-4 items-center justify-center active:opacity-90"
              style={{
                backgroundColor: vm.canSubmit ? c.primary : c.surfaceAlt,
                shadowColor: c.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: vm.canSubmit ? 0.33 : 0,
                shadowRadius: 24,
                elevation: vm.canSubmit ? 8 : 0,
              }}
            >
              <Text
                className="font-bodyBold text-[15px]"
                style={{ color: vm.canSubmit ? '#ffffff' : c.inkMute }}
              >
                {saveLabel}
              </Text>
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
          <Pressable
            onPress={closeIosPicker}
            className="flex-1 bg-black/40 justify-end"
          >
            <Pressable onPress={() => {}} className="bg-surface rounded-t-[24px]">
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
    </View>
  );
}

type ChipProps = { icon: string; label: string; dashed?: boolean };

// Decorative only — no Pressable wrapping. Sprint 63 will wire real tags.
// Dashed vs solid chip shape branches via `style` prop (NativeWind v4 rule:
// no conditional className to avoid the misleading navigation-context crash).
function PlaceholderChip({ icon, label, dashed }: ChipProps) {
  const c = useAppColors();
  return (
    <View
      className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border"
      style={{
        backgroundColor: dashed ? 'transparent' : c.surface,
        borderColor: c.lineOnSurface,
        borderStyle: dashed ? 'dashed' : 'solid',
      }}
    >
      <Text className="font-body text-ink-mute text-[12px] leading-[16px]">
        {icon}
      </Text>
      <Text className="font-bodySemibold text-ink text-[12px] leading-[16px]">
        {label}
      </Text>
    </View>
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
