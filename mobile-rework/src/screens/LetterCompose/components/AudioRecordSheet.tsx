import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Mic, Square } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { useAppColors } from '@/theme/ThemeProvider';

// D46 (Build 76 hot-fix): same FullWindowOverlay workaround as DiscardSheet —
// LetterCompose lives inside the (modal) presentation, and the sheet portal
// renders above the native transparentModal screen container which would
// otherwise intercept all mic-button touches on iOS.
function iOSContainer(props: { children?: React.ReactNode }) {
  return <FullWindowOverlay>{props.children}</FullWindowOverlay>;
}

// T423 (Sprint 65) — record sheet for letter voice memos. expo-audio's
// useAudioRecorder hook auto-disposes on unmount; the dismiss flow stops the
// recording first so the resource releases cleanly.
//
// UX:
//   • initial — big mic + "Bấm để ghi âm" copy
//   • recording — pulsing red circle + duration counter + 60s auto-stop
//   • after stop — uri returned via onComplete; sheet dismisses, the screen
//     enqueues the upload via uploadQueue.
//
// Audio mode: setAudioModeAsync({ allowsRecording: true, playsInSilentMode:
// true }) before record() so iOS routes audio to the right session and the
// device's silent switch doesn't mute playback in AudioPreview later.

const MAX_DURATION_MS = 60_000;

export type AudioRecordSheetHandle = {
  open: () => void;
  close: () => void;
};

type Props = {
  title: string;
  hint: string;
  startLabel: string;
  stopLabel: string;
  permDeniedLabel: string;
  onComplete: (uri: string, durationMs: number) => void;
};

export const AudioRecordSheet = forwardRef<AudioRecordSheetHandle, Props>(
  function AudioRecordSheet(props, ref) {
    const {
      title,
      hint,
      startLabel,
      stopLabel,
      permDeniedLabel,
      onComplete,
    } = props;
    const c = useAppColors();
    const insets = useSafeAreaInsets();
    const bsRef = useRef<BottomSheetModal>(null);

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recState = useAudioRecorderState(recorder, 200);

    const [permDenied, setPermDenied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const pulse = useRef(new Animated.Value(1)).current;

    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setPermDenied(false);
          setIsClosing(false);
          bsRef.current?.present();
        },
        close: () => {
          bsRef.current?.dismiss();
        },
      }),
      [],
    );

    // Pulse animation while recording. Animated.Value transforms/opacity is
    // the documented carve-out from the no-style-prop rule.
    useEffect(() => {
      if (!recState.isRecording) {
        pulse.setValue(1);
        return;
      }
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.18,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [pulse, recState.isRecording]);

    const stopAndEmit = useCallback(async () => {
      if (!recState.isRecording && !recState.canRecord) return;
      // D58 (Sprint 65 Build 82 hot-fix): capture the running duration
      // BEFORE awaiting recorder.stop(). expo-audio's poller resets
      // recState.durationMillis to 0 the instant the recorder transitions
      // out of `isRecording`, so reading it after the await yields 0 ms
      // for a 5-second clip. The pre-stop value is the truth; fall back
      // to the post-stop value only if the user tapped Stop before the
      // poller's first tick.
      const preStopMs = recState.durationMillis ?? 0;
      try {
        await recorder.stop();
      } catch {
        /* swallow */
      }
      const uri = recorder.uri;
      const durationMs =
        preStopMs > 0 ? preStopMs : recState.durationMillis ?? 0;
      if (uri) {
        onComplete(uri, durationMs);
      }
      setIsClosing(true);
      bsRef.current?.dismiss();
    }, [
      onComplete,
      recState.canRecord,
      recState.durationMillis,
      recState.isRecording,
      recorder,
    ]);

    // Auto-stop at 60s.
    useEffect(() => {
      if (
        recState.isRecording &&
        (recState.durationMillis ?? 0) >= MAX_DURATION_MS
      ) {
        void stopAndEmit();
      }
    }, [recState.durationMillis, recState.isRecording, stopAndEmit]);

    const onStart = async () => {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          setPermDenied(true);
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (err) {
        // D41 (Build 76 hot-fix): surface any audio-session / prepare /
        // record failure as a permission-denied banner so the user has a
        // visible signal instead of silent no-op. The original silent
        // failure on Boss's device traced back to D46 (touches blocked by
        // the iOS transparentModal screen container) — this catch is
        // belt-and-suspenders for any future expo-audio session issue.
        if (__DEV__) {
          console.warn('[AudioRecordSheet] onStart failed', err);
        }
        setPermDenied(true);
      }
    };

    // Make sure we don't leave a recording running if the user swipes the
    // sheet down without tapping Stop.
    const onSheetDismiss = useCallback(() => {
      if (recState.isRecording && !isClosing) {
        // Quietly stop without emitting — user dismissed deliberately.
        void recorder.stop();
      }
      setIsClosing(false);
      // Reset audio mode for playback elsewhere.
      void setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    }, [isClosing, recState.isRecording, recorder]);

    const renderBackdrop = useCallback(
      (p: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...p}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.45}
        />
      ),
      [],
    );

    const ms = recState.durationMillis ?? 0;
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const clock = `${m}:${String(s).padStart(2, '0')}`;

    return (
      <BottomSheetModal
        ref={bsRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        containerComponent={Platform.OS === 'ios' ? iOSContainer : undefined}
        onDismiss={onSheetDismiss}
        backgroundStyle={{ backgroundColor: c.bgElev }}
        handleIndicatorStyle={{ backgroundColor: c.lineOnSurface }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="px-6 pt-2 items-center">
            <Text className="font-displayMedium text-ink text-[22px] leading-[26px]">
              {title}
            </Text>
            <Text className="mt-2 font-body text-ink-mute text-[13px] leading-[20px] text-center">
              {hint}
            </Text>

            <View className="mt-7 items-center justify-center">
              <Animated.View
                style={{ transform: [{ scale: pulse }] }}
                className="w-[120px] h-[120px] rounded-full items-center justify-center"
              >
                <Pressable
                  onPress={recState.isRecording ? stopAndEmit : onStart}
                  accessibilityRole="button"
                  className="w-[120px] h-[120px] rounded-full items-center justify-center active:opacity-90"
                  style={{
                    backgroundColor: recState.isRecording
                      ? c.primaryDeep
                      : c.primary,
                  }}
                >
                  {recState.isRecording ? (
                    <Square
                      size={32}
                      strokeWidth={2.5}
                      color="#ffffff"
                      fill="#ffffff"
                    />
                  ) : (
                    <Mic size={32} strokeWidth={2.4} color="#ffffff" />
                  )}
                </Pressable>
              </Animated.View>

              <Text className="font-bodyBold text-ink text-[28px] mt-5 tabular-nums">
                {clock}
              </Text>
              <Text className="font-bodySemibold text-ink-mute text-[12px] mt-1">
                {recState.isRecording ? stopLabel : startLabel}
              </Text>
            </View>

            {permDenied ? (
              <Text className="mt-4 font-body text-primary text-[12px] text-center">
                {permDeniedLabel}
              </Text>
            ) : null}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
