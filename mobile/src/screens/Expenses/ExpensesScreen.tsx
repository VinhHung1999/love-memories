import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Expense } from '../../lib/api';
import { useExpensesViewModel } from './useExpensesViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import TagBadge from '../../components/TagBadge';
import Skeleton from '../../components/Skeleton';
import AddExpenseSheet from './AddExpenseSheet';
import { EXPENSE_CATEGORIES, formatVND, getCategoryEmoji, getCategoryBg } from './expensesConstants';

// ── Skeleton ───────────────────────────────────────────────────────────────

function ExpenseSkeleton() {
  return (
    <View className="bg-white mx-4 rounded-3xl overflow-hidden mb-3">
      {[0, 1, 2].map(i => (
        <View key={i} className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-border/40' : ''}`}>
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

// ── Expense Row ────────────────────────────────────────────────────────────

function ExpenseRow({
  expense,
  isLast,
  onPress,
}: {
  expense: Expense;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${!isLast ? 'border-b border-border/40' : ''}`}>
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: getCategoryBg(expense.category) }}>
        <Text className="text-lg">{getCategoryEmoji(expense.category)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-textDark" numberOfLines={1}>
          {expense.description}
        </Text>
        {expense.note ? (
          <Text className="text-xs text-textMid mt-0.5" numberOfLines={1}>{expense.note}</Text>
        ) : null}
      </View>
      <Text className="text-sm font-bold text-textDark">{formatVND(expense.amount)}</Text>
    </Pressable>
  );
}

// ── Summary Card ───────────────────────────────────────────────────────────

function SummaryCard({
  total,
  count,
  breakdown,
}: {
  total: string;
  count: number;
  breakdown: ReturnType<typeof useExpensesViewModel>['categoryBreakdown'];
}) {
  const colors = useAppColors();
  return (
    <Animated.View entering={FadeInDown.duration(400)} className="mx-4 mb-4 rounded-3xl overflow-hidden">
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        className="px-5 pt-5 pb-4">
        <Text className="text-white/80 text-xs font-semibold tracking-[1px] uppercase mb-1">
          {t.expenses.totalSpent}
        </Text>
        <Text className="text-white text-3xl font-bold mb-1">{total}</Text>
        <Text className="text-white/60 text-xs mb-4">{count} {t.expenses.transactions}</Text>

        {breakdown.map(cat => (
          <View key={cat.key} className="mb-2.5">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm">{cat.emoji}</Text>
                <Text className="text-white/90 text-xs font-medium">{cat.label}</Text>
              </View>
              <Text className="text-white/80 text-xs font-semibold">{cat.percentage}%</Text>
            </View>
            <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white/70 rounded-full"
                style={{ width: `${cat.percentage}%` }}
              />
            </View>
          </View>
        ))}
      </LinearGradient>
    </Animated.View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function ExpensesScreen() {
  const colors = useAppColors();
  const vm = useExpensesViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  return (
    <View className="flex-1 bg-gray-50">
      <CollapsibleHeader
        title={t.expenses.title}
        subtitle={t.expenses.subtitle}
        expandedHeight={56}
        collapsedHeight={56}
        scrollY={scrollY}
      />

      {/* Month navigation */}
      <View className="flex-row items-center justify-between px-5 py-3 bg-gray-50 border-b border-border/40">
        <Pressable
          onPress={vm.prevMonth}
          className="w-9 h-9 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon name="chevron-left" size={18} color={colors.textMid} />
        </Pressable>

        <View className="items-center">
          <Text className="text-base font-bold text-textDark">{vm.monthLabel}</Text>
          {vm.isCurrentMonth && (
            <View className="mt-0.5 bg-primary/10 rounded-full px-2 py-[1px]">
              <Text className="text-[9px] font-bold text-primary tracking-wide">
                {t.expenses.currentBadge}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={vm.nextMonth}
          disabled={vm.isCurrentMonth}
          className={`w-9 h-9 items-center justify-center rounded-xl ${vm.isCurrentMonth ? 'opacity-30' : 'bg-white shadow-sm'}`}>
          <Icon name="chevron-right" size={18} color={colors.textMid} />
        </Pressable>
      </View>

      {vm.isLoading ? (
        <ScrollView scrollEnabled={false} className="flex-1">
          <View className="pt-4 pb-[100px]">
            <View className="mx-4 mb-4 rounded-3xl overflow-hidden h-[180px] bg-gray-200 animate-pulse" />
            <ExpenseSkeleton />
          </View>
        </ScrollView>
      ) : vm.isEmpty && vm.categoryBreakdown.length === 0 ? (
        <EmptyState
          icon="cash-multiple"
          title={t.expenses.emptyTitle}
          subtitle={t.expenses.emptySubtitle}
          actionLabel={t.expenses.emptyAction}
          onAction={vm.handleAdd}
        />
      ) : (
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={vm.refetch}
              tintColor={colors.primary}
            />
          }>
          <View className="pt-4 pb-[140px]">
            {/* Summary card */}
            {vm.categoryBreakdown.length > 0 && (
              <SummaryCard
                total={vm.formattedTotal}
                count={vm.totalCount}
                breakdown={vm.categoryBreakdown}
              />
            )}

            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3">
              <View className="flex-row gap-2 px-4 py-1">
                {EXPENSE_CATEGORIES.map(cat => (
                  <TagBadge
                    key={cat.key}
                    label={`${cat.emoji} ${cat.label}`}
                    active={vm.activeCategory === cat.key}
                    onPress={() => vm.setActiveCategory(cat.key as any)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Expense groups */}
            {vm.isEmpty ? (
              <View className="items-center py-12">
                <Text className="text-textLight text-sm">{t.expenses.noExpenses}</Text>
              </View>
            ) : (
              vm.groupedExpenses.map(group => (
                <Animated.View key={group.dateLabel} entering={FadeInDown.duration(300)}>
                  <View className="flex-row items-center justify-between px-5 mb-2">
                    <Text className="text-xs font-bold text-textLight tracking-[0.8px] uppercase">
                      {group.dateLabel}
                    </Text>
                    <Text className="text-xs font-semibold text-textMid">
                      {formatVND(group.dayTotal)}
                    </Text>
                  </View>

                  <View className="bg-white mx-4 rounded-3xl shadow-sm overflow-hidden mb-3">
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
          </View>
        </Animated.ScrollView>
      )}

      {/* FAB */}
      <Pressable
        onPress={vm.handleAdd}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{
          shadowColor: 'rgba(232,120,138,0.4)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 12,
        }}>
        <Icon name="plus" size={26} color="#fff" />
      </Pressable>

      {/* Add/Edit sheet */}
      {vm.showAddSheet && (
        <AddExpenseSheet
          editingExpense={vm.editingExpense}
          onClose={vm.handleSheetClose}
        />
      )}
    </View>
  );
}
