// Sprint 67 T453 — Heatmap calendar (prototype `recap.jsx` L197-266).
// 7-col grid of day cells, each cell tinted by intensity 0..4. Busiest
// day callout below + legend.
//
// RN has no CSS color-mix. We simulate the prototype's
// `color-mix(in oklab, primary X%, surfaceAlt)` via an opacity overlay:
// base bg = `bg-surface-alt`, an absolute child `bg-primary` with
// per-intensity opacity (0/0.25/0.5/0.75/1) sits on top. Conditional
// styling lives on `style` — className is a single static string per the
// NativeWind v4 conditional-className-crash rule.
//
// Layout: chunk heatmap into rows of 7 and render each row as a
// `flex-row` of `flex-1` cells with a fixed gap. RN doesn't honour
// CSS calc(); explicit row chunks lay out reliably without measuring
// container width.
//
// Intensity is BE-supplied via `heatmap[i]` (raw moment count per day).
// We bucket per render against the local max so a quiet month still
// shows variation. Same scoring the BE could do — kept on the client to
// avoid yet another response field.

import { useAppColors } from '@/theme/ThemeProvider';
import { Text, View } from 'react-native';

type Props = {
  heatmap: number[];   // length matches days in range
  hint: string;        // caption below grid (e.g. "Ngày nào mình cũng có gì đó để nói")
  legendLess: string;
  legendMore: string;
  busiestPrefix: string; // e.g. "ngày sôi nổi nhất"
  momentsLabel: string;  // e.g. "khoảnh khắc"
  // T456 (Sprint 67): optional per-cell labels. When provided (length must
  // match heatmap.length), each cell renders `labels[i]` instead of the
  // 1-based day number. Used by the Weekly recap to show weekday shorts
  // (T2 / T3 / … / CN). Monthly leaves this undefined and renders day
  // numbers as before.
  labels?: string[];
};

function bucketIntensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio >= 0.875) return 4;
  if (ratio >= 0.625) return 3;
  if (ratio >= 0.375) return 2;
  return 1;
}

const INTENSITY_OPACITY: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 0.25,
  2: 0.5,
  3: 0.75,
  4: 1,
};

function HeatCell({
  label,
  intensity,
  isBusy,
  borderColor,
}: {
  label: string | number;
  intensity: 0 | 1 | 2 | 3 | 4;
  isBusy: boolean;
  borderColor: string;
}) {
  const opacity = INTENSITY_OPACITY[intensity];
  const textIsLight = intensity >= 3;

  return (
    <View
      className="relative aspect-square flex-1 items-center justify-center overflow-hidden rounded-md bg-surface-alt"
      style={isBusy ? { borderWidth: 2, borderColor } : undefined}
    >
      <View
        className="absolute inset-0 rounded-md bg-primary"
        style={{ opacity }}
      />
      <Text
        className={
          textIsLight
            ? 'relative font-bodyBold text-[9px] text-white'
            : 'relative font-bodyBold text-[9px] text-ink-mute'
        }
      >
        {label}
      </Text>
    </View>
  );
}

function PadCell() {
  return <View className="aspect-square flex-1" />;
}

function LegendSwatch({ intensity }: { intensity: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <View className="relative h-2.5 w-2.5 overflow-hidden rounded-[2px] bg-surface-alt">
      <View
        className="absolute inset-0 rounded-[2px] bg-primary"
        style={{ opacity: INTENSITY_OPACITY[intensity] }}
      />
    </View>
  );
}

function chunk7<T>(arr: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += 7) {
    rows.push(arr.slice(i, i + 7));
  }
  return rows;
}

export function HeatmapGrid({
  heatmap,
  hint,
  legendLess,
  legendMore,
  busiestPrefix,
  momentsLabel,
  labels,
}: Props) {
  const c = useAppColors();
  const max = heatmap.reduce((m, n) => (n > m ? n : m), 0);
  const busiestDayIdx = heatmap.indexOf(max);
  const busiestDay = busiestDayIdx >= 0 && max > 0 ? busiestDayIdx + 1 : null;
  const busiestLabel =
    busiestDay !== null && labels ? labels[busiestDay - 1] ?? busiestDay : busiestDay;

  const rows = chunk7(heatmap);

  return (
    <View className="mt-3.5 rounded-[20px] border border-line bg-surface p-4">
      <View style={{ gap: 6 }}>
        {rows.map((row, rowIdx) => {
          // Pad incomplete final row so flex-1 keeps cells the same width
          // as the rows above.
          const padCount = 7 - row.length;
          const startDay = rowIdx * 7 + 1;
          return (
            <View key={rowIdx} className="flex-row" style={{ gap: 6 }}>
              {row.map((value, cellIdx) => {
                const day = startDay + cellIdx;
                const cellLabel = labels?.[day - 1] ?? day;
                return (
                  <HeatCell
                    key={day}
                    label={cellLabel}
                    intensity={bucketIntensity(value, max)}
                    isBusy={day === busiestDay}
                    borderColor={c.ink}
                  />
                );
              })}
              {Array.from({ length: padCount }).map((_, i) => (
                <PadCell key={`pad-${rowIdx}-${i}`} />
              ))}
            </View>
          );
        })}
      </View>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="font-body text-[11px] text-ink-mute">{hint}</Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-body text-[10px] text-ink-mute">{legendLess}</Text>
          <LegendSwatch intensity={0} />
          <LegendSwatch intensity={1} />
          <LegendSwatch intensity={2} />
          <LegendSwatch intensity={3} />
          <LegendSwatch intensity={4} />
          <Text className="font-body text-[10px] text-ink-mute">{legendMore}</Text>
        </View>
      </View>
      {busiestDay !== null ? (
        <View className="mt-3 flex-row items-center gap-2.5 rounded-xl bg-surface-alt px-3 py-2.5">
          <View className="h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Text className="font-displayBold text-[13px] text-white">{busiestLabel}</Text>
          </View>
          <View className="flex-1 flex-row">
            <Text className="font-bodyBold text-[12px] text-ink">{max}</Text>
            <Text className="font-body text-[12px] text-ink"> {momentsLabel} · {busiestPrefix}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
