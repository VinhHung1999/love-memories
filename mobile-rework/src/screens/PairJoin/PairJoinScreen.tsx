import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBigBtn, CameraView, LinearGradient, ScreenHeader } from '@/components';
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
    scanning,
    onChangeCell,
    onKeyPress,
    setCellRef,
    onSubmit,
    onOpenScanner,
    onCloseScanner,
    onScanned,
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
        <ScreenHeader
          showBack
          title={t('onboarding.pairing.join.title')}
          subtitle={t('onboarding.pairing.join.subtitle')}
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
              <Pressable
                onPress={onOpenScanner}
                accessibilityRole="button"
                disabled={submitting}
                className={`flex-row items-center justify-center gap-2 self-center rounded-full bg-surface border border-line-on-surface px-4 py-2.5 ${
                  submitting ? 'opacity-60' : 'active:opacity-90'
                }`}
              >
                <Text className="text-base">📷</Text>
                <Text className="font-bodyMedium text-ink text-[13px]">
                  {t('onboarding.pairing.join.scan.cta')}
                </Text>
              </Pressable>
            </View>

            <View className="px-5 pt-6">
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

      <ScannerOverlay visible={scanning} onClose={onCloseScanner} onScanned={onScanned} />
    </View>
  );
}

type ScannerProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (raw: string) => void;
};

function ScannerOverlay({ visible, onClose, onScanned }: ScannerProps) {
  const { t } = useTranslation();
  return (
    // T303-C: presentationStyle='fullScreen' (was overFullScreen+transparent).
    // overFullScreen renders the modal in a portal that's outside the
    // SafeAreaProvider tree, so SafeAreaView inside reads insets=0 → close
    // button + hint clipped by status bar / home indicator. fullScreen takes
    // over the screen the normal way so safe-area context is preserved.
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {visible ? (
          // T303-A: CameraView is a native-bridged view — NativeWind v4 does
          // NOT auto-cssInterop it. Without the registration in
          // components/Camera.tsx the className was dropped, the view
          // collapsed to 0×0, and the preview rendered as solid black.
          <CameraView
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={(e) => onScanned(e.data)}
            className="absolute inset-0"
          />
        ) : null}

        {/* T303-B: 3-row layout — close button top-right, reticle vertically
            centered (flex-1 items-center justify-center), hint right under it.
            Was flex-1 justify-between which pinned the reticle to the bottom. */}
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          {/* T303-C-redo: pt-6 (was pt-2) — on iOS 26 with dynamic island the
              SafeArea top inset still leaves the close button visually crowded
              against the island. Extra 16pt buys breathing room without
              needing to read useSafeAreaInsets() manually. */}
          <View className="px-4 pt-6 flex-row justify-end">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              hitSlop={12}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center active:opacity-80"
            >
              <Text className="text-white text-lg font-bodyBold">✕</Text>
            </Pressable>
          </View>

          <View className="flex-1 items-center justify-center px-6">
            {/* T292 (bug #2B): viewfinder reticle is not chrome — solid white
                so the scan target stays definitive on bright or busy scenes. */}
            <View className="w-[260px] h-[260px] rounded-3xl border-2 border-white" />
            <Text className="mt-6 font-bodyMedium text-white text-[14px] text-center">
              {t('onboarding.pairing.join.scan.hint')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
        filled ? 'border-[1.5px] border-primary' : 'border border-line-on-surface'
      }`}
    />
  );
}
