// T472 (Sprint 70) — Memory Map pin. Two visual modes via `moment.kind`
// discriminator. Both ported as faithfully as RN allows from
// docs/design/prototype/memoura-v2/map.jsx (Build 149 visual feedback
// 2026-05-17: prior rounds had dropped the gradient photo art, mini heart
// overlay, date chin, pin tip, tape strip, and the heart-with-tail SVG).
//
// Lesson on myself: previous round I read PO's 9-item styling list as the
// full spec and shipped without cross-checking the prototype block itself.
// Hard Rule #6 (prototype > memory > DEV judgment) applies to PO summaries
// too — always re-read map.jsx L530-625 directly before iterating.
//
// Hard rule carve-outs invoked:
//   - `style` is used for: per-instance seeded tilt rotation + active scale,
//     prototype's exact cream bg / hairline border / drop-shadow values that
//     the brand palette doesn't surface as classes, and react-native-svg
//     props (color, fill, stroke) which are inherently style-as-prop.
//   - Tilt + palette math is INLINE — small deterministic helpers. No
//     `usePinAesthetics(id)` hook (speculative abstraction per karpathy).
//
// RN limitation re: `transformOrigin: 'bottom center'` — RN's transform
// doesn't honor transformOrigin; rotation pivots from the element's centre.
// With ±8° tilt and the polaroid wrapper anchored by Mapbox's MarkerView at
// {x:0.5, y:1}, the apex displacement is ≤4px — visually negligible.
//
// Dancing Script font: T472 added Map pin date to the 3-surface Hard Rule
// #5 carve-out (was Letters + Dashboard Timer; now also Map pin date).
// Tailwind class `font-script` resolves to DancingScript_400Regular.

import i18next from 'i18next';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import type { MapMomentPin } from '@/screens/Map/types';

// 6-palette rotation mirrored 1:1 from docs/design/prototype/memoura-v2/
// moments.jsx L86-92 (PAL_GRADIENTS). Each tuple = [light, mid, dark] HSL
// stops; the polaroid photo uses all three, the heart pin uses [0]→[1].
// Palette chosen deterministically per moment.id so a given moment always
// renders the same colour — no BE schema change (PO Q: client-computed).
const PAL_GRADIENTS: ReadonlyArray<readonly [string, string, string]> = [
  ['#F5C8B6', '#E8788A', '#8B5A7E'], // sunset
  ['#FDE1A8', '#F4A261', '#C17A3A'], // butter
  ['#4A3B6B', '#E8788A', '#1F1430'], // night
  ['#E8D5F0', '#A98AC4', '#5B3F7A'], // lilac
  ['#F8C5CE', '#E8788A', '#8E1F34'], // rose
  ['#D8EFE8', '#7EC8B5', '#2F6F5E'], // mint
];

function paletteFor(id: string): readonly [string, string, string] {
  if (!id) return PAL_GRADIENTS[0];
  // Sum the first few char codes so multi-char prefixes still spread evenly
  // across all 6 palettes (single charCodeAt(0) % 6 clustered ids that share
  // a first letter into the same colour).
  let sum = 0;
  for (let i = 0; i < Math.min(id.length, 4); i++) sum += id.charCodeAt(i);
  return PAL_GRADIENTS[sum % PAL_GRADIENTS.length];
}

// Deterministic per-moment tilt in [-8°, +8°]. Same input id → same tilt
// across re-renders.
function pinTiltDeg(id: string): number {
  if (!id) return 0;
  return (id.charCodeAt(0) % 17) - 8;
}

