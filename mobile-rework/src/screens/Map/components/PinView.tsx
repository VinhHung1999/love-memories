// T472 (Sprint 70) — Memory Map. One pin component, two visual modes via
// `moment.kind` discriminator. Polaroid = vintage cream-stock card around the
// moment's thumbnail. Heart = chunky deep-rose heart icon for moments without
// a photo (per locked contract in types.ts). Merging keeps the wrapper, tilt
// math, and tap-target identical across both.
//
// Polaroid styling locked to docs/design/prototype/memoura-v2/map.jsx L552-580
// (Build 148 visual feedback 2026-05-17 — initial palette-tinted larger frame
// was off-prototype). PO Q1 verdict: keep real <Image> thumbnail (more
// meaningful than the prototype's abstract palette gradient — BE has actual
// moments). PO Q2 verdict: drop the chin text (asymmetric padding already
// gives the visual chin; title lives in the preview card on tap).
//
// Hard rule carve-outs invoked:
//   - `style` is used for: seeded tilt rotation (className can't express
//     per-instance dynamic transform), the prototype's exact cream bg /
//     hairline border / drop-shadow values that the brand palette doesn't
//     surface as classes.
//   - Tilt math is INLINE — a 2-line deterministic function. No
//     `usePinAesthetics(id)` hook (speculative abstraction per karpathy).
//
// RN limitation noted: prototype uses CSS `transformOrigin: bottom center`
// for tilt around the photo's bottom edge. RN's transform doesn't honor
// transformOrigin; rotation pivots from the element's center. With ±8°
// tilt of a 56px element the apex displacement is ≤4px — invisible against
// the Mapbox tile background and the MarkerView `anchor={{x:0.5,y:1}}`
// already pins the pin's bottom to the coordinate. Not worth a wrapper.

import { Image, Pressable, View } from 'react-native';
import { Heart } from 'lucide-react-native';

import type { MapMomentPin } from '@/screens/Map/types';
import { useAppColors } from '@/theme/ThemeProvider';

// Deterministic per-moment tilt in [-8°, +8°]. Same input id → same tilt
// across re-renders. `charCodeAt(0) % 17` lands in 0..16; subtract 8.
function pinTiltDeg(id: string): number {
  if (!id) return 0;
  return (id.charCodeAt(0) % 17) - 8;
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

  // Polaroid path. Cream-stock 56px frame around a 48px square photo with
  // asymmetric padding (4/4/12) → visible bottom chin. No chin text — title
  // shows in the preview card on tap.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={moment.title ?? 'Moment'}
      hitSlop={8}
      className="w-14 pt-1 px-1 pb-3 border"
      style={{
        backgroundColor: '#FFFEFA',
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 2,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 6,
        transform: [{ rotate: `${tilt}deg` }],
      }}
    >
      <View className="w-12 h-12 rounded-sm bg-surface overflow-hidden">
        {moment.thumbnailUrl ? (
          <Image
            source={{ uri: moment.thumbnailUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          // Defensive — BE promotes photo-less moments to kind=heart, but the
          // contract allows null thumbnailUrl so we don't crash.
          <View className="w-full h-full items-center justify-center">
            <Heart size={20} color={colors.primaryDeep} fill={colors.primaryDeep} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
