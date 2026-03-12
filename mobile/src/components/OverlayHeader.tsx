import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react-native';

// Button bg — dark semi-transparent circle works on both image and white header
const BTN_BG = 'rgba(0,0,0,0.30)';

interface OverlayHeaderProps {
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  scrollY: SharedValue<number>;
  /** Scroll position where fade begins (default 80) */
  fadeStart?: number;
  /** Scroll position where header is fully opaque (default 200) */
  fadeEnd?: number;
}

function IconBtn({ onPress, icon: Icon }: { onPress?: () => void; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }) {
  if (!onPress) return null;
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-full"
      style={{ width: 36, height: 36, backgroundColor: BTN_BG }}>
      <Icon size={20} color="#FFFFFF" strokeWidth={1.5} />
    </Pressable>
  );
}

export default function OverlayHeader({
  onBack,
  onEdit,
  onDelete,
  scrollY,
  fadeStart = 80,
  fadeEnd = 200,
}: OverlayHeaderProps) {
  const insets = useSafeAreaInsets();

  // Header bg fades from transparent → white over fadeStart→fadeEnd (linear, scroll-coupled)
  const bgStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.max((scrollY.value - fadeStart) / (fadeEnd - fadeStart), 0), 1);
    return {
      backgroundColor: `rgba(255,255,255,${progress})`,
      borderBottomWidth: progress > 0.1 ? 1 : 0,
      borderBottomColor: '#F0E6E3',
    };
  });

  return (
    <Animated.View
      style={[
        bgStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top,
        },
      ]}>
      <View
        className="flex-row items-center justify-between px-4"
        style={{ height: 44 }}>
        {/* Back */}
        <IconBtn onPress={onBack} icon={ArrowLeft} />

        {/* Right actions */}
        <View className="flex-row gap-2">
          <IconBtn onPress={onEdit} icon={Pencil} />
          <IconBtn onPress={onDelete} icon={Trash2} />
        </View>
      </View>
    </Animated.View>
  );
}
