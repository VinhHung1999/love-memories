import React from 'react';
import { Pressable, View } from 'react-native';
import { Caption, Label } from '../../../components/Typography';
import { useAppColors } from '../../../navigation/theme';
import type { DatePlan } from '../../../types';
import t from '../../../locales/en';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PlanCard({ plan, onPress }: { plan: DatePlan; onPress: () => void }) {
  const colors = useAppColors();
  const doneStops = plan.stops.filter(s => s.done).length;
  const totalStops = plan.stops.length;
  const progress = totalStops > 0 ? doneStops / totalStops : 0;

  const statusBg =
    plan.status === 'active' ? colors.primary :
    plan.status === 'completed' ? colors.accent :
    colors.gray100;

  const statusText =
    plan.status === 'active' ? '#fff' :
    plan.status === 'completed' ? '#fff' :
    colors.textMid;

  const statusLabel =
    plan.status === 'active' ? t.datePlanner.statusActive :
    plan.status === 'completed' ? t.datePlanner.statusCompleted :
    t.datePlanner.statusPlanned;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-darkBgCard rounded-3xl px-4 py-4 mb-3">
      {/* Top row: date badge + status */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="rounded-xl px-2.5 py-1" style={{ backgroundColor: colors.primaryMuted }}>
          <Caption className="font-bold" style={{ color: colors.primary }}>
            {formatDate(plan.date)}
          </Caption>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusBg }}>
          <Caption className="font-semibold" style={{ color: statusText }}>
            {statusLabel}
          </Caption>
        </View>
      </View>

      {/* Title */}
      <Label className="text-textDark dark:text-darkTextDark mb-1">{plan.title}</Label>

      {/* Stops progress */}
      {totalStops > 0 ? (
        <View className="gap-1.5">
          <Caption className="text-textLight dark:text-darkTextLight">
            {t.datePlanner.stopsProgress
              .replace('{done}', String(doneStops))
              .replace('{total}', String(totalStops))}
          </Caption>
          <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.gray100 }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: colors.accent }}
            />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
