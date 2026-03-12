import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { usePlanDetailViewModel } from './usePlanDetailViewModel';
import StopCard from './components/StopCard';
import OverlayHeader from '../../components/OverlayHeader';
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
    <View className="flex-1 bg-white">

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>

        {/* ── Full-bleed cover (280px) — gradient fallback, no photo ── */}
        <View style={{ height: 280 }}>
          <LinearGradient
            colors={[colors.primary + '22', colors.primary + '08']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ position: 'absolute', bottom: 28, left: 20, right: 20 }}>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 6 }}>
              {formatDate(plan.date)}
            </Text>
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#2D2D2D', lineHeight: 32 }} numberOfLines={2}>
              {plan.title}
            </Text>
          </View>
        </View>

        {/* ── Content (overlaps cover, rounded top) ── */}
        <View className="bg-white rounded-t-3xl -mt-6 pb-[60px] px-4 pt-5">

          {/* Status + progress */}
          <View className="gap-2 mb-4">
            <View className="flex-row items-center gap-2">
              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: statusBg }}>
                <Text className="text-[11px] font-bold" style={{ color: statusTextColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            {plan.stops.length > 0 ? (
              <Text className="text-[12px] text-textMid">
                {t.datePlanner.stopsProgress
                  .replace('{done}', String(doneCount))
                  .replace('{total}', String(plan.stops.length))}
              </Text>
            ) : null}
          </View>

          {/* Stops timeline */}
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

        </View>
      </Animated.ScrollView>

      <OverlayHeader
        onBack={vm.handleBack}
        onEdit={() => vm.handleEdit(navigation.showBottomSheet)}
        onDelete={() => vm.handleDeleteWithConfirm(navigation.showAlert)}
        scrollY={scrollY}
        title={plan.title}
      />

    </View>
  );
}
