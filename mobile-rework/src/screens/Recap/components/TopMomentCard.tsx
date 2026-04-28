// Sprint 67 T453 — Top moment card for section 03 (prototype `recap.jsx`
// L757-798 TopMomentCard()). Gradient banner (from PAL_GRADIENTS) with
// rank chip top-left + title + sub on the white surface below. Two sizes:
//   • `big` — 180px banner, 18px title. Used for #1.
//   • default — 120px banner, 13px title. Used for #2 + #3.
//
// Tap → navigate to MomentDetail with the moment id.

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PAL_GRADIENTS, type PaletteKey } from '@/theme/palettes';

type Props = {
  id: string;
  rank: 1 | 2 | 3;
  palette: PaletteKey;
  title: string;
  sub: string;
  size?: 'big' | 'default';
};

export function TopMomentCard({
  id,
  rank,
  palette,
  title,
  sub,
  size = 'default',
}: Props) {
  const router = useRouter();
  const isBig = size === 'big';
  const grad = PAL_GRADIENTS[palette];

  const onPress = () => {
    router.push({ pathname: '/moment-detail', params: { id } });
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="overflow-hidden rounded-[22px] border border-line bg-surface active:opacity-80"
    >
      <LinearGradient
        colors={[grad[0], grad[1], grad[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: isBig ? 180 : 120 }}
      >
        <View className="absolute left-2.5 top-2.5 h-9 w-9 items-center justify-center rounded-full bg-white shadow-card">
          <Text className="font-displayBold text-[16px] text-ink">#{rank}</Text>
        </View>
      </LinearGradient>
      <View className={isBig ? 'px-4 pb-3.5 pt-3.5' : 'px-3 pb-3 pt-2.5'}>
        <Text
          numberOfLines={2}
          className={
            isBig
              ? 'font-displayMedium text-[18px] leading-[22px] text-ink'
              : 'font-displayMedium text-[13px] leading-[16px] text-ink'
          }
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          className={isBig ? 'mt-1 font-body text-[12px] text-ink-mute' : 'mt-0.5 font-body text-[10px] text-ink-mute'}
        >
          {sub}
        </Text>
      </View>
    </Pressable>
  );
}
