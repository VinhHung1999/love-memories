import { useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DatePlannerStackParamList } from '../../navigation';
import { datePlansApi } from '../../lib/api';
import { useTranslation } from 'react-i18next';
type Nav = NativeStackNavigationProp<DatePlannerStackParamList>;
type Route = RouteProp<DatePlannerStackParamList, 'PlanDetail'>;

export function usePlanDetailViewModel() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const { planId } = route.params;

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => datePlansApi.get(planId),
    staleTime: 15_000,
  });

  const markStopMutation = useMutation({
    mutationFn: (stopId: string) => datePlansApi.markStopDone(planId, stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => datePlansApi.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      navigation.goBack();
    },
  });

  // Issue 2: sorted stops in ViewModel (avoids mutating React Query cache with in-place sort)
  const sortedStops = useMemo(
    () => (plan ? [...plan.stops].sort((a, b) => a.order - b.order) : []),
    [plan],
  );

  const handleDeleteWithConfirm = (showAlert: (params: any) => void) => {
    showAlert({
      title: t('datePlanner.deletePlan'),
      message: t('datePlanner.deletePlanConfirm'),
      type: 'destructive',
      confirmLabel: t('common.delete'),
      onConfirm: () => deleteMutation.mutate(),
    });
  };

  return {
    plan,
    sortedStops,
    isLoading,
    handleMarkStopDone: (stopId: string) => markStopMutation.mutate(stopId),
    handleDeleteWithConfirm,
    handleBack: () => navigation.goBack(),
    handleEdit: (showBottomSheet: (screen: any, props?: any) => void) => {
      // Dynamic import to avoid circular dep
      const PlanFormSheet = require('../DatePlans/components/PlanFormSheet').default;
      showBottomSheet(PlanFormSheet, { initialPlan: plan });
    },
  };
}
