import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, LinearGradient, ScreenBackBtn } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { usePairJoinViewModel } from './usePairJoinViewModel';

// Ports `PairJoinScreen` from docs/design/prototype/memoura-v2/pairing.jsx:204.
// Spec deviation (sprint-60-pairing.md):
//   - 8 cells (BE generates 8 hex chars, prototype showed 6 placeholder)
//   - "Quét QR" card from prototype is omitted — out of T285 scope
//   - Inline partner-name preview once code valid (debounced /validate-invite)

export function PairJoinScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const {
    cells,
    partnerName,
    submitting,
    canSubmit,
    formError,
    onChangeCell,
    onKeyPress,
    setCellRef,
    onSubmit,
  } = usePairJoinViewModel();

  return (
    <View className="flex-1 bg-bg">
      <View pointerEvents="none" className="absolute top-0 left-0 right-0 h-[260px]">
        <LinearGradient
          colors={[c.accentSoft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          className="absolute inset-0"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="px-2 pt-2">
          <ScreenBackBtn />
        </View>

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
              <Text className="font-displayMediumItalic text-ink text-[28px] leading-[32px]">
                {t('onboarding.pairing.join.title')}
              </Text>
              <Text className="mt-1.5 font-body text-ink-mute text-[13px]">
                {t('onboarding.pairing.join.subtitle')}
              </Text>
            </View>

            <View className="px-5 pt-9">
              <CodeCells
                cells={cells}
                setCellRef={setCellRef}
                onChangeCell={onChangeCell}
                onKeyPress={onKeyPress}
                disabled={submitting}
              />

              {partnerName ? (
                <Text className="mt-5 font-body text-ink-soft text-[13px] text-center">
                  {t('onboarding.pairing.join.partnerHint', { name: partnerName })}
                </Text>
              ) : null}

              {formError ? (
                <Text className="mt-5 font-body text-primary-deep text-[13px] text-center">
                  {t(`onboarding.pairing.errors.${formError.kind}`)}
                </Text>
              ) : null}
            </View>

            <View className="px-5 pt-8 pb-10">
              <AuthBigBtn
                label={
                  submitting
                    ? t('onboarding.pairing.join.joining')
                    : t('onboarding.pairing.join.cta')
                }
                trailing={submitting ? '' : t('onboarding.pairing.join.ctaIcon')}
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

type CellsProps = {
  cells: string[];
  setCellRef: (index: number, ref: TextInput | null) => void;
  onChangeCell: (index: number, value: string) => void;
  onKeyPress: (index: number, key: string) => void;
  disabled?: boolean;
};

function CodeCells({ cells, setCellRef, onChangeCell, onKeyPress, disabled }: CellsProps) {
  return (
    <View className="flex-row justify-center gap-1.5">
      {cells.map((ch, i) => (
        <CodeCell
          key={i}
          value={ch}
          setRef={(node) => setCellRef(i, node)}
          onChangeText={(value) => onChangeCell(i, value)}
          onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) =>
            onKeyPress(i, e.nativeEvent.key)
          }
          editable={!disabled}
        />
      ))}
    </View>
  );
}

type CellProps = {
  value: string;
  setRef: (node: TextInput | null) => void;
  onChangeText: (value: string) => void;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  editable?: boolean;
};

function CodeCell({ value, setRef, onChangeText, onKeyPress, editable }: CellProps) {
  const filled = value.length > 0;
  return (
    <TextInput
      ref={setRef}
      value={value}
      onChangeText={onChangeText}
      onKeyPress={onKeyPress}
      editable={editable}
      maxLength={8}
      autoCapitalize="characters"
      autoCorrect={false}
      keyboardType="default"
      textContentType="oneTimeCode"
      className={`w-[36px] h-[56px] rounded-[14px] bg-surface text-center font-displayBold text-ink text-[28px] ${
        filled ? 'border-[1.5px] border-primary' : 'border border-line'
      }`}
    />
  );
}
