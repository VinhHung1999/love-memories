import React from 'react';
import { View, Pressable } from 'react-native';
import { Body, Caption, Heading } from '../../../components/Typography';
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
      <Animated.View entering={FadeInDown.delay(180).duration(500)} className="bg-white dark:bg-darkBgCard rounded-3xl px-5 pt-4 pb-5 border border-borderSoft dark:border-darkBorder">
        {/* Label row */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className="w-7 h-7 rounded-xl bg-expensePurple/10 items-center justify-center">
            <Banknote size={14} strokeWidth={1.5} />
          </View>
          <Caption className="font-headingSemi text-expensePurple tracking-[0.8px] uppercase">
            {t.dashboard.expenseWidget.label}
          </Caption>
        </View>

        {!hasData ? (
          <Body size="sm" className="font-bodyLight text-textMid dark:text-darkTextMid italic mt-1">
            {t.dashboard.expenseWidget.noData}
          </Body>
        ) : (
          <>
            <Heading size="sm" className="text-textDark dark:text-darkTextDark leading-none" style={{ fontSize: 20 }}>
              {formatVND(stats.total)}
            </Heading>
            <Body size="sm" className="text-textMid dark:text-darkTextMid mt-0.5 mb-4">
              {stats.count} {t.expenses.transactions}
            </Body>
            <View className="gap-2.5">
              {topCategories.map(({ cat, pct }) => (
                <View key={cat}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Caption className="text-textMid dark:text-darkTextMid font-bodyMedium">
                      {catEmoji[cat]} {catLabel[cat]}
                    </Caption>
                    <Caption className="text-textLight dark:text-darkTextLight font-headingSemi">{pct}%</Caption>
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
