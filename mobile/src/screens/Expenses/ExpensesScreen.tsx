import React from 'react';
import {
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Heading, Body, Caption } from '../../components/Typography';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { Banknote, ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import { useTranslation } from 'react-i18next';
import type { Expense, DailyStats } from '../../lib/api';
import { useExpensesViewModel } from './useExpensesViewModel';
import ListHeader from '../../components/ListHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import {
  EXPENSE_CATEGORIES,
  formatVND,
  getCategoryEmoji,
  getCategoryBg,
  CATEGORY_CHART_COLORS,
  CHART_CATEGORY_ORDER,
  formatShortVND,
  computeChartTicks,
  toLocalDateString,
} from './expensesConstants';
import HeaderIcon from '@/components/HeaderIcon';

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function ExpenseSkeleton() {
  const colors = useAppColors();
  return (
    <View className="bg-white dark:bg-darkBgCard mx-4 rounded-3xl overflow-hidden mb-3">
      {[0, 1, 2].map(i => (
        <View key={i} className="flex-row items-center gap-3 px-4 py-3.5" style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border + '66' }}>
          <Skeleton className="w-10 h-10 rounded-2xl" />
          <View className="flex-1">
            <Skeleton className="w-2/3 h-3.5 rounded-md mb-1.5" />
            <Skeleton className="w-1/3 h-2.5 rounded-md" />
          </View>
          <Skeleton className="w-16 h-3.5 rounded-md" />
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expense Row
// ─────────────────────────────────────────────────────────────────────────────

function ExpenseRow({ expense, isLast, onPress }: { expense: Expense; isLast: boolean; onPress: () => void }) {
  const colors = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5"
      style={{ borderBottomWidth: !isLast ? 1 : 0, borderBottomColor: colors.border + '66' }}>
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getCategoryBg(expense.category) }}>
        <Text className="text-lg">{getCategoryEmoji(expense.category)}</Text>
      </View>
      <View className="flex-1">
        <Body size="sm" className="font-semibold text-textDark dark:text-darkTextDark" numberOfLines={1}>{expense.description}</Body>
        {expense.note ? <Caption className="text-textMid dark:text-darkTextMid mt-0.5" numberOfLines={1}>{expense.note}</Caption> : null}
      </View>
      <Body size="sm" className="font-bold text-textDark dark:text-darkTextDark">{formatVND(expense.amount)}</Body>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary Card (with over-limit warnings)
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({ total, count, breakdown }: {
  total: string;
  count: number;
  breakdown: ReturnType<typeof useExpensesViewModel>['categoryBreakdown'];
}) {
  const { t } = useTranslation();
  const themeColors = useAppColors();
  const overLimitCount = breakdown.filter(c => c.overLimit).length;

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mb-4 rounded-3xl overflow-hidden bg-white dark:bg-darkBgCard border border-borderSoft dark:border-darkBorder">
      <View className="px-5 pt-5 pb-4">
        <Caption className="text-textMid dark:text-darkTextMid font-semibold tracking-[1px] uppercase mb-1">{t('expenses.totalSpent')}</Caption>
        <View className="flex-row items-end justify-between mb-1">
          <Heading size="xl" className="text-textDark dark:text-darkTextDark">{total}</Heading>
          {overLimitCount > 0 && (
            <View className="flex-row items-center gap-1 bg-error/10 rounded-full px-2.5 py-1">
              <Text className="text-sm">⚠️</Text>
              <Caption className="text-error font-bold">{overLimitCount} over</Caption>
            </View>
          )}
        </View>
        <Caption className="text-textLight dark:text-darkTextLight mb-4">{count} {t('expenses.transactions')}</Caption>
        {breakdown.map(cat => (
          <View key={cat.key} className="mb-2.5">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm">{cat.emoji}</Text>
                <Caption className="text-textMid dark:text-darkTextMid font-medium">{cat.label}</Caption>
                {cat.overLimit && <Text className="text-xs">⚠️</Text>}
              </View>
              <View className="flex-row items-center gap-1.5">
                {cat.limitPct !== null && (
                  <Caption className="font-bold" style={{ color: cat.overLimit ? themeColors.errorColor : themeColors.textLight }}>
                    {cat.limitPct}%
                  </Caption>
                )}
                <Caption className="text-textDark dark:text-darkTextDark font-semibold">{cat.formattedAmount}</Caption>
              </View>
            </View>
            <View className="h-1.5 bg-borderSoft rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(cat.limitPct ?? cat.percentage, 100)}%`, backgroundColor: cat.overLimit ? themeColors.errorColor : themeColors.primary }}
              />
            </View>
            {cat.overLimit && cat.limit !== null && (
              <Caption className="text-error mt-0.5 text-right">
                +{formatVND(cat.amount - cat.limit)} {t('expenses.budget.overBudget')}
              </Caption>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Spending Chart (View-based, 7-day Mon-Sun, Y-axis labels)
// ─────────────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function WeeklySpendingChart({ dailyStats }: { dailyStats: DailyStats | null }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const colors = useAppColors();

  // Compute Mon-Sun of current week (use local date to avoid UTC shift)
  const today = new Date();
  const todayStr = toLocalDateString(today);
  const dow = today.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : -(dow - 1);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMon + i);
    const dateStr = toLocalDateString(d);
    return { date: dateStr, label: DAY_LABELS[i]!, isToday: dateStr === todayStr };
  });

  const dayDataMap = new Map(dailyStats?.days.map(d => [d.date, d]) ?? []);
  const weekData = weekDays.map(wd => ({
    ...wd,
    total: dayDataMap.get(wd.date)?.total ?? 0,
    byCategory: dayDataMap.get(wd.date)?.byCategory ?? {} as Record<string, number>,
  }));

  if (weekData.every(d => d.total === 0)) return null;

  const maxAmount = Math.max(...weekData.map(d => d.total));
  const ticks = computeChartTicks(maxAmount);
  const tickMax = ticks[ticks.length - 1]!;

  const BAR_AREA_H = 110;
  const Y_AXIS_W = 38;
  const BAR_W = Math.floor((width - 32 - Y_AXIS_W - 4) / 7) - 4;
  const activeCategories = CHART_CATEGORY_ORDER.filter(cat =>
    weekData.some(d => (d.byCategory[cat] ?? 0) > 0),
  );

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="bg-white dark:bg-darkBgCard rounded-3xl overflow-hidden mx-4 mb-4 px-4 pt-4 pb-3">
      {/* Header + legend */}
      <View className="flex-row items-center justify-between mb-3">
        <Caption className="font-bold text-textLight dark:text-darkTextLight tracking-[0.8px] uppercase">
          {t('expenses.chart.title')}
        </Caption>
        <View className="flex-row flex-wrap gap-x-2 gap-y-1 justify-end max-w-[180px]">
          {activeCategories.map(cat => (
            <View key={cat} className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_CHART_COLORS[cat] }} />
              <Caption className="text-textLight dark:text-darkTextLight">{EXPENSE_CATEGORIES.find(c => c.key === cat)?.label ?? cat}</Caption>
            </View>
          ))}
        </View>
      </View>

      {/* Chart: Y-axis + bars */}
      <View className="flex-row">
        {/* Y-axis labels: top (max) → bottom (0) */}
        <View style={{ width: Y_AXIS_W, height: BAR_AREA_H, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
          {ticks.slice().reverse().map((tick, i) => (
            <Caption key={i} className="text-textLight dark:text-darkTextLight leading-none">
              {formatShortVND(tick)}
            </Caption>
          ))}
        </View>

        {/* Bars area with gridlines */}
        <View className="flex-1" style={{ height: BAR_AREA_H }}>
          {/* Horizontal gridlines */}
          {ticks.map((tick, i) => (
            <View
              key={i}
              style={{
                position: 'absolute', left: 0, right: 0,
                bottom: i === 0 ? 0 : Math.round((tick / tickMax) * BAR_AREA_H) - 1,
                height: 1,
                backgroundColor: i === 0 ? colors.border : `${colors.border}40`,
              }}
            />
          ))}

          {/* Bars row */}
          <View className="flex-row items-end justify-around" style={{ height: BAR_AREA_H }}>
            {weekData.map((day, i) => {
              const barH = day.total === 0
                ? 0
                : Math.max(3, Math.round((day.total / tickMax) * BAR_AREA_H));
              const segments = CHART_CATEGORY_ORDER
                .map(cat => ({ cat, amount: day.byCategory[cat] ?? 0 }))
                .filter(s => s.amount > 0);

              return (
                <View key={i} className="items-center">
                  {/* Today dot above bar */}
                  {day.isToday && <View className="w-1.5 h-1.5 rounded-full bg-primary mb-0.5" />}
                  <View style={{
                    width: BAR_W,
                    height: Math.max(barH, day.total === 0 ? 2 : 3),
                    borderRadius: 4,
                    overflow: 'hidden',
                    flexDirection: 'column-reverse',
                    opacity: day.isToday ? 1 : 0.72,
                    backgroundColor: day.total === 0 ? `${colors.border}60` : undefined,
                  }}>
                    {segments.map(({ cat, amount }) => {
                      const segH = Math.max(1, Math.round((amount / day.total) * barH));
                      return (
                        <View key={cat} style={{ width: BAR_W, height: segH, backgroundColor: CATEGORY_CHART_COLORS[cat] }} />
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis labels */}
      <View className="flex-row justify-around mt-1.5" style={{ paddingLeft: Y_AXIS_W }}>
        {weekData.map((day, i) => (
          <Caption key={i} className="text-center" style={{ color: day.isToday ? colors.primary : colors.textLight, fontWeight: day.isToday ? 'bold' : 'normal', fontSize: 9 }}>
            {day.label}
          </Caption>
        ))}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const vm = useExpensesViewModel();

  // Build a quick map of limitPct/overLimit per category key for chip display
  const chipLimitMap = React.useMemo(() => {
    const map: Record<string, { pct: number; over: boolean } | null> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      if (cat.key === 'all') { map[cat.key] = null; continue; }
      const bd = vm.categoryBreakdown.find(b => b.key === cat.key);
      map[cat.key] = bd?.limitPct !== null && bd?.limitPct !== undefined
        ? { pct: bd.limitPct, over: bd.overLimit }
        : null;
    }
    return map;
  }, [vm.categoryBreakdown]);

  return (
    <View className="flex-1 bg-baseBg dark:bg-darkBaseBg">
      <ListHeader
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle')}
        onBack={vm.handleBack}
        right={
          <View className="flex-row items-center gap-2">
            <HeaderIcon icon={SlidersHorizontal} onPress={vm.handleOpenBudget}/>
            <TouchableOpacity
              onPress={vm.handleAdd}
              className="w-10 h-10 rounded-full items-center justify-center bg-primary"
            >
              <Plus size={22} strokeWidth={1.5} color='white'/>
            </TouchableOpacity>
          </View>
        }
        filterBar={
          <View className="flex-row items-center justify-between px-5 py-3 bg-gray-50 border-b border-border dark:border-darkBorder/40">
            <Pressable onPress={vm.prevMonth} className="w-9 h-9 items-center justify-center rounded-xl bg-white dark:bg-darkBgCard">
              <ChevronLeft size={18} color={colors.textMid} strokeWidth={1.5} />
            </Pressable>
            <View className="items-center">
              <Heading size="sm" className="text-textDark dark:text-darkTextDark">{vm.monthLabel}</Heading>
              {vm.isCurrentMonth && (
                <View className="mt-0.5 bg-primary/10 rounded-full px-2 py-[1px]">
                  <Caption className="font-bold text-primary tracking-wide">{t('expenses.currentBadge')}</Caption>
                </View>
              )}
            </View>
            <Pressable onPress={vm.nextMonth} disabled={vm.isCurrentMonth}
              className="w-9 h-9 items-center justify-center rounded-xl"
              style={{ opacity: vm.isCurrentMonth ? 0.3 : 1, backgroundColor: vm.isCurrentMonth ? undefined : colors.bgCard }}>
              <ChevronRight size={18} color={colors.textMid} strokeWidth={1.5} />
            </Pressable>
          </View>
        }
      />

     

      {/* Always use Animated.ScrollView to prevent Reanimated v4 unmount crash */}
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={false} onRefresh={vm.refetch} tintColor={colors.primary} />}
      >
        <View key={vm.monthLabel} className="pt-4 pb-[140px]">
          {vm.isLoading ? (
            <>
              <View className="mx-4 mb-4 rounded-3xl overflow-hidden h-[180px] bg-gray-200 animate-pulse" />
              <ExpenseSkeleton />
            </>
          ) : vm.isEmpty && vm.categoryBreakdown.length === 0 ? (
            <EmptyState
              icon={Banknote}
              title={t('expenses.emptyTitle')}
              subtitle={t('expenses.emptySubtitle')}
              actionLabel={t('expenses.emptyAction')}
              onAction={vm.handleAdd}
            />
          ) : (
            <>
              {vm.categoryBreakdown.length > 0 && (
                <SummaryCard total={vm.formattedTotal} count={vm.totalCount} breakdown={vm.categoryBreakdown} />
              )}

              <WeeklySpendingChart dailyStats={vm.currentDailyStats} />

              {/* Category filter chips with limit % indicator */}
              <View className="mb-3">
                <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 px-4 py-1">
                    {EXPENSE_CATEGORIES.map(cat => {
                      const limitInfo = chipLimitMap[cat.key] ?? null;
                      return (
                        <View key={cat.key} className="items-center">
                          <TagBadge
                            label={`${cat.emoji} ${cat.label}`}
                            active={vm.activeCategory === cat.key}
                            onPress={() => vm.setActiveCategory(cat.key as any)}
                          />
                          {limitInfo && cat.key !== 'all' && (
                            <Caption className="mt-0.5 font-semibold" style={{ color: limitInfo.over ? colors.errorColor : colors.textMid, fontSize: 8 }}>
                              {limitInfo.pct}%
                            </Caption>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </Animated.ScrollView>
              </View>

              {vm.isEmpty ? (
                <View className="items-center py-12">
                  <Body size="sm" className="text-textLight dark:text-darkTextLight">{t('expenses.noExpenses')}</Body>
                </View>
              ) : (
                vm.groupedExpenses.map(group => (
                  <Animated.View key={group.dateLabel} entering={FadeInDown.duration(300)}>
                    <View className="flex-row items-center justify-between px-5 mb-2">
                      <Caption className="font-bold text-textLight dark:text-darkTextLight tracking-[0.8px] uppercase">{group.dateLabel}</Caption>
                      <Caption className="font-semibold text-textMid dark:text-darkTextMid">{formatVND(group.dayTotal)}</Caption>
                    </View>
                    <View className="bg-white dark:bg-darkBgCard mx-4 rounded-3xl overflow-hidden mb-3">
                      {group.expenses.map((expense, idx) => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          isLast={idx === group.expenses.length - 1}
                          onPress={() => vm.handleExpensePress(expense)}
                        />
                      ))}
                    </View>
                  </Animated.View>
                ))
              )}
            </>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
