import { useEffect } from 'react';
import { Camera, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AuthBigBtn, CameraView, LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { usePairJoinViewModel } from './usePairJoinViewModel';

// Sprint 68 BUG-7 (Boss build 134) — PairJoin redesigned to match
// prototype L643-965. Cinematic accent gradient hero + ambient wash +
// heart watermark + 5 sparkles, glassmorphism back-circle, white hero
// text, postcard code-entry card with dashed "From → To" bar + 8 code
// slots split 4-4 with center separator + filled-progress dots, alt-
// method Scan QR row, helper hint, then the AuthBigBtn pair-up CTA.
//
// VM logic untouched — CODE_LEN stays 8 (BE generates 8-char hex), all
// onChangeCell / onKeyPress / paste / scan / submit / notif-perm flows
// in usePairJoinViewModel keep working. Only the View shell is new.

const HERO_HEIGHT = 380;
const SPARKLES: ReadonlyArray<readonly [number, number, number, number]> = [
  [16, 56, 4, 0],
  [82, 36, 3, 0.4],
  [62, 86, 5, 0.8],
  [12, 26, 3, 0.2],
  [50, 14, 3, 0.6],
];
const HEART_PATH =
  'M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11';

export function PairJoinScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const userName = useAuthStore((s) => s.user?.name ?? null);
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

  const filledCount = cells.filter((ch) => ch.length > 0).length;
  const userInitial = (userName?.trim()?.charAt(0) ?? '?').toUpperCase();
  const userLabel = userName?.trim() || t('onboarding.pairJoin.youFallback');

  return (
    <View className="flex-1 bg-bg">
      <View
        pointerEvents="none"
        className="absolute top-0 left-0 right-0 overflow-hidden"
        style={{ height: HERO_HEIGHT }}
      >
        <LinearGradient
          colors={[c.accent, c.primary, c.heroC]}
          locations={[0, 0.6, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          className="absolute inset-0"
        />
        <Svg
          pointerEvents="none"
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <RadialGradient id="joinWashLight" cx="0.22" cy="0.18" rx="0.55" ry="0.55" fx="0.22" fy="0.18">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.36" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="joinWashShadow" cx="0.88" cy="0.92" rx="0.55" ry="0.55" fx="0.88" fy="0.92">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.32" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#joinWashLight)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#joinWashShadow)" />
        </Svg>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: -100,
            bottom: -70,
            opacity: 0.07,
            transform: [{ rotate: '14deg' }],
          }}
        >
          <Svg width={320} height={320} viewBox="0 0 24 24">
            <Path d={HEART_PATH} fill="#FFFFFF" />
          </Svg>
        </View>
        {SPARKLES.map(([x, y, size, delay], i) => (
          <Sparkle
            key={`spark-${i}`}
            xPercent={x}
            yPercent={y}
            size={size}
            delay={delay * 1000}
            duration={1600 + i * 200}
          />
        ))}
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Glassmorphism top bar — back-circle only, no skip. */}
            <View className="px-6 h-14 flex-row items-center">
              <BackCircle />
            </View>

            <View className="px-7 pt-3">
              <Text className="font-script text-[24px] leading-[24px] text-white/90">
                {t('onboarding.pairJoin.kicker')}
              </Text>
              <Text
                className="mt-1.5 font-displayItalic text-white text-[38px] leading-[39px]"
                style={{
                  letterSpacing: -0.025 * 38,
                  textShadowColor: 'rgba(0,0,0,0.2)',
                  textShadowOffset: { width: 0, height: 4 },
                  textShadowRadius: 30,
                }}
              >
                {t('onboarding.pairJoin.title')}
              </Text>
            </View>

            <View className="px-6 mt-7">
              <View className="relative">
                <View
                  pointerEvents="none"
                  className="absolute rounded-[28px]"
                  style={{
                    top: 6,
                    left: -4,
                    right: 4,
                    bottom: -4,
                    backgroundColor: c.accentSoft,
                    opacity: 0.7,
                    transform: [{ rotate: '2deg' }],
                  }}
                />
                <View
                  className="rounded-[28px] overflow-hidden"
                  style={{
                    backgroundColor: c.surface,
                    borderWidth: 1,
                    borderColor: c.line,
                    shadowColor: '#000000',
                    shadowOpacity: 0.25,
                    shadowRadius: 30,
                    shadowOffset: { width: 0, height: 30 },
                    elevation: 8,
                  }}
                >
                  {/* "From → To" bar — partner placeholder on left, me on right */}
                  <View
                    className="px-4 py-3.5 flex-row items-center"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: c.line,
                      borderStyle: 'dashed',
                      gap: 10,
                    }}
                  >
                    <View pointerEvents="none" className="absolute inset-0">
                      <LinearGradient
                        colors={[c.accentSoft, c.primarySoft]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute inset-0"
                      />
                    </View>
                    <View
                      className="w-[30px] h-[30px] rounded-full items-center justify-center"
                      style={{
                        backgroundColor: c.surface,
                        borderWidth: 2,
                        borderColor: c.inkMute,
                        borderStyle: 'dashed',
                      }}
                    >
                      <Text className="font-bodyBold text-[14px]" style={{ color: c.inkMute }}>
                        ?
                      </Text>
                    </View>
                    <Text className="font-bodyBold text-ink-mute text-[12px]">
                      {t('onboarding.pairJoin.partnerFallback')}
                    </Text>
                    <Svg width={40} height={14} viewBox="0 0 40 14" style={{ flex: 1 }}>
                      <Path
                        d="M2 7 L 38 7"
                        stroke={c.accent}
                        strokeWidth={1.5}
                        strokeDasharray="2 3"
                        strokeLinecap="round"
                        opacity={0.7}
                      />
                      <Path
                        d="M32 3 L 38 7 L 32 11"
                        stroke={c.accent}
                        strokeWidth={1.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.7}
                      />
                    </Svg>
                    <Text className="font-bodyBold text-ink text-[12px]">{userLabel}</Text>
                    <View
                      className="w-[30px] h-[30px] rounded-full items-center justify-center overflow-hidden"
                      style={{ borderWidth: 2, borderColor: '#FFFFFF' }}
                    >
                      <LinearGradient
                        colors={[c.accent, c.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute inset-0"
                      />
                      <Text className="font-bodyBold text-white text-[12px]">
                        {userInitial}
                      </Text>
                    </View>
                  </View>

                  <View className="px-4 pt-5 pb-3 items-center">
                    <Text
                      className="font-script text-[20px] leading-[22px]"
                      style={{ color: c.accent }}
                    >
                      {t('onboarding.pairJoin.codeLabel')}
                    </Text>

                    <CodeSlots
                      cells={cells}
                      setCellRef={setCellRef}
                      onChangeCell={onChangeCell}
                      onKeyPress={onKeyPress}
                      disabled={submitting}
                    />

                    <FilledProgress filled={filledCount} accentColor={c.accent} lineColor={c.line} />
                  </View>

                  <PerforatedDivider bgColor={c.bg} lineColor={c.line} />

                  <View className="px-3.5 pt-3 pb-4">
                    <Text
                      className="font-bodyBold text-ink-mute text-[10.5px] uppercase mb-2 text-center"
                      style={{ letterSpacing: 1.05 }}
                    >
                      {t('onboarding.pairJoin.altOr')}
                    </Text>

                    <Pressable
                      onPress={submitting ? undefined : onOpenScanner}
                      accessibilityRole="button"
                      hitSlop={4}
                      className="flex-row items-center rounded-2xl px-3.5 py-3.5 active:opacity-90"
                      style={{
                        backgroundColor: c.surfaceAlt,
                        borderWidth: 1,
                        borderColor: c.line,
                        gap: 12,
                      }}
                    >
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: c.surface,
                          borderWidth: 1,
                          borderColor: c.line,
                        }}
                      >
                        <Svg width={24} height={24} viewBox="0 0 20 20" fill="none">
                          <Path
                            d="M2 6V3a1 1 0 011-1h3M14 2h3a1 1 0 011 1v3M18 14v3a1 1 0 01-1 1h-3M6 18H3a1 1 0 01-1-1v-3"
                            stroke={c.accent}
                            strokeWidth={1.6}
                            strokeLinecap="round"
                          />
                          <Rect x={6} y={6} width={8} height={8} rx={1} stroke={c.ink} strokeWidth={1.4} />
                        </Svg>
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="font-bodyBold text-ink text-[14px] leading-[17px]">
                          {t('onboarding.pairJoin.scanTitle')}
                        </Text>
                        <Text className="font-body text-ink-mute text-[11.5px] leading-[15px] mt-0.5">
                          {t('onboarding.pairJoin.scanSub')}
                        </Text>
                      </View>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" opacity={0.5}>
                        <Path
                          d="M9 6l6 6-6 6"
                          stroke={c.ink}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* Helper hint */}
            <View
              className="mx-6 mt-4 rounded-2xl px-3.5 py-3 flex-row"
              style={{
                backgroundColor: c.surfaceAlt,
                borderWidth: 1,
                borderColor: c.line,
                borderStyle: 'dashed',
                gap: 10,
              }}
            >
              <View
                className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                style={{
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.line,
                }}
              >
                <Text
                  className="font-bodyBold text-[12px]"
                  style={{ color: c.inkSoft }}
                >
                  ?
                </Text>
              </View>
              <Text
                className="flex-1 font-body text-[12px] leading-[17px]"
                style={{ color: c.inkSoft }}
              >
                {t('onboarding.pairJoin.help')}
              </Text>
            </View>

            {partnerName ? (
              <Text className="mt-3 px-6 font-body text-ink-soft text-[13px] text-center">
                {t('onboarding.pairing.join.partnerHint', { name: partnerName })}
              </Text>
            ) : null}

            {formError ? (
              <Text className="mt-3 px-6 font-body text-primary-deep text-[13px] text-center">
                {t(`onboarding.pairing.errors.${formError.kind}`)}
              </Text>
            ) : null}

            <View className="px-6 pt-6 pb-9">
              <AuthBigBtn
                label={
                  submitting
                    ? t('onboarding.pairJoin.joining')
                    : t('onboarding.pairJoin.cta')
                }
                trailing={submitting ? '' : '→'}
                onPress={onSubmit}
                disabled={!canSubmit}
                loading={submitting}
              />
              {!canSubmit && !submitting ? (
                <Text className="mt-2.5 font-body text-ink-mute text-[11px] text-center">
                  {t('onboarding.pairJoin.remaining', { n: 8 - filledCount })}
                </Text>
              ) : null}
              {canSubmit ? (
                <Text
                  className="mt-2.5 font-script text-[18px] text-center"
                  style={{ color: c.accent }}
                >
                  {t('onboarding.pairJoin.ready')}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ScannerOverlay visible={scanning} onClose={onCloseScanner} onScanned={onScanned} />
    </View>
  );
}

