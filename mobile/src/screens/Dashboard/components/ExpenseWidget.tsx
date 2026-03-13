import React from 'react';
import { Text, View, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Banknote } from 'lucide-react-native';
import t from '../../../locales/en';
import type { ExpenseStats } from '../../../lib/api';
import { formatVND, CATEGORY_EMOJI, EXPENSE_CATEGORIES } from '../../Expenses/expensesConstants';

interface ExpenseWidgetProps {
  stats: ExpenseStats | null;
  onPress: () => void;
}

export function ExpenseWidget({ stats, onPress }: ExpenseWidgetProps) {
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
    <Pressable onPress={onPress}>
      <Animated.View entering={FadeInDown.delay(180).duration(500)} className="bg-white rounded-3xl px-5 pt-4 pb-5 border border-borderSoft">
        {/* Label row */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-7 h-7 rounded-xl bg-expensePurple/10 items-center justify-center">
            <Banknote size={14} strokeWidth={1.5} />
          </View>
          <Text className="text-[11px] font-headingSemi text-expensePurple tracking-[0.8px] uppercase">
            {t.dashboard.expenseWidget.label}
          </Text>
        </View>

        {!hasData ? (
          <Text className="text-sm font-bodyLight text-textMid italic mt-1">
            {t.dashboard.expenseWidget.noData}
          </Text>
        ) : (
          <>
            <Text className="text-[20px] font-heading text-textDark leading-none">
              {formatVND(stats.total)}
            </Text>
            <Text className="text-xs font-body text-textMid mt-0.5 mb-4">
              {stats.count} {t.expenses.transactions}
            </Text>
            <View className="gap-2.5">
              {topCategories.map(({ cat, pct }) => (
                <View key={cat}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] text-textMid font-bodyMedium">
                      {catEmoji[cat]} {catLabel[cat]}
                    </Text>
                    <Text className="text-[10px] text-textLight font-headingSemi">{pct}%</Text>
                  </View>
                  <View className="h-1 bg-expensePurple/10 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-expensePurple rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}
