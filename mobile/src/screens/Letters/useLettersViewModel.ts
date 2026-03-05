import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LettersStackParamList } from '../../navigation';
import { loveLettersApi } from '../../lib/api';

export type LettersTab = 'inbox' | 'sent';
type Nav = NativeStackNavigationProp<LettersStackParamList>;

export function useLettersViewModel() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LettersTab>('inbox');

  const { data: received = [], isLoading: loadingReceived, isRefetching: refetchingReceived } = useQuery({
    queryKey: ['letters', 'received'],
    queryFn: loveLettersApi.received,
    staleTime: 30_000,
  });

  const { data: sent = [], isLoading: loadingSent, isRefetching: refetchingSent } = useQuery({
    queryKey: ['letters', 'sent'],
    queryFn: loveLettersApi.sent,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: loveLettersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    },
  });

  const handleLetterPress = (letterId: string) => {
    navigation.navigate('LetterRead', { letterId });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['letters'] });
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const letters = activeTab === 'inbox' ? received : sent;
  const isLoading = activeTab === 'inbox' ? loadingReceived : loadingSent;
  const isRefetching = activeTab === 'inbox' ? refetchingReceived : refetchingSent;

  return {
    activeTab,
    setActiveTab,
    letters,
    isLoading,
    isRefetching,
    isEmpty: letters.length === 0,
    handleLetterPress,
    handleRefresh,
    handleDelete,
    handleBack: () => navigation.goBack(),
  };
}
