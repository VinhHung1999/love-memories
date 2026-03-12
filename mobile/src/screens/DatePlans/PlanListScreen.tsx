import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Calendar, Heart, Plus } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { usePlanListViewModel } from './usePlanListViewModel';
import PlanCard from './components/PlanCard';
import PlanFormSheet from './components/PlanFormSheet';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import Skeleton from '../../components/Skeleton';
import HeaderIcon from '../../components/HeaderIcon';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import type { DatePlan } from '../../types';
import { FAB } from '@/components/FAB';

function PlansSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 px-4 pt-4">
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
      <ScreenHeader
        title={t.datePlanner.plansTitle}
        subtitle={t.datePlanner.plansSubtitle}
        onBack={vm.handleBack}
        right={<HeaderIcon icon={Heart} onPress={vm.handleNavigateWishes} />}
        scrollY={scrollY}
      />

      {vm.isLoading ? (
        <PlansSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState
          icon={Calendar}
          title={t.datePlanner.planEmptyTitle}
          subtitle={t.datePlanner.planEmptySubtitle}
          actionLabel={t.datePlanner.planEmptyAction}
          onAction={() => navigation.showBottomSheet(PlanFormSheet)}
        />
      ) : (
        <Animated.FlatList
          data={vm.plans}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
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
      <FAB onPress={() => navigation.showBottomSheet(PlanFormSheet)} icon={Plus}/>
    </View>
  );
}
