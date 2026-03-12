import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { usePlanDetailViewModel } from './usePlanDetailViewModel';
import StopCard from './components/StopCard';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import HeaderIconButton from '../../components/HeaderIconButton';
import { useAppNavigation } from '../../navigation/useAppNavigation';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function PlanDetailScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = usePlanDetailViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  if (vm.isLoading || !vm.plan) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { plan } = vm;
  const doneCount = plan.stops.filter(s => s.done).length;

  const statusLabel =
    plan.status === 'active' ? t.datePlanner.statusActive :
    plan.status === 'completed' ? t.datePlanner.statusCompleted :
    t.datePlanner.statusPlanned;

  const statusBg =
    plan.status === 'active' ? colors.primary :
    plan.status === 'completed' ? colors.accent :
    colors.gray100;

  const statusTextColor = plan.status === 'planned' ? colors.textMid : colors.white;

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={plan.title}
        subtitle={formatDate(plan.date)}
        expandedHeight={plan.stops.length > 0 ? 180 : 160}
        collapsedHeight={96}
        scrollY={scrollY}
        dark
        onBack={vm.handleBack}
        renderRight={() => (
          <View className="flex-row gap-2">
            <HeaderIconButton
              icon={Pencil}
              onPress={() => vm.handleEdit(navigation.showBottomSheet)}
            />
            <HeaderIconButton
              icon={Trash2}
              onPress={() => vm.handleDeleteWithConfirm(navigation.showAlert)}
            />
          </View>
        )}
        renderExpandedContent={() => (
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: statusBg }}>
                <Text className="text-[11px] font-bold" style={{ color: statusTextColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            {plan.stops.length > 0 ? (
              <Text className="text-[12px] text-white/50">
                {t.datePlanner.stopsProgress
                  .replace('{done}', String(doneCount))
                  .replace('{total}', String(plan.stops.length))}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Timeline */}
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, paddingTop: plan.stops.length > 0 ? 180 : 160, paddingBottom: 40 }}>
        {vm.sortedStops.length === 0 ? (
          <View className="items-center py-12 gap-2">
            <Text className="text-textLight text-[14px]">{t.datePlanner.noStops}</Text>
          </View>
        ) : (
          vm.sortedStops.map((stop, idx) => (
            <StopCard
              key={stop.id}
              stop={stop}
              isLast={idx === vm.sortedStops.length - 1}
              onMarkDone={() => vm.handleMarkStopDone(stop.id)}
            />
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}
