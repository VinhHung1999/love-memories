import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useCoupleFormViewModel } from './useCoupleFormViewModel';

// Sprint 68 D3prime — CoupleForm 1:1 with prototype `pairing.jsx` L1103-1291.
// Anniversary becomes REQUIRED (red pill), couple name + slogan both
// optional with quick-pick suggestion chips. Live couple-ring preview pill
// floats above the form so the user sees their composition update as
// they type / pick.

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
    date,
    setDate,
    name,
    setName,
    slogan,
    setSlogan,
    submitting,
    canSubmit,
    formError,
    onSubmit,
  } = useCoupleFormViewModel();

  const nameSuggestions = t('onboarding.coupleForm.nameSuggestions', { returnObjects: true }) as readonly string[];
  const sloganSuggestions = t('onboarding.coupleForm.sloganSuggestions', {
    returnObjects: true,
  }) as readonly string[];

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[280px]">
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
            <View className="px-6 pt-3 items-center">
              <CoupleRingPreview date={date} name={name} slogan={slogan} />
            </View>

            <View className="px-6 pt-5 pb-10">
              <FieldGroup
                label={t('onboarding.coupleForm.dateLabel')}
                required
              >
                <DateField
                  placeholder={t('onboarding.coupleForm.datePlaceholder')}
                  value={date}
                  onChange={setDate}
                  disabled={submitting}
                />
                <Text className="font-body text-ink-mute text-[11px] leading-[15px] -mt-2 mb-3.5 pl-1">
                  {t('onboarding.coupleForm.dateHelp')}
                </Text>
              </FieldGroup>

              <FieldGroup label={t('onboarding.coupleForm.nameLabel')}>
                <AuthField
                  placeholder={t('onboarding.coupleForm.namePlaceholder')}
                  value={name}
                  onChangeText={setName}
                  icon={t('onboarding.coupleForm.nameIcon')}
                  editable={!submitting}
                  autoCapitalize="words"
                  returnKeyType="next"
                  maxLength={60}
                />
                <ChipRow
                  items={nameSuggestions}
                  selected={name}
                  onPick={setName}
                  disabled={submitting}
                  fontClass="font-bodyMedium"
                  fontSizePx={11}
                />
              </FieldGroup>

              <FieldGroup label={t('onboarding.coupleForm.sloganLabel')}>
                <AuthField
                  placeholder={t('onboarding.coupleForm.sloganPlaceholder')}
                  value={slogan}
                  onChangeText={setSlogan}
                  icon={t('onboarding.coupleForm.sloganIcon')}
                  editable={!submitting}
                  returnKeyType="done"
                  maxLength={120}
                />
                <ChipRow
                  items={sloganSuggestions}
                  selected={slogan}
                  onPick={setSlogan}
                  disabled={submitting}
                  fontClass="font-script"
                  fontSizePx={14}
                />
              </FieldGroup>

              {formError ? (
                <Text className="mt-1 font-body text-primary-deep text-[13px] text-center">
                  {t(`onboarding.coupleForm.errors.${formError.kind}`)}
                </Text>
              ) : null}

              <View className="mt-5">
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
                <Text className="mt-3 font-body text-ink-mute text-[11px] text-center">
                  {t('onboarding.coupleForm.helper')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Live couple-ring preview pill — sits between header + form so the user
// sees their composition compose as they type.
function CoupleRingPreview({
  date,
  name,
  slogan,
}: {
  date: string;
  name: string;
  slogan: string;
}) {
  const { t } = useTranslation();
  const c = useAppColors();
  const trimmedDate = date.trim();
  const trimmedName = name.trim();
  const trimmedSlogan = slogan.trim();
  return (
    <View
      className="rounded-[22px] bg-surface border border-line px-5 py-4"
      style={{
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
        elevation: 3,
        // BUG-5: pill must center horizontally inside the screen padding.
        // `self-stretch` was overriding the parent's `items-center` and
        // forcing full-width. Constrain min/max from prototype L1144 so
        // the pill hugs its content but never feels squished or too wide.
        minWidth: 260,
        maxWidth: 320,
      }}
    >
      <View
        pointerEvents="none"
        className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full items-center justify-center"
        style={{
          backgroundColor: c.primary,
          shadowColor: '#000000',
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Text className="font-bodyBold text-white text-[14px]">♥</Text>
      </View>

      <Text className="font-script text-ink-mute text-[18px] leading-[20px]">
        {t('onboarding.coupleForm.preview.since', {
          date: trimmedDate || '— · — · —',
        })}
      </Text>
      <Text
        className="mt-1.5 font-displayItalic text-ink text-[22px] leading-[24px]"
        style={{ letterSpacing: -0.02 * 22 }}
      >
        {trimmedName || t('onboarding.coupleForm.preview.namePlaceholder')}
      </Text>
      <Text
        className="mt-1.5 font-script text-[18px] leading-[22px] min-h-[22px]"
        style={{ color: c.primary }}
      >
        {trimmedSlogan || t('onboarding.coupleForm.preview.sloganPlaceholder')}
      </Text>
    </View>
  );
}

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const c = useAppColors();
  return (
    <View className="mb-1.5">
      <View className="flex-row items-center mb-2 pl-1">
        <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[0.88px] mr-1.5">
          {label}
        </Text>
        <View
          className="rounded-full"
          style={{
            paddingHorizontal: 7,
            paddingVertical: 2,
            backgroundColor: required ? c.primary : c.surfaceAlt,
          }}
        >
          <Text
            className="font-bodyBold text-[9px] uppercase"
            style={{
              letterSpacing: 0.54,
              color: required ? '#FFFFFF' : c.inkMute,
            }}
          >
            {required ? t('onboarding.coupleForm.required') : t('onboarding.coupleForm.optional')}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function ChipRow({
  items,
  selected,
  onPick,
  disabled,
  fontClass,
  fontSizePx,
}: {
  items: readonly string[];
  selected: string;
  onPick: (next: string) => void;
  disabled?: boolean;
  fontClass: string;
  fontSizePx: number;
}) {
  return (
    <View className="flex-row flex-wrap -mt-2 mb-3.5" style={{ gap: 6 }}>
      {items.map((item) => (
        <Chip
          key={item}
          label={item}
          selected={selected === item}
          onPress={() => onPick(item)}
          disabled={disabled}
          fontClass={fontClass}
          fontSizePx={fontSizePx}
        />
      ))}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  disabled,
  fontClass,
  fontSizePx,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  fontClass: string;
  fontSizePx: number;
}) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      hitSlop={4}
      className="rounded-full px-2.5 py-1 active:opacity-80"
      style={{
        backgroundColor: selected ? c.primarySoft : c.surfaceAlt,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.line,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text
        className={`${fontClass}`}
        style={{
          fontSize: fontSizePx,
          color: selected ? c.primaryDeep : c.inkSoft,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// DateField — same iOS modal / Android dialog spinner pattern as the
// legacy Personalize implementation. Spinner stages to draft on iOS so
// accidental scrolls don't auto-save; Android native dialog auto-closes
// on `set`.
function DateField({
  placeholder,
  value,
  onChange,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const c = useAppColors();
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
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        className="flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border border-line-on-surface active:opacity-90"
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        <Text className="font-body text-base mr-2.5" style={{ color: c.inkMute }}>
          📅
        </Text>
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
