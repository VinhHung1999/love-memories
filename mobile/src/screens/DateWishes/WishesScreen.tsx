import React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // used in FAB
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useWishesViewModel, WISH_CATEGORIES } from './useWishesViewModel';
import WishCard from './components/WishCard';
import WishFormSheet from './components/WishFormSheet';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import HeaderIconButton from '../../components/HeaderIconButton';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import type { DateWish } from '../../types';

const STATUS_FILTERS = [
  { key: 'all', label: t.datePlanner.allFilter },
  { key: 'pending', label: `⏳ ${t.datePlanner.pendingFilter}` },
  { key: 'done', label: `✅ ${t.datePlanner.doneFilter}` },
] as const;

export default function WishesScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = useWishesViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={t.datePlanner.wishesTitle}
        subtitle={t.datePlanner.wishesSubtitle}
        expandedHeight={140}
        collapsedHeight={96}
        scrollY={scrollY}
        onBack={vm.handleBack}
        renderRight={() => (
          <HeaderIconButton name="calendar-heart" onPress={vm.handleNavigatePlans} />
        )}
        renderFooter={() => (
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
                    <Text
                      className="text-[12px] font-semibold"
                      style={{ color: vm.statusFilter === f.key ? '#fff' : colors.textMid }}>
                      {f.label}
                    </Text>
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
                  <Text
                    className="text-[12px] font-semibold"
                    style={{ color: !vm.categoryFilter ? '#fff' : colors.textMid }}>
                    {t.datePlanner.allFilter}
                  </Text>
                </Pressable>
                {WISH_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.key}
                    onPress={() => vm.setCategoryFilter(cat.key)}
                    className="rounded-xl px-3 py-1.5 flex-row items-center gap-1"
                    style={{
                      backgroundColor: vm.categoryFilter === cat.key ? colors.secondary : colors.gray100,
                    }}>
                    <Text className="text-[12px]">{cat.emoji}</Text>
                    <Text
                      className="text-[12px] font-medium"
                      style={{ color: vm.categoryFilter === cat.key ? '#fff' : colors.textMid }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      />

      {vm.isEmpty && !vm.isLoading ? (
        <EmptyState
          icon="heart-outline"
          title={t.datePlanner.wishEmptyTitle}
          subtitle={t.datePlanner.wishEmptySubtitle}
          actionLabel={t.datePlanner.wishEmptyAction}
          onAction={() => navigation.showBottomSheet(WishFormSheet)}
        />
      ) : (
        <Animated.FlatList
          data={vm.wishes}
          keyExtractor={item => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 100 }}
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
      <Pressable
        onPress={() => navigation.showBottomSheet(WishFormSheet)}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.secondary }}>
        <Icon name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
