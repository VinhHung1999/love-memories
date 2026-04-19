import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Check } from 'lucide-react-native';
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
import { usePersonalizeViewModel } from './usePersonalizeViewModel';

// T294 (bug #9): native date picker bounds. 1974 lower bound = oldest user
// who could plausibly be celebrating an anniversary now (50+ years); upper
// bound = today, since "ngày bắt đầu" can't be in the future.
const MIN_DATE = new Date(1974, 0, 1);
const DATE_INPUT_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;
// Default seed when the field is empty — picks a sensible recent month so
// the spinner doesn't open on Jan 1, 1974.
const DEFAULT_SEED = new Date(2020, 1, 14);

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

// Ports `PersonalizeScreen` from docs/design/prototype/memoura-v2/pairing.jsx:272.
// Spec deviation (sprint-60-pairing.md §Personalize): drops "partner nickname"
// field — both joiner and inviter walk T286 and each PUTs their own name.
// 4 color swatches per prototype L278-283 (NOT 6 from the PO message —
// prototype wins per hard rule #6).

// Tailwind can't extract dynamic class names, so each color index → static
// gradient pair. Indexes mirror prototype L278-283 ordering exactly.
const SWATCH_FROM: Record<number, string> = {
  0: '#E8788A', // primary
  1: '#7EC8B5', // accent
  2: '#F4A261', // secondary
  3: '#C94F65', // primaryDeep
};
const SWATCH_TO: Record<number, string> = {
  0: '#F4A261', // secondary
  1: '#E8788A', // primary
  2: '#7EC8B5', // accent
  3: '#E8788A', // primary
};

