import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DatePlannerStackParamList } from '../../navigation';
import { datePlansApi } from '../../lib/api';

type Nav = NativeStackNavigationProp<DatePlannerStackParamList>;
type Route = RouteProp<DatePlannerStackParamList, 'PlanDetail'>;

export function usePlanDetailViewModel() {
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

  const handleDeleteWithConfirm = (showAlert: (params: any) => void) => {
    showAlert({
      title: 'Delete Plan',
      message: 'Are you sure you want to delete this plan?',
      type: 'destructive',
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutate(),
    });
  };

  return {
    plan,
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
