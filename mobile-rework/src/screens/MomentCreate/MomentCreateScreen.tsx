import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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
import { registerCommit } from '@/screens/LocationPicker/locationPickerBus';
import { useAppColors } from '@/theme/ThemeProvider';

import { LocationPill } from './components/LocationPill';
import { useMomentCreateViewModel } from './useMomentCreateViewModel';

// T385 (Sprint 62 polish) — Boss Build 42 QA feedback pass.
// Layout change: close X + small "Giữ lại" heading share one row; 34px display
// slot becomes an explicit title TextInput ("Một cái tên…"); subtitle
// "{date} · {partner} sẽ thấy" stays on its own tappable row below the title
// input. Tag chips are now interactive — tap existing chip to remove, tap
// "+ tag" to open an entry modal.
//
// The route is promoted to `presentation: 'fullScreenModal'` via an override
// in app/(modal)/_layout.tsx so it covers the previous screen entirely and
// slides up bottom→top on iOS.
//
// NativeWind v4 rule: every runtime-varying color/shadow goes through the
// `style` prop with `useAppColors()`; className stays a single static string
// (conditional className with `active:` modifiers crashes NW v4 with a
// misleading React-Navigation-shaped error).

type Props = {
  initialPhotos: string[];
  editingMomentId?: string;
};

