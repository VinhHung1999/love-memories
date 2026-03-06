import React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { usePlanListViewModel } from './usePlanListViewModel';
import PlanCard from './components/PlanCard';
import PlanFormSheet from './components/PlanFormSheet';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import HeaderIconButton from '../../components/HeaderIconButton';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import type { DatePlan } from '../../types';

function PlansSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 px-4 pt-14">
      {[0, 1, 2].map(i => (
        <View key={i} className="bg-white rounded-3xl p-4 mb-3">
          <View className="flex-row justify-between mb-2">
            <Skeleton className="w-24 h-6 rounded-xl" />
            <Skeleton className="w-16 h-6 rounded-full" />
          </View>
          <Skeleton className="w-3/4 h-4 rounded-md mb-2" />
          <Skeleton className="w-full h-2 rounded-full" />
        </View>
      ))}
    </ScrollView>
  );
}

export default function PlanListScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = usePlanListViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={t.datePlanner.plansTitle}
        subtitle={t.datePlanner.plansSubtitle}
        expandedHeight={130}
        collapsedHeight={96}
        scrollY={scrollY}
        renderRight={() => (
          <View className="flex-row gap-2">
            <HeaderIconButton name="heart-outline" onPress={vm.handleNavigateWishes} />
            <HeaderIconButton name="arrow-left" onPress={vm.handleBack} />
          </View>
        )}
      />

      {vm.isLoading ? (
        <PlansSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon="calendar-heart"
          title={t.datePlanner.planEmptyTitle}
          subtitle={t.datePlanner.planEmptySubtitle}
          actionLabel={t.datePlanner.planEmptyAction}
          onAction={() => navigation.showBottomSheet(PlanFormSheet)}
        />
      ) : (
        <Animated.FlatList
          data={vm.plans}
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
          renderItem={({ item, index }: { item: DatePlan; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
              <PlanCard
                plan={item}
                onPress={() => vm.handlePlanPress(item.id)}
              />
            </Animated.View>
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => navigation.showBottomSheet(PlanFormSheet)}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.primary }}>
        <Icon name="plus" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
