import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  count: number;
  activeIndex: number;
  durationMs?: number;
  onAdvance: () => void;
};

// T396 (Sprint 63) — Instagram-Stories-style progress bars along the top of
// the hero gallery. One bar per photo. The active bar animates width 0→100%
// over `durationMs`; on finish it fires `onAdvance` which nudges the parent
// `activeIndex` forward (parent decides wrap-around vs stop).
//
// Reanimated v4: the `useAnimatedStyle` worklet only reads `progress.value`
// — no theme colours captured inside. Per MEMORY.md `useAppColors()` must
// never be invoked inside a worklet.
export function StoriesProgressBar({
  count,
  activeIndex,
  durationMs = 6000,
  onAdvance,
}: Props) {
  if (count <= 1) return null;
  return (
    <View
      className="absolute left-4 right-4 flex-row gap-1 z-20"
      style={{ top: 0 }}
      pointerEvents="none"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Segment
          key={i}
          isActive={i === activeIndex}
          isCompleted={i < activeIndex}
          durationMs={durationMs}
          onFinish={onAdvance}
        />
      ))}
    </View>
  );
}

type SegmentProps = {
  isActive: boolean;
  isCompleted: boolean;
  durationMs: number;
  onFinish: () => void;
};

function Segment({ isActive, isCompleted, durationMs, onFinish }: SegmentProps) {
  const progress = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    if (isActive) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: durationMs }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    } else {
      progress.value = withTiming(isCompleted ? 1 : 0, { duration: 180 });
    }
  }, [isActive, isCompleted, durationMs, onFinish, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="flex-1 h-[2.5px] rounded-[2px] bg-white/30 overflow-hidden">
      <Animated.View
        className="h-full bg-white rounded-[2px]"
        style={fillStyle}
      />
    </View>
  );
}
