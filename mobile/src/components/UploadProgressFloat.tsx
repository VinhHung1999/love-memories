import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CheckCircle, CloudUpload, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUploadProgress } from '../contexts/UploadProgressContext';
import { useAppColors } from '../navigation/theme';
import t from '../locales/en';

type Phase = 'hidden' | 'uploading' | 'complete';

const TAB_BAR_HEIGHT = 56;
const COMPLETE_LINGER_MS = 1500;

export default function UploadProgressFloat() {
  const { upload, clearUpload } = useUploadProgress();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('hidden');
  const phaseRef = useRef<Phase>('hidden');
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation shared values
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const progressPct = useSharedValue(0); // 0–1
  const trackWidthSV = useSharedValue(0); // measured in px

  const onDismissComplete = useCallback(() => {
    phaseRef.current = 'hidden';
    setPhase('hidden');
    clearUpload();
  }, [clearUpload]);

  const dismiss = useCallback(() => {
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    translateY.value = withTiming(100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, finished => {
      'worklet';
      if (finished) runOnJS(onDismissComplete)();
    });
  }, [onDismissComplete, opacity, translateY]);

  useEffect(() => {
    if (!upload) return;

    const pct = upload.total > 0 ? upload.done / upload.total : 0;

    if (phaseRef.current === 'hidden') {
      // New upload — slide in
      phaseRef.current = 'uploading';
      setPhase('uploading');
      translateY.value = 100;
      opacity.value = 0;
      progressPct.value = 0;
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      progressPct.value = withTiming(pct, { duration: 300 });
    } else if (phaseRef.current === 'uploading') {
      progressPct.value = withTiming(pct, { duration: 300 });

      if (upload.done >= upload.total) {
        phaseRef.current = 'complete';
        setPhase('complete');
        progressPct.value = withTiming(1, { duration: 200 });

        if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
        completeTimerRef.current = setTimeout(() => {
          dismiss();
        }, COMPLETE_LINGER_MS);
      }
    } else if (phaseRef.current === 'complete') {
      // New upload started while showing complete — reset to uploading
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
      phaseRef.current = 'uploading';
      setPhase('uploading');
      progressPct.value = withTiming(pct, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upload]);

  // Reanimated exception: Animated transforms + position offsets require style prop
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: progressPct.value * trackWidthSV.value,
  }));

  if (phase === 'hidden') return null;

  const isComplete = phase === 'complete';
  const done = upload?.done ?? 0;
  const total = upload?.total ?? 1;
  const noun = total === 1 ? 'photo' : 'photos';
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 8;

  return (
    // Reanimated exception: position + animation transforms require style prop
    // eslint-disable-next-line react-native/no-inline-styles
    <Animated.View
      style={[containerStyle, { position: 'absolute', bottom: bottomOffset, left: 16, right: 16 }]}
      pointerEvents="box-none">
      <Pressable onPress={dismiss}>
        {/* shadow-lg via style — NativeWind shadow className inconsistent across platforms */}
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <View
          className="bg-white rounded-2xl px-4 py-3 gap-2"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}>
          {/* Header row */}
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: isComplete ? colors.successBg : colors.primaryMuted }}>
              {isComplete
                ? <CheckCircle size={16} color="#22c55e" strokeWidth={1.5} />
                : <CloudUpload size={16} color={colors.primary} strokeWidth={1.5} />}
            </View>
            <Text className="flex-1 text-sm font-semibold text-textDark">
              {isComplete
                ? t.common.uploadComplete
                : `${t.common.uploading} ${done}/${total} ${noun}...`}
            </Text>
            <Pressable onPress={dismiss} className="p-1">
              <X size={14} color={colors.textLight} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Progress bar — always rendered to prevent Reanimated crash on unmount during animation */}
          <View
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: isComplete ? colors.success + '1A' : colors.primary + '26' }}
            onLayout={e => {
              trackWidthSV.value = e.nativeEvent.layout.width;
            }}>
            <Animated.View
              className="h-full rounded-full"
              style={[progressBarStyle, { backgroundColor: isComplete ? '#22c55e' : colors.primary }]}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
