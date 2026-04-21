import { X } from 'lucide-react-native';
import { Image, Modal, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// T379 (Sprint 62) — DIY lightbox. Chose not to pull in
// react-native-awesome-gallery: its active branches target Reanimated 3 and
// this repo is on Reanimated v4 (same family that crashed Mapbox UserLocation
// in Sprint 60). A minimal composed Pinch + DoubleTap + Pan dismiss covers
// the spec (zoom + dismiss) without adding a compat risk.
//
// Gestures:
//   - PinchGesture → scale clamp [1, 4]
//   - DoubleTap    → toggle scale 1 ↔ 2.5
//   - Pan          → translateY (dismiss if |dy| > DISMISS_PX AND scale===1)
// Pan is gated on scale===1 so a zoomed user can't accidentally dismiss
// while inspecting the photo. Horizontal pagination inside the lightbox is
// explicitly out of scope — user dismisses and taps a different thumb.

type Props = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
};

const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_PX = 120;

export function PhotoLightbox({ visible, uri, onClose }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const resetTransforms = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateY.value = 0;
  };

  const handleClose = () => {
    resetTransforms();
    onClose();
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomed = scale.value > 1.01;
      const next = zoomed ? MIN_SCALE : DOUBLE_TAP_SCALE;
      scale.value = withTiming(next, { duration: 200 });
      savedScale.value = next;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1.01) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const canDismiss = scale.value <= 1.01 && Math.abs(e.translationY) > DISMISS_PX;
      if (canDismiss) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const composed = Gesture.Simultaneous(pinch, Gesture.Exclusive(doubleTap, pan));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const distance = Math.min(Math.abs(translateY.value) / DISMISS_PX, 1);
    return { opacity: 1 - distance * 0.4 };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={backdropStyle} className="flex-1 bg-black">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="flex-row justify-end px-4 pt-1">
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:opacity-80"
            >
              <X size={20} strokeWidth={2.3} color="#ffffff" />
            </Pressable>
          </View>
          <GestureDetector gesture={composed}>
            <Animated.View className="flex-1">
              {uri ? (
                <Animated.View style={imageStyle} className="flex-1">
                  <Image
                    source={{ uri }}
                    resizeMode="contain"
                    className="w-full h-full"
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
          </GestureDetector>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
