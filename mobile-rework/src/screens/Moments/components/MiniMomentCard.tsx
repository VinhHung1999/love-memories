import { Images } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import type { MomentRow } from '../useMomentsViewModel';

// T384 — compact square card for the 2nd+ moments of the selected day. Cover
// photo (or gradient fallback) + photo-count badge. Tap → open moment detail.

type Props = {
  moment: MomentRow;
  onPress: (id: string) => void;
};

export function MiniMomentCard({ moment, onPress }: Props) {
  const c = useAppColors();
  const cover = moment.photos[0];
  const photoCount = moment.photos.length;

  return (
    <Pressable
      onPress={() => onPress(moment.id)}
      accessibilityRole="button"
      className="flex-1 rounded-[22px] overflow-hidden bg-surface border border-line-on-surface shadow-card active:opacity-90"
    >
      <View className="aspect-square bg-surface-alt">
        {cover ? (
          <Image
            source={{ uri: cover.url }}
            resizeMode="cover"
            className="w-full h-full"
          />
        ) : (
          <LinearGradient
            colors={[c.primarySoft, c.primary]}
            className="w-full h-full"
          />
        )}
        {photoCount > 1 ? (
          <View
            className="absolute top-2 right-2 flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <Images size={11} strokeWidth={2} color="#ffffff" />
            <Text className="font-bodyBold text-white text-[10px]">
              {photoCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
