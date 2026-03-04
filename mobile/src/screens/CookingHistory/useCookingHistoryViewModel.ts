import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RecipesStackParamList } from '../../navigation';
import { cookingSessionsApi } from '../../lib/api';

type Nav = NativeStackNavigationProp<RecipesStackParamList>;

export function useCookingHistoryViewModel() {
  const navigation = useNavigation<Nav>();

  const { data: sessions = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['cooking-sessions'],
    queryFn: cookingSessionsApi.list,
    staleTime: 30_000,
  });

  const completedSessions = sessions.filter(s => s.status === 'completed');

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate('CookingSession', { sessionId });
  };

  const handleBack = () => navigation.goBack();

  return {
    sessions: completedSessions,
    isLoading,
    isRefetching,
    handleRefresh: refetch,
    handleSessionPress,
    handleBack,
  };
}
