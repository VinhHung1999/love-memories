import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, AuthField, LinearGradient, ScreenHeader } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePersonalizeViewModel } from './usePersonalizeViewModel';

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
        <ScreenHeader
          showBack
          title={t('onboarding.personalize.title')}
          subtitle={t('onboarding.personalize.subtitle')}
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

              <AuthField
                label={t('onboarding.personalize.dateLabel')}
                placeholder={t('onboarding.personalize.datePlaceholder')}
                value={date}
                onChangeText={setDate}
                icon={t('onboarding.personalize.dateIcon')}
                editable={!submitting}
                keyboardType="numbers-and-punctuation"
                autoCorrect={false}
                returnKeyType="done"
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
    <View className="self-center flex-row items-center rounded-[22px] border border-line bg-surface px-5 py-4">
      <View className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-bg shadow-sm">
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
        <Text className="font-displayMedium text-ink text-[18px] leading-[20px]">
          {name} & {partnerLabel}
        </Text>
        <Text className="mt-1 font-script text-ink-soft text-[16px]">
          {sinceLabel} {date}
        </Text>
      </View>
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
      className={`w-14 h-14 rounded-full overflow-hidden ${
        selected ? 'border-[3px] border-ink' : 'border border-line'
      } shadow-sm`}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
    </Pressable>
  );
}
