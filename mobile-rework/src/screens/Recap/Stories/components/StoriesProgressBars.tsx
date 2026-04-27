// Sprint 67 T459 — Top-of-screen progress bar row.
//
// One thin pill per slide. Past slides render full; the active slide
// fills based on `progress` (0..1) supplied by the controller; future
// slides render empty. Inline `style` carries the dynamic width — class
// stays static per the NativeWind v4 conditional-className-crash rule.

import { View } from 'react-native';

type Props = {
  total: number;
  index: number;
  progress: number; // 0..1 of active slide
};

export function StoriesProgressBars({ total, index, progress }: Props) {
  return (
    <View
      className="absolute left-3 right-3 top-2.5 z-50 flex-row gap-1"
      pointerEvents="none"
    >
      {Array.from({ length: total }).map((_, i) => {
        let widthPct = 0;
        if (i < index) widthPct = 100;
        else if (i === index) widthPct = Math.round(progress * 100);
        return (
          <View
            key={i}
            className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
          >
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${widthPct}%` }}
            />
          </View>
        );
      })}
    </View>
  );
}