function BackCircle() {
  return (
    <View
      className="w-9 h-9 rounded-full items-center justify-center"
      style={{
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
      }}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15 6l-6 6 6 6"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

type SlotsProps = {
  cells: string[];
  setCellRef: (index: number, ref: TextInput | null) => void;
  onChangeCell: (index: number, value: string) => void;
  onKeyPress: (index: number, key: string) => void;
  disabled?: boolean;
};

// 8-char hex code split 4-4 with a center "·" separator. BE uses
// `crypto.randomBytes(4).toString('hex')` which yields 8 lowercase hex
// chars; the input force-uppercases for readability.
function CodeSlots({ cells, setCellRef, onChangeCell, onKeyPress, disabled }: SlotsProps) {
  return (
    <View className="flex-row items-center justify-center mt-3.5" style={{ gap: 5 }}>
      {cells.map((ch, i) => (
        <View key={i} className="flex-row items-center" style={{ gap: 5 }}>
          {i === 4 ? <SlotSeparator /> : null}
          <CodeSlot
            index={i}
            value={ch}
            setRef={(node) => setCellRef(i, node)}
            onChangeText={(value) => onChangeCell(i, value)}
            onKeyPress={(e) => onKeyPress(i, e.nativeEvent.key)}
            editable={!disabled}
          />
        </View>
      ))}
    </View>
  );
}

function SlotSeparator() {
  const c = useAppColors();
  return (
    <Text
      className="font-displayBold text-[32px] leading-[32px] text-center"
      style={{ width: 12, color: c.inkMute }}
    >
      ·
    </Text>
  );
}

type SlotProps = {
  index: number;
  value: string;
  setRef: (node: TextInput | null) => void;
  onChangeText: (value: string) => void;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  editable?: boolean;
};

function CodeSlot({ index, value, setRef, onChangeText, onKeyPress, editable }: SlotProps) {
  const c = useAppColors();
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
      // Memory bugs_ios_otp_autofill_yellow: only cell 0 carries
      // textContentType='oneTimeCode' so iOS doesn't paint every cell yellow
      // while waiting for SMS autofill — the keyboard delivers the full
      // pasted code to cell 0 and the change handler splits across cells.
      textContentType={index === 0 ? 'oneTimeCode' : 'none'}
      className="text-center font-displayBold text-ink"
      style={{
        width: 38,
        height: 50,
        borderRadius: 10,
        backgroundColor: filled ? c.accentSoft : c.surfaceAlt,
        borderWidth: 1.5,
        borderColor: filled ? c.accent : c.line,
        fontSize: 24,
      }}
    />
  );
}

function FilledProgress({
  filled,
  accentColor,
  lineColor,
}: {
  filled: number;
  accentColor: string;
  lineColor: string;
}) {
  return (
    <View className="flex-row items-center justify-center mt-3.5" style={{ gap: 5 }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <View
          key={i}
          style={{
            width: filled > i ? 16 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: filled > i ? accentColor : lineColor,
          }}
        />
      ))}
    </View>
  );
}

