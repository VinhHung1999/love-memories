import React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Caption } from '../../components/Typography';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CalendarHeart, Heart, Plus } from 'lucide-react-native';
 // used in FAB
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useWishesViewModel, WISH_CATEGORIES } from './useWishesViewModel';
import WishCard from './components/WishCard';
import WishFormSheet from './components/WishFormSheet';
import ListHeader from '../../components/ListHeader';
import EmptyState from '../../components/EmptyState';
import HeaderIcon from '../../components/HeaderIcon';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import type { DateWish } from '../../types';
import { FAB } from '@/components/FAB';

const STATUS_FILTERS = [
  { key: 'all', label: t.datePlanner.allFilter },
  { key: 'pending', label: `⏳ ${t.datePlanner.pendingFilter}` },
  { key: 'done', label: `✅ ${t.datePlanner.doneFilter}` },
] as const;

export default function WishesScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useWishesViewModel();

  return (
    <View className="flex-1">
      <ListHeader
        title={t.datePlanner.wishesTitle}
        subtitle={t.datePlanner.wishesSubtitle}
        onBack={vm.handleBack}
        right={<HeaderIcon icon={CalendarHeart} onPress={vm.handleNavigatePlans} />}
        filterBar={
          <View style={{ backgroundColor: colors.background }}>
            {/* Status filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pt-2">
              <View className="flex-row gap-2 pb-2 pr-4">
                {STATUS_FILTERS.map(f => (
                  <Pressable
                    key={f.key}
                    onPress={() => vm.setStatusFilter(f.key)}
                    className="rounded-xl px-3 py-1.5"
                    style={{
                      backgroundColor: vm.statusFilter === f.key ? colors.primary : colors.gray100,
                    }}>
                    <Caption
                      className="font-semibold"
                      style={{ color: vm.statusFilter === f.key ? colors.white : colors.textMid }}>
                      {f.label}
                    </Caption>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {/* Category filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              <View className="flex-row gap-2 pb-2 pr-4">
                <Pressable
                  onPress={() => vm.setCategoryFilter(null)}
                  className="rounded-xl px-3 py-1.5"
                  style={{
                    backgroundColor: !vm.categoryFilter ? colors.secondary : colors.gray100,
                  }}>
                  <Caption
                    className="font-semibold"
                    style={{ color: !vm.categoryFilter ? colors.white : colors.textMid }}>
                    {t.datePlanner.allFilter}
                  </Caption>
                </Pressable>
                {WISH_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.key}
                    onPress={() => vm.setCategoryFilter(cat.key)}
                    className="rounded-xl px-3 py-1.5 flex-row items-center gap-1"
                    style={{
                      backgroundColor: vm.categoryFilter === cat.key ? colors.secondary : colors.gray100,
                    }}>
                    <Caption>{cat.emoji}</Caption>
                    <Caption
                      className="font-medium"
                      style={{ color: vm.categoryFilter === cat.key ? colors.white : colors.textMid }}>
                      {cat.label}
                    </Caption>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        }
      />

      {vm.isEmpty && !vm.isLoading ? (
        <EmptyState
          icon={Heart}
          title={t.datePlanner.wishEmptyTitle}
          subtitle={t.datePlanner.wishEmptySubtitle}
          actionLabel={t.datePlanner.wishEmptyAction}
          onAction={() => navigation.showBottomSheet(WishFormSheet)}
        />
      ) : (
        <Animated.FlatList
          data={vm.wishes}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item, index }: { item: DateWish; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
              <WishCard
                wish={item}
                onMarkDone={() => vm.handleMarkDone(item.id)}
                onEdit={() => navigation.showBottomSheet(WishFormSheet, { initialWish: item })}
                onDelete={() => vm.handleDeleteWithConfirm(item.id, navigation.showAlert)}
              />
            </Animated.View>
          )}
        />
      )}

      {/* FAB */}
      <FAB onPress={() => navigation.showBottomSheet(WishFormSheet)} icon={Plus}/>
    </View>
  );
}
