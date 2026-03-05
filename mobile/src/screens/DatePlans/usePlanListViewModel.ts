import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DatePlannerStackParamList } from '../../navigation';
import { datePlansApi } from '../../lib/api';
import type { DatePlan } from '../../types';

type Nav = NativeStackNavigationProp<DatePlannerStackParamList>;

export function usePlanListViewModel() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading, isRefetching } = useQuery({
    queryKey: ['plans'],
    queryFn: datePlansApi.list,
    staleTime: 30_000,
  });

  const sorted = useMemo<DatePlan[]>(() => {
    return [...plans].sort((a, b) => {
      // Active first, then by date
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [plans]);

  return {
    plans: sorted,
    isLoading,
    isRefetching,
    isEmpty: plans.length === 0,
    handlePlanPress: (planId: string) => navigation.navigate('PlanDetail', { planId }),
    handleRefresh: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    handleNavigateWishes: () => navigation.navigate('WishesList'),
    handleBack: () => navigation.goBack(),
  };
}