function PerforatedDivider({ bgColor, lineColor }: { bgColor: string; lineColor: string }) {
  return (
    <View className="relative" style={{ height: 18 }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          borderTopWidth: 1.5,
          borderTopColor: lineColor,
          borderStyle: 'dashed',
          transform: [{ translateY: -0.75 }],
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          left: -10,
          top: '50%',
          width: 20,
          height: 20,
          backgroundColor: bgColor,
          transform: [{ translateY: -10 }],
        }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full"
        style={{
          right: -10,
          top: '50%',
          width: 20,
          height: 20,
          backgroundColor: bgColor,
          transform: [{ translateY: -10 }],
        }}
      />
    </View>
  );
}

function Sparkle({
  xPercent,
  yPercent,
  size,
  delay,
  duration,
}: {
  xPercent: number;
  yPercent: number;
  size: number;
  delay: number;
  duration: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + progress.value * 0.5,
    transform: [{ scale: 1 + progress.value * 0.4 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute rounded-full"
      style={[
        {
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: size,
          height: size,
          backgroundColor: 'rgba(255,255,255,0.7)',
        },
        animatedStyle,
      ]}
    />
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
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <View className="flex-1 bg-black">
          {visible ? (
            <CameraView
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(e) => onScanned(e.data)}
              className="absolute inset-0"
            />
          ) : null}
          <SafeAreaView edges={['top', 'bottom']} className="flex-1">
            <View className="px-4 pt-6 flex-row justify-end">
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                hitSlop={12}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center active:opacity-80"
              >
                <X size={20} color="#FFFFFF" strokeWidth={2.2} />
              </Pressable>
            </View>
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-[260px] h-[260px] rounded-3xl border-2 border-white" />
              <Text className="mt-6 font-bodyMedium text-white text-[14px] text-center">
                {t('onboarding.pairing.join.scan.hint')}
              </Text>
            </View>
            <View className="px-4 pb-6 flex-row items-center justify-center">
              <Camera size={16} color="#FFFFFF" strokeWidth={2} />
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