export function PersonalizeScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const {
    nick,
    setNick,
    colorIndex,
    setColorIndex,
    colorIndexes,
    date,
    setDate,
    submitting,
    canSubmit,
    formError,
    onSubmit,
  } = usePersonalizeViewModel();

  const previewName = nick.trim() || t('onboarding.personalize.previewPlaceholder');
  const partnerLabel = t('onboarding.personalize.previewPartner');
  const previewDate = date.trim() || t('onboarding.personalize.datePlaceholder');
  const initial = previewName.charAt(0).toUpperCase();

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
        <LinearGradient
          colors={[c.secondarySoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* T306 (sprint 60 bundle 4): back is ENABLED. Creator path — the
            couple POST fires on Continue, not on mount; stepping back just
            loses typed state. Joiner path — PairJoin used router.replace, so
            there's no PairJoin entry in the stack and back falls through to
            PairChoice, which useAuthGate will immediately redirect away from
            once it sees coupleId set. */}
        <ScreenHeader
          title={t('onboarding.personalize.title')}
          subtitle={t('onboarding.personalize.subtitle')}
          showBack
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
            <View className="px-5 pt-3">
              <PreviewCard
                colorIndex={colorIndex}
                initial={initial}
                name={previewName}
                partnerLabel={partnerLabel}
                date={previewDate}
                sinceLabel={t('onboarding.personalize.previewSince')}
              />
            </View>

            <View className="px-5 pt-7">
              <AuthField
                label={t('onboarding.personalize.nickLabel')}
                placeholder={t('onboarding.personalize.nickPlaceholder')}
                value={nick}
                onChangeText={setNick}
                icon={t('onboarding.personalize.nickIcon')}
                editable={!submitting}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <View className="mb-3.5">
                <Text className="font-bodyBold text-ink-mute text-[11px] uppercase tracking-[1.2px] mb-1.5 pl-1">
                  {t('onboarding.personalize.colorLabel')}
                </Text>
                <View className="flex-row gap-2.5">
                  {colorIndexes.map((i) => (
                    <ColorSwatch
                      key={i}
                      index={i}
                      selected={colorIndex === i}
                      onPress={() => setColorIndex(i)}
                      disabled={submitting}
                    />
                  ))}
                </View>
              </View>

              <DateField
                label={t('onboarding.personalize.dateLabel')}
                placeholder={t('onboarding.personalize.datePlaceholder')}
                icon={t('onboarding.personalize.dateIcon')}
                value={date}
                onChange={setDate}
                disabled={submitting}
              />

              {formError ? (
                <Text className="mt-2 font-body text-primary-deep text-[13px] text-center">
                  {t(`onboarding.personalize.errors.${formError.kind}`)}
                </Text>
              ) : null}
            </View>

            <View className="px-5 pt-6 pb-10">
              <AuthBigBtn
                label={
                  submitting
                    ? t('onboarding.personalize.saving')
                    : t('onboarding.personalize.cta')
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

type PreviewProps = {
  colorIndex: number;
  initial: string;
  name: string;
  partnerLabel: string;
  date: string;
  sinceLabel: string;
};

function PreviewCard({ colorIndex, initial, name, partnerLabel, date, sinceLabel }: PreviewProps) {
  const from = SWATCH_FROM[colorIndex];
  const to = SWATCH_TO[colorIndex];
  return (
    <View className="self-center flex-row items-center rounded-[22px] border border-line-on-surface bg-surface px-5 py-4">
      <View className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-bg shadow-chip">
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <View className="flex-1 items-center justify-center">
          <Text className="font-displayBold text-white text-[20px]">{initial}</Text>
        </View>
      </View>
      <View className="ml-3.5">
        {/* T294 (bug #1): leading-[20px] (1.11×) clipped dấu mũ on "người ấy";
            24px (1.33×) keeps both lowercase + dấu fully drawn. */}
        <Text className="font-displayMedium text-ink text-[18px] leading-[24px]">
          {name} & {partnerLabel}
        </Text>
        <Text className="mt-1 font-script text-ink-soft text-[16px]">
          {sinceLabel} {date}
        </Text>
      </View>
    </View>
  );
}

// T294 (bug #9): native date picker — replaces the freeform AuthField. Free
// text gave Boss "DD.MM.YYYY" hell on iOS keyboard; tapping spawns the system
// spinner (iOS) / dialog (Android) with bounds [1974-01-01, today]. The VM
// still consumes "DD.MM.YYYY" strings — `formatDDMMYYYY` keeps that contract.
function DateField({
  label,
  placeholder,
  icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  icon?: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
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

  // Android: native dialog auto-closes; commit on `set`, drop on dismiss.
  const onAndroidChange = (event: DateTimePickerEvent, picked?: Date) => {
    setPicking(false);
    if (event.type === 'set' && picked) {
      onChange(formatDDMMYYYY(picked));
    }
  };

  // iOS: spinner stays mounted in the modal; we only stage to draft and
  // commit on Done so accidental scrolls don't auto-save.
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
        className={`flex-row items-center bg-surface rounded-2xl px-4 py-3.5 border-[1.5px] border-line-on-surface ${
          disabled ? 'opacity-60' : 'active:opacity-90'
        }`}
      >
        {icon ? (
          <Text className="font-body text-ink-mute text-base mr-2.5">{icon}</Text>
        ) : null}
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
            {/* Inner Pressable swallows taps so the spinner area doesn't
                trigger the backdrop close handler. */}
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

function ColorSwatch({
  index,
  selected,
  onPress,
  disabled,
}: {
  index: number;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const from = SWATCH_FROM[index];
  const to = SWATCH_TO[index];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      hitSlop={6}
      className={`w-14 h-14 rounded-full overflow-hidden items-center justify-center ${
        selected ? 'border-[3px] border-ink' : 'border border-line'
      } shadow-chip`}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {/* T291 (bug #6): selected swatch overlays a lucide Check so the
          chosen palette is unambiguous (border-only state was easy to miss). */}
      {selected ? <Check size={22} strokeWidth={2.5} color="#FFFFFF" /> : null}
    </Pressable>
  );
}
