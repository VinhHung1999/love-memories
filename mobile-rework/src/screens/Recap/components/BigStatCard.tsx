// Sprint 67 T453 — Stat card for section 01 By the numbers. Ports
// prototype `recap.jsx` L723-754 BigStatCard().
//
// Two sizes:
//   • `big`: 64px display number, full-width, 18px padding. Used for the
//     "moments" leader card.
//   • default: 38px number, 14px padding. Used for letters/trips/words.
//
// Decorative circle behind the number = `color` token at low opacity. RN
// can't do CSS color-mix; we simulate via an absolute-positioned colored
// circle over the bg color (overflow-hidden clips it inside the card).
//
// `bgClassName` and `colorClassName` are the static Tailwind classes the
// caller picks per stat (no conditional ternary in className per the
// NativeWind v4 conditional-className-crash rule).

import { Text, View } from 'react-native';

type Props = {
  value: string | number;
  label: string;
  bgClassName: string;     // e.g. 'bg-primary-soft'
  colorClassName: string;  // e.g. 'text-primary'
  circleClassName: string; // e.g. 'bg-primary'  (decorative circle)
  size?: 'big' | 'default';
};

export function BigStatCard({
  value,
  label,
  bgClassName,
  colorClassName,
  circleClassName,
  size = 'default',
}: Props) {
  const cardPad = size === 'big' ? 'px-[18px] pt-[18px] pb-4' : 'px-3.5 pt-3.5 pb-3';
  const numberSize = size === 'big' ? 'text-[64px] leading-[60px]' : 'text-[38px] leading-[36px]';
  const labelSize = size === 'big' ? 'text-[13px]' : 'text-[11px]';
  const minHeight = size === 'big' ? 'min-h-[100px]' : '';

  return (
    <View
      className={`relative overflow-hidden rounded-[18px] border border-line ${bgClassName} ${cardPad} ${minHeight}`}
    >
      <View
        className={`absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-30 ${circleClassName}`}
      />
      <Text className={`font-displayBold tracking-tight ${numberSize} ${colorClassName}`}>
        {String(value)}
      </Text>
      <Text className={`mt-1 font-bodySemibold uppercase tracking-wider text-ink-soft ${labelSize}`}>
        {label}
      </Text>
    </View>
  );
}
