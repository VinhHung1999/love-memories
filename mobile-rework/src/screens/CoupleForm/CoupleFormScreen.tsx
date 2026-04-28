import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Heart, Sparkles, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import { AuthBigBtn, AuthField, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { SLOGAN_MAX, useCoupleFormViewModel } from './useCoupleFormViewModel';

// Sprint 68 T466 — CoupleForm. Three fields (name + slogan + anniversary)
// live in one screen so the BE atomic transaction (T462) can persist them
// together. Visual idiom matches Personalize/PairCreate (gradient hero,
// single-column AuthField stack, hero CTA at the bottom). Date picker
// reuses the iOS modal/Android dialog spinner pattern from the legacy
// Personalize T294 implementation — same DD.MM.YYYY contract.

const MIN_DATE = new Date(1974, 0, 1);
const DEFAULT_SEED = new Date(2020, 1, 14);
const DATE_INPUT_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function parseDDMMYYYY(input: string): Date | null {
  const m = DATE_INPUT_RE.exec(input.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function CoupleFormScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const router = useRouter();
  const {
    name,
    setName,
    slogan,
    setSlogan,
    date,
    setDate,
    submitting,
    canSubmit,
    formError,
    onSubmit,
  } = useCoupleFormViewModel();

  const sloganRemaining = Math.max(SLOGAN_MAX - slogan.length, 0);

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
        <LinearGradient
          colors={[c.primarySoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <ScreenHeader
          title={t('onboarding.coupleForm.title')}
          subtitle={t('onboarding.coupleForm.subtitle')}
          showBack
          onBack={submitting ? undefined : () => router.back()}
        />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-5 pt-7">
              <AuthField
                label={t('onboarding.coupleForm.nameLabel')}
                placeholder={t('onboarding.coupleForm.namePlaceholder')}
                value={name}
                onChangeText={setName}
                icon={<Heart size={18} color={c.inkMute} strokeWidth={1.75} />}
                editable={!submitting}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                maxLength={60}
              />

              <View className="mb-3.5">
                <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
                  {t('onboarding.coupleForm.sloganLabel')}
                </Text>
                <View className="flex-row items-start bg-surface rounded-2xl px-4 py-3.5 border border-line-on-surface">
                  <View className="mr-2.5 mt-0.5">
                    <Sparkles size={18} color={c.inkMute} strokeWidth={1.75} />
                  </View>
                  <SloganInput
                    value={slogan}
                    onChange={setSlogan}
                    placeholder={t('onboarding.coupleForm.sloganPlaceholder')}
                    placeholderTextColor={c.inkMute}
                    editable={!submitting}
                  />
                </View>
                <Text className="font-body text-ink-mute text-[12px] mt-1 pl-1">
                  {t('onboarding.coupleForm.sloganRemaining', { n: sloganRemaining })}
                </Text>
              </View>

              <DateField
                label={t('onboarding.coupleForm.dateLabel')}
                placeholder={t('onboarding.coupleForm.datePlaceholder')}
                value={date}
                onChange={setDate}
                disabled={submitting}
                inkMute={c.inkMute}
              />

              {formError ? (
                <Text className="mt-2 font-body text-primary-deep text-[13px] text-center">
                  {t(`onboarding.coupleForm.errors.${formError.kind}`)}
                </Text>
              ) : null}
            </View>

            <View className="px-5 pt-6 pb-10">
              <AuthBigBtn
                label={
                  submitting
                    ? t('onboarding.coupleForm.saving')
                    : t('onboarding.coupleForm.cta')
                }
                trailing={submitting ? '' : '→'}
                onPress={onSubmit}
                disabled={!canSubmit}
                loading={submitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Multiline TextInput — extracted because AuthField's flex layout is
// horizontal and clips a multiline TextInput's height. This row uses
// items-start instead and gives the input its own min height.
function SloganInput({
  value,
  onChange,
  placeholder,
  placeholderTextColor,
  editable,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  editable: boolean;
}) {
  return (
    <TextInput
      className="flex-1 font-bodyMedium text-ink"
      multiline
      numberOfLines={3}
      placeholderTextColor={placeholderTextColor}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      editable={editable}
      maxLength={120}
      textAlignVertical="top"
    />
  );
}

// DateField — same iOS modal / Android dialog pattern as the legacy
// Personalize implementation. Spinner in iOS modal so accidental scrolls
// don't auto-save; Android native dialog auto-closes on `set`.
function DateField({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  inkMute,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  inkMute: string;
}) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseDDMMYYYY(value) ?? DEFAULT_SEED);

  const open = () => {
    if (disabled) return;
    setDraft(parseDDMMYYYY(value) ?? DEFAULT_SEED);
    setPicking(true);
  };
  const close = () => setPicking(false);
  const confirm = () => {
    onChange(formatDDMMYYYY(draft));
    setPicking(false);
  };

  const onAndroidChange = (event: DateTimePickerEvent, picked?: Date) => {
    setPicking(false);
    if (event.type === 'set' && picked) {
      onChange(formatDDMMYYYY(picked));
    }
  };

  const onIosChange = (_event: DateTimePickerEvent, picked?: Date) => {
    if (picked) setDraft(picked);
  };

  return (
    <View className="mb-3.5">
      <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
        {label}
      </Text>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        className="flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border border-line-on-surface active:opacity-90"
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        <View className="mr-2.5">
          <Calendar size={18} color={inkMute} strokeWidth={1.75} />
        </View>
        <Text
          className={`flex-1 font-bodyMedium text-[15px] ${value ? 'text-ink' : 'text-ink-mute'}`}
        >
          {value || placeholder}
        </Text>
      </Pressable>

      {picking && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={MIN_DATE}
          maximumDate={new Date()}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={picking} transparent animationType="fade" onRequestClose={close}>
          <Pressable onPress={close} className="flex-1 bg-black/40 justify-end">
            <Pressable onPress={() => {}} className="bg-surface rounded-t-[24px] pb-6">
              <View className="flex-row items-center justify-between px-5 pt-4 pb-2 border-b border-line-on-surface">
                <Pressable onPress={close} hitSlop={8}>
                  <Text className="font-bodyMedium text-ink-mute text-[15px]">
                    {t('common.cancel')}
                  </Text>
                </Pressable>
                <Pressable onPress={confirm} hitSlop={8}>
                  <Text className="font-bodyBold text-primary-deep text-[15px]">
                    {t('common.done')}
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                minimumDate={MIN_DATE}
                maximumDate={new Date()}
                onChange={onIosChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
