import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import type { ExpenseStats } from '../../../lib/api';
import { formatVND, CATEGORY_EMOJI, EXPENSE_CATEGORIES } from '../../Expenses/expensesConstants';
import { GradientCard } from '../../../components/GradientCard';

interface ExpenseWidgetProps {
  stats: ExpenseStats | null;
  onPress: () => void;
}

export function ExpenseWidget({ stats, onPress }: ExpenseWidgetProps) {
  const colors = useAppColors();
  const hasData = stats && stats.count > 0;

  const topCategories = hasData
    ? (Object.entries(stats.byCategory) as [string, { total: number; count: number }][])
        .filter(([, v]) => v.total > 0)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 2)
        .map(([cat, v]) => ({
          cat,
          pct: Math.round((v.total / stats.total) * 100),
        }))
    : [];

  // Use shared constants from expensesConstants (avoids duplicating emoji/label maps)
  const catEmoji = CATEGORY_EMOJI;
  const catLabel: Record<string, string> = Object.fromEntries(
    EXPENSE_CATEGORIES.filter(c => c.key !== 'all').map(c => [c.key, c.label]),
  );

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(500)} className="rounded-3xl overflow-hidden shadow-sm">
      <GradientCard
        colors={[colors.expensePurple, colors.expensePurpleDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-5 pt-4 pb-5"
        onPress={onPress}>
        {/* Label row */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-7 h-7 rounded-xl bg-white/15 items-center justify-center">
            <Icon name="cash-multiple" size={14} color="#fff" />
          </View>
          <Text className="text-[11px] font-semibold text-white/50 tracking-[0.8px] uppercase">
            {t.dashboard.expenseWidget.label}
          </Text>
        </View>

        {!hasData ? (
          <Text className="text-sm text-white/40 italic mt-1">
            {t.dashboard.expenseWidget.noData}
          </Text>
        ) : (
          <>
            <Text className="text-[28px] font-bold text-white leading-none">
              {formatVND(stats.total)}
            </Text>
            <Text className="text-xs text-white/50 mt-0.5 mb-4">
              {stats.count} {t.expenses.transactions}
            </Text>
            <View className="gap-2.5">
              {topCategories.map(({ cat, pct }) => (
                <View key={cat}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] text-white/70 font-medium">
                      {catEmoji[cat]} {catLabel[cat]}
                    </Text>
                    <Text className="text-[10px] text-white/50 font-semibold">{pct}%</Text>
                  </View>
                  <View className="h-1 bg-white/15 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-white/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </GradientCard>
    </Animated.View>
  );
}
