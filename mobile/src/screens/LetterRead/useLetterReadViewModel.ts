import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import type { LettersStackParamList } from '../../navigation';
import { loveLettersApi } from '../../lib/api';

type Nav = NativeStackNavigationProp<LettersStackParamList>;
type Route = RouteProp<LettersStackParamList, 'LetterRead'>;

export function useLetterReadViewModel() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { letterId } = route.params;

  // Fetching the letter auto-marks it as READ on the backend
  const { data: letter, isLoading } = useQuery({
    queryKey: ['letter', letterId],
    queryFn: () => loveLettersApi.get(letterId),
    staleTime: 0, // always fresh — marks as read
  });

  return {
    letter,
    isLoading,
    handleBack: () => navigation.goBack(),
  };
}
