import { Images } from 'lucide-react-native';
import { Image, Pressable, Text, View } from 'react-native';

import { LinearGradient } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { useAppColors } from '@/theme/ThemeProvider';

import type { MomentRow } from '../useMomentsViewModel';
import { AuthorPill } from './AuthorPill';

// T384 — hero card for the selected day when there's ≥1 moment. 200px photo
// header (real cover photo or primary-gradient fallback) with count chip;
// title + caption footer. Tap → open moment detail route.

type Props = {
  moment: MomentRow;
  onPress: (id: string) => void;
};

export function DayHeroCard({ moment, onPress }: Props) {
  const c = useAppColors();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const cover = moment.photos[0];
  const photoCount = moment.photos.length;

  return (
    <Pressable
      onPress={() => onPress(moment.id)}
      accessibilityRole="button"
      className="rounded-[22px] overflow-hidden bg-surface border border-line-on-surface shadow-card active:opacity-90"
    >
      <View className="h-[200px] bg-surface-alt">
        {cover ? (
          <Image
            source={{ uri: cover.url }}
            resizeMode="cover"
            className="w-full h-full"
          />
        ) : (
          <LinearGradient
            colors={[c.primarySoft, c.primary, c.primaryDeep]}
            className="w-full h-full"
          />
        )}
        {/* T387 — author pill top-left per prototype moments2.jsx L355-376. */}
        <View className="absolute top-3 left-3">
          <AuthorPill
            authorId={moment.author.id}
            authorName={moment.author.name}
            currentUserId={currentUserId}
          />
        </View>
        {photoCount > 1 ? (
          <View
            className="absolute bottom-3 right-3 flex-row items-center gap-1 px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <Images size={12} strokeWidth={2} color="#ffffff" />
            <Text className="font-bodyBold text-white text-[11px]">
              1/{photoCount}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="px-4 py-3">
        <Text
          numberOfLines={1}
          className="font-displayMedium text-ink text-[20px] leading-[24px]"
        >
          {moment.title}
        </Text>
        {moment.caption ? (
          <Text
            numberOfLines={2}
            className="font-body text-ink-soft text-[13px] leading-[19px] mt-1"
          >
            {moment.caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
