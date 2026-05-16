// T472 (Sprint 70) — Memory Map. One pin component, two visual modes via
// `moment.kind` discriminator. Polaroid = framed thumbnail card with a kicker.
// Heart = chunky deep-rose heart icon when the moment has no photo (locked
// contract from types.ts). Merging keeps the wrapper, tilt math, palette
// rotation, and tap-target identical across both — karpathy verdict over
// two parallel files.
//
// Hard rule carve-outs invoked:
//   - `style` is used ONLY for the seeded tilt + palette tint (Animated.Value-
//     -like dynamism a className can't express). Layout, sizing, typography
//     all stay on `className`.
//   - Tilt + palette math is INLINE — a 6-line deterministic function. No
//     `usePinAesthetics(id)` hook (speculative abstraction per karpathy).

import { Image, Pressable, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';

import type { MapMomentPin } from '@/screens/Map/types';
import { useAppColors } from '@/theme/ThemeProvider';

// 5-color rotation. HSL-ish frame tints that look correct on both Brand and
// Evolve palettes — saturated enough to register as colored polaroid stock,
// muted enough they don't fight the photo. Rotation index = char-code mod 5
// of the moment id so a given moment always renders the same colour.
const FRAME_TINTS = ['#FFE9CC', '#FFD4D6', '#E4D7F2', '#FFF1B8', '#D8EFD3'] as const;

// Deterministic per-moment tilt in [-8°, +8°]. Same input id → same tilt
// across re-renders. `charCodeAt(0) % 17` lands in 0..16; subtract 8.
function pinTiltDeg(id: string): number {
  if (!id) return 0;
  return (id.charCodeAt(0) % 17) - 8;
}

function pinFrameTint(id: string): string {
  if (!id) return FRAME_TINTS[0];
  // Second character so the tint doesn't strictly co-vary with the tilt.
  const idx = (id.length > 1 ? id.charCodeAt(1) : id.charCodeAt(0)) % FRAME_TINTS.length;
  return FRAME_TINTS[idx];
}

type Props = {
  moment: MapMomentPin;
  onPress: () => void;
};

export function PinView({ moment, onPress }: Props) {
  const colors = useAppColors();
  const tilt = pinTiltDeg(moment.id);

  if (moment.kind === 'heart') {
    // No photo → chunky filled heart in the brand deep rose. 36px so it's
    // tap-friendly without overpowering polaroid neighbours.
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={moment.title ?? 'Moment'}
        hitSlop={8}
        className="items-center justify-center"
        style={{ transform: [{ rotate: `${tilt}deg` }] }}
      >
        <Heart
          size={36}
          color={colors.primaryDeep}
          fill={colors.primaryDeep}
          strokeWidth={1.5}
        />
      </Pressable>
    );
  }

  // Polaroid path. Outer frame uses a seeded tint; inner image area falls back
  // to a soft surface tile if `thumbnailUrl` is null (defensive — the BE
  // should already promote photo-less moments to 'heart', but the contract
  // allows `thumbnailUrl: null` so we don't crash).
  const tint = pinFrameTint(moment.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={moment.title ?? 'Moment'}
      hitSlop={6}
      className="w-[68px] rounded-md shadow-sm overflow-hidden"
      style={{
        backgroundColor: tint,
        transform: [{ rotate: `${tilt}deg` }],
      }}
    >
      <View className="w-full aspect-square bg-surface">
        {moment.thumbnailUrl ? (
          <Image
            source={{ uri: moment.thumbnailUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Heart size={20} color={colors.primaryDeep} fill={colors.primaryDeep} />
          </View>
        )}
      </View>
      {/* Polaroid chin. Kept compact (h-5) — full title lives in the preview
          card; chin only carries a hint that it's a captured moment. */}
      <View className="h-5 items-center justify-center px-1">
        <Text
          numberOfLines={1}
          className="text-[9px] font-body text-ink/80"
        >
          {moment.title ?? ' '}
        </Text>
      </View>
    </Pressable>
  );
}
