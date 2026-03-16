import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { shareApi } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import type { AppStackParamList } from '../../navigation';

type RouteProps = RouteProp<AppStackParamList, 'ShareViewer'>;

export function useShareViewerViewModel() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProps>();
  const { token } = route.params;

  const { data, isLoading, error } = useQuery({
    queryKey: ['share-token', token],
    queryFn: () => shareApi.getToken(token),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const coverPhoto: string | undefined = data?.photos?.[0]?.url ?? data?.imageUrl ?? undefined;

  const typeLabel = (() => {
    switch (data?.type) {
      case 'moment': return 'Moment';
      case 'recipe': return 'Recipe';
      case 'foodspot': return 'Food Spot';
      default: return 'Memory';
    }
  })();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return {
    data,
    isLoading,
    error: error ? (error as Error).message : null,
    coverPhoto,
    typeLabel,
    handleBack,
  };
}
