import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { usePlanDetailViewModel } from './usePlanDetailViewModel';
import StopCard from './components/StopCard';
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

  const statusTextColor = plan.status === 'planned' ? colors.textMid : '#fff';

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <LinearGradient
        colors={[colors.textDark, colors.textMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View className="px-4 pt-2 pb-5">
            <View className="flex-row items-center gap-2 mb-3">
              <HeaderIconButton name="arrow-left" onPress={vm.handleBack} />
              <View className="flex-1" />
              <HeaderIconButton
                name="pencil-outline"
                onPress={() => vm.handleEdit(navigation.showBottomSheet)}
              />
              <HeaderIconButton
                name="trash-can-outline"
                onPress={() => vm.handleDeleteWithConfirm(navigation.showAlert)}
              />
            </View>
            <View className="flex-row items-start gap-3">
              <View className="flex-1">
                <Text className="text-xl font-bold text-white">{plan.title}</Text>
                <Text className="text-[12px] text-white/60 mt-1">{formatDate(plan.date)}</Text>
              </View>
              <View className="rounded-full px-3 py-1.5 mt-1" style={{ backgroundColor: statusBg }}>
                <Text className="text-[11px] font-bold" style={{ color: statusTextColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            {/* Progress */}
            {plan.stops.length > 0 ? (
              <Text className="text-[12px] text-white/50 mt-2">
                {t.datePlanner.stopsProgress
                  .replace('{done}', String(doneCount))
                  .replace('{total}', String(plan.stops.length))}
              </Text>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Timeline */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {plan.stops.length === 0 ? (
          <View className="items-center py-12 gap-2">
            <Text className="text-textLight text-[14px]">No stops yet</Text>
          </View>
        ) : (
          plan.stops
            .sort((a, b) => a.order - b.order)
            .map((stop, idx) => (
              <StopCard
                key={stop.id}
                stop={stop}
                isLast={idx === plan.stops.length - 1}
                onMarkDone={() => vm.handleMarkStopDone(stop.id)}
              />
            ))
        )}
      </ScrollView>
    </View>
  );
}