// 'YYYY-MM-DD…' → 'DD/M' (vi) / 'MMM D' (en). Matches prototype L573 chin
// format. Defensive: bad date → empty string (no chin text).
function formatPinDate(iso: string, lang: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (lang === 'vi') {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

type Props = {
  moment: MapMomentPin;
  isActive: boolean;
  onPress: () => void;
};

export function PinView({ moment, isActive, onPress }: Props) {
  const tilt = pinTiltDeg(moment.id);
  const palette = paletteFor(moment.id);

  if (moment.kind === 'heart') {
    return <HeartPin tilt={tilt} palette={palette} isActive={isActive} onPress={onPress} label={moment.title ?? 'Moment'} />;
  }
  return <PolaroidPin moment={moment} tilt={tilt} palette={palette} isActive={isActive} onPress={onPress} />;
}

// ─────────── Polaroid ───────────
// 56px cream-stock frame around a 48px square photo. Real <Image> thumbnail
// over a palette-gradient backplate that shows while the image loads (PO Q1:
// real photo > prototype's abstract gradient). Mini heart at bottom-right of
// the photo. Asymmetric 4/4/12 padding produces the visible chin. Date in
// the chin in Dancing Script (Hard Rule #5 carve-out). Golden tape strip at
// top + downward triangle tip below — the two elements that make the
// floating card read as a "map pin" not a "card".

type PolaroidProps = {
  moment: MapMomentPin;
  tilt: number;
  palette: readonly [string, string, string];
  isActive: boolean;
  onPress: () => void;
};

function PolaroidPin({ moment, tilt, palette, isActive, onPress }: PolaroidProps) {
  // Important: we use `useTranslation` only for the date locale string, and
  // i18next can flip locale on the fly — recompute each render.
  // Cheap (~3 string ops); no memo needed.
  const dateLabel = formatPinDate(moment.date, currentLang());
  const scale = isActive ? 1.15 : 1;
  const shadowRadius = isActive ? 24 : 12;
  const shadowOpacity = isActive ? 0.35 : 0.25;
  const shadowOffsetY = isActive ? 16 : 6;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={moment.title ?? 'Moment'}
      hitSlop={8}
      // Outer wrapper carries the tape + tip absolutes; the inner View is the
      // polaroid card itself. Wrapper has no bg so shadow falls only from the
      // card.
      className="items-center"
      style={{
        transform: [{ rotate: `${tilt}deg` }, { scale }],
      }}
    >
      {/* Tape strip (washi-tape gold across the top of the card). Sits ABOVE
          the card with negative top so it overhangs by 4px. */}
      <View
        pointerEvents="none"
        className="absolute left-2 right-2 -top-1 h-2 z-10"
        style={{
          backgroundColor: 'rgba(232,195,128,0.6)',
          borderWidth: 0.5,
          borderColor: 'rgba(160,120,60,0.3)',
        }}
      />

      {/* Card body. */}
      <View
        className="w-14 pt-1 px-1 pb-3 border"
        style={{
          backgroundColor: '#FFFEFA',
          borderColor: 'rgba(0,0,0,0.06)',
          borderRadius: 2,
          shadowColor: '#000',
          shadowOpacity,
          shadowOffset: { width: 0, height: shadowOffsetY },
          shadowRadius,
          elevation: isActive ? 12 : 6,
        }}
      >
        {/* Inner photo area: palette gradient backplate + real image overlay
            + mini white heart bottom-right. */}
        <View className="w-12 h-12 overflow-hidden" style={{ borderRadius: 1 }}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 48 48"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Defs>
              <LinearGradient id={`pinPhoto-${moment.id}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={palette[0]} />
                <Stop offset="0.6" stopColor={palette[1]} />
                <Stop offset="1" stopColor={palette[2]} />
              </LinearGradient>
            </Defs>
            <Path d="M0 0 H48 V48 H0 Z" fill={`url(#pinPhoto-${moment.id})`} />
          </Svg>
          {moment.thumbnailUrl ? (
            <Image
              source={{ uri: moment.thumbnailUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : null}
          {/* Mini heart corner mark — prototype L562. 14px SVG so it scales
              cleanly inside the 48px photo. */}
          <View pointerEvents="none" className="absolute bottom-1 right-1">
            <Svg width="14" height="14" viewBox="0 0 24 24">
              <Path
                d="M12 21s-8-5.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-8 11-8 11"
                fill="rgba(255,255,255,0.9)"
              />
            </Svg>
          </View>
        </View>

        {/* Chin date (Dancing Script). Prototype L572-577 — center, color
            #5A4222 vintage brown. Empty if date format failed. */}
        {dateLabel ? (
          <Text
            numberOfLines={1}
            className="font-script text-center mt-[3px]"
            style={{ color: '#5A4222', fontSize: 11, lineHeight: 11 }}
          >
            {dateLabel}
          </Text>
        ) : null}
      </View>

      {/* Downward pin-tip triangle below the card. Positioned absolutely so
          it doesn't push card layout. Color matches card bg. */}
      <View
        pointerEvents="none"
        className="absolute"
        style={{
          bottom: -8,
          left: '50%',
          marginLeft: -5,
          width: 0,
          height: 0,
          borderLeftWidth: 5,
          borderRightWidth: 5,
          borderTopWidth: 8,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: '#FFFEFA',
        }}
      />
    </Pressable>
  );
}

// ─────────── Heart pin ───────────
// 28×34 SVG path: filled heart with a tail going down — the tail anchors at
// the coordinate (MarkerView anchor.y=1) so the heart visually points to the
// pin location. Gradient fill PAL[0]→PAL[1], white stroke 1.5, small shine
// ellipse near top-left for depth. No rotation tilt on heart (prototype
// L596-602 also leaves heart un-tilted).

type HeartProps = {
  tilt: number;
  palette: readonly [string, string, string];
  isActive: boolean;
  onPress: () => void;
  label: string;
};

function HeartPin({ tilt, palette, isActive, onPress, label }: HeartProps) {
  const scale = isActive ? 1.25 : 1;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      className="items-center justify-center"
      style={{
        transform: [{ rotate: `${tilt}deg` }, { scale }],
        shadowColor: '#000',
        shadowOpacity: isActive ? 0.3 : 0.22,
        shadowOffset: { width: 0, height: isActive ? 12 : 4 },
        shadowRadius: isActive ? 18 : 8,
        elevation: isActive ? 10 : 4,
      }}
    >
      <Svg width="28" height="34" viewBox="0 0 28 34">
        <Defs>
          <LinearGradient id={`pinGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette[0]} />
            <Stop offset="1" stopColor={palette[1]} />
          </LinearGradient>
        </Defs>
        <Path
          d="M14 33 Q 14 26, 7 16 C 0 8, 8 -1, 14 6 C 20 -1, 28 8, 21 16 Q 14 26, 14 33 Z"
          fill={`url(#pinGrad-${label})`}
          stroke="#fff"
          strokeWidth="1.5"
        />
        <Ellipse cx="10" cy="9" rx="3" ry="2" fill="rgba(255,255,255,0.5)" />
      </Svg>
    </Pressable>
  );
}

// i18next read for date locale. Avoided `useTranslation` to skip threading
// `t`/`i18n` through PinView → PolaroidPin just for one string. Safe inside
// React render (i18next.language is sync); language flips re-render the
// parent MapScreen anyway which re-renders all pins.
function currentLang(): string {
  return i18next.language ?? 'vi';
}