export function MomentCreateScreen({ initialPhotos, editingMomentId }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const vm = useMomentCreateViewModel(initialPhotos, editingMomentId);

  const [pickingDate, setPickingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState<Date>(vm.takenAt);

  // T386.9 — inline chip-input. Tap "+ tag" swaps the dashed add chip for an
  // inline TextInput in the same tags row; no stacked Modal sheet. On submit:
  // add + clear draft but stay in input mode for rapid entry. Blur with empty
  // draft exits.
  const [tagEditing, setTagEditing] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  // T412 — location picker is now a full-screen route. Push the modal and
  // register a one-shot commit callback the picker invokes on pick/clear.
  // Swipe-dismiss or X-close leaves the VM untouched (cancel path).
  const openLocationPicker = useCallback(() => {
    registerCommit((result) => {
      vm.setLocation(result);
    });
    router.push({
      pathname: '/location-picker',
      params: vm.location ? { current: vm.location } : undefined,
    });
  }, [router, vm]);

  const partnerName = t('compose.momentCreate.partnerFallback');

  const isToday = sameDay(vm.takenAt, new Date());
  const dateLabel = isToday
    ? t('compose.momentCreate.dateToday')
    : formatDate(vm.takenAt, i18n.language);

  const heroSubtitle = t('compose.momentCreate.heroSubtitle', {
    date: dateLabel,
    partner: partnerName,
  });
  const heroTitle = vm.editMode
    ? t('compose.momentCreate.editHeroTitle')
    : t('compose.momentCreate.heroTitle');
  const saveLabel = vm.editMode
    ? t('compose.momentCreate.editSaveLabel')
    : t('compose.momentCreate.savePartner', { partner: partnerName });

  const onClose = () => router.back();

  const onSave = async () => {
    const result = await vm.onSubmit();
    if (result.ok) {
      router.back();
      return;
    }
    Alert.alert(t('compose.momentCreate.submitError'));
  };

  // T397 — edit mode hydration failure (404 / network). Show the chrome +
  // inline message so the user can bail back to MomentDetail; rather than
  // a blank white screen.
  if (vm.loadError) {
    return (
      <View className="flex-1 bg-bg items-center justify-center px-8">
        <Text className="font-body text-ink text-[15px] text-center">
          {t('compose.momentCreate.editLoadError')}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          className="mt-5 px-5 h-10 rounded-full bg-surface border border-line-on-surface items-center justify-center active:opacity-80"
        >
          <Text className="font-bodySemibold text-ink text-[14px]">
            {t('compose.momentCreate.close')}
          </Text>
        </Pressable>
      </View>
    );
  }

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

  const startTagEdit = () => {
    setTagDraft('');
    setTagEditing(true);
  };
  const onTagBlur = () => {
    if (!tagDraft.trim()) setTagEditing(false);
  };
  const submitTag = () => {
    const trimmed = tagDraft.trim();
    if (!trimmed) {
      setTagEditing(false);
      return;
    }
    const result = vm.addTag(trimmed);
    if (!result.ok) {
      const msg =
        result.reason === 'empty'
          ? t('compose.momentCreate.tagEmpty')
          : result.reason === 'too_long'
            ? t('compose.momentCreate.tagTooLong', { max: vm.limits.tagMax })
            : t('compose.momentCreate.tagDuplicate');
      Alert.alert(msg);
      return;
    }
    setTagDraft('');
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
            {/* Header row — X chip + small "Giữ lại" heading share the row.
                34px display slot moved to the title input below. */}
            <View className="flex-row items-center gap-3 px-4 pt-8 pb-2">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('compose.momentCreate.close')}
                className="w-10 h-10 rounded-2xl bg-surface border border-line-on-surface items-center justify-center shadow-chip active:opacity-80"
                hitSlop={8}
              >
                <X size={18} strokeWidth={2.3} color={c.ink} />
              </Pressable>
              <Text
                className="font-displayMedium text-ink text-[20px] leading-[24px]"
                numberOfLines={1}
              >
                {heroTitle}
              </Text>
            </View>

            {/* Title input — 34px display, transparent, replaces the former
                big "Giữ lại" heading. canSubmit requires non-empty trim. */}
            <View className="px-6 pt-3">
              <TextInput
                value={vm.title}
                onChangeText={vm.setTitle}
                placeholder={t('compose.momentCreate.titlePlaceholder')}
                placeholderTextColor={c.inkMute}
                maxLength={vm.limits.titleMax}
                multiline={false}
                returnKeyType="done"
                className="font-display text-ink text-[34px] leading-[40px] tracking-tight p-0"
              />
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
                    max: vm.limits.max,
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

          {/* T399 — Location pill + interactive tag chips share one wrap row.
              Pill-first matches prototype L107-124 order (📍 before #tags).
              Tapping the pill pushes the full-screen LocationPicker route
              (T412); clearing happens inside the picker, not on the pill. */}
          <View className="flex-row flex-wrap gap-1.5 px-4 pt-3">
            <LocationPill value={vm.location} onPress={openLocationPicker} />
            {vm.tags.map((tag) => (
              <RemovableTagChip
                key={tag}
                label={tag}
                onRemove={() => vm.removeTag(tag)}
              />
            ))}
            {tagEditing ? (
              <InlineTagInput
                value={tagDraft}
                onChangeText={setTagDraft}
                onSubmit={submitTag}
                onBlur={onTagBlur}
                maxLength={vm.limits.tagMax}
              />
            ) : (
              <AddTagChip
                label={t('compose.momentCreate.tagAddLabel')}
                onPress={startTagEdit}
              />
            )}
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

type RemovableChipProps = { label: string; onRemove: () => void };

function RemovableTagChip({ label, onRemove }: RemovableChipProps) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove tag ${label}`}
      className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border active:opacity-70"
      style={{
        backgroundColor: c.surface,
        borderColor: c.lineOnSurface,
      }}
    >
      <Text className="font-body text-ink-mute text-[12px] leading-[16px]">
        #
      </Text>
      <Text className="font-bodySemibold text-ink text-[12px] leading-[16px]">
        {label}
      </Text>
      <X size={11} strokeWidth={2.3} color={c.inkMute} />
    </Pressable>
  );
}

type InlineInputProps = {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  onBlur: () => void;
  maxLength: number;
};

function InlineTagInput({
  value,
  onChangeText,
  onSubmit,
  onBlur,
  maxLength,
}: InlineInputProps) {
  const c = useAppColors();
  const { t } = useTranslation();
  return (
    <View
      className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border"
      style={{
        backgroundColor: c.surface,
        borderColor: c.lineOnSurface,
        borderStyle: 'dashed',
      }}
    >
      <Text className="font-body text-ink-mute text-[12px] leading-[16px]">
        #
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('compose.momentCreate.tagInputPlaceholder')}
        placeholderTextColor={c.inkMute}
        maxLength={maxLength}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        onBlur={onBlur}
        className="font-bodySemibold text-ink text-[12px] leading-[16px] p-0 w-[120px]"
      />
    </View>
  );
}

type AddChipProps = { label: string; onPress: () => void };

function AddTagChip({ label, onPress }: AddChipProps) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border active:opacity-70"
      style={{
        backgroundColor: 'transparent',
        borderColor: c.lineOnSurface,
        borderStyle: 'dashed',
      }}
    >
      <Text className="font-body text-ink-mute text-[12px] leading-[16px]">
        +
      </Text>
      <Text className="font-bodySemibold text-ink text-[12px] leading-[16px]">
        {label}
      </Text>
    </Pressable>
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
