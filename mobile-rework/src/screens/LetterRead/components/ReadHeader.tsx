import { ChevronLeft, Share2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// T422 (Sprint 65) — top bar over the gradient hero. White-glass back button
// (36×36 chevron), accent date center, white-glass share button right.
// Mirrors prototype `letters.jsx` L302-323. Sits inside a colored gradient
// region so all foreground is white-on-translucent — `bg-white/[0.22]` for
// the chips, `text-white` for typography, with a subtle text shadow for
// legibility against any palette.

type Props = {
  dateLabel: string;
  onBack: () => void;
  onShare: () => void;
};

export function ReadHeader({ dateLabel, onBack, onShare }: Props) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-1">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="w-9 h-9 rounded-full bg-white/[0.22] items-center justify-center active:opacity-70"
      >
        <ChevronLeft size={18} strokeWidth={2.4} color="#ffffff" />
      </Pressable>

      <Text
        className="font-script text-white/90 text-[18px] leading-[20px]"
        style={{ textShadowColor: 'rgba(0,0,0,0.18)', textShadowRadius: 4 }}
        numberOfLines={1}
      >
        {dateLabel}
      </Text>

      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Share"
        className="w-9 h-9 rounded-full bg-white/[0.22] items-center justify-center active:opacity-70"
      >
        <Share2 size={16} strokeWidth={2.2} color="#ffffff" />
      </Pressable>
    </View>
  );
}
