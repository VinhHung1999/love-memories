import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { usePlanDetailViewModel } from './usePlanDetailViewModel';
import StopCard from './components/StopCard';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import DetailScreenLayout from '../../components/DetailScreenLayout';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function PlanDetailScreen() {
  const colors = useAppColors();
  const navigation = useAppNavigation();
  const vm = usePlanDetailViewModel();

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
    <DetailScreenLayout
      title={plan.title}
      coverSubtitle={formatDate(plan.date)}
      fallbackGradient={[colors.primary + '22', colors.primary + '08']}
      onBack={vm.handleBack}
      onEdit={() => vm.handleEdit(navigation.showBottomSheet)}
      onDelete={() => vm.handleDeleteWithConfirm(navigation.showAlert)}
    >
      <View className="px-4 pt-5 pb-[60px]">
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
    </DetailScreenLayout>
  );
}
