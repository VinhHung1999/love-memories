import { useState } from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { coupleApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { AppStackParamList } from '../../navigation';

type RouteProps = RouteProp<AppStackParamList, 'JoinCouple'>;

export function useJoinCoupleViewModel() {
  const navigation = useAppNavigation();
  const route = useRoute<RouteProps>();
  const { code } = route.params;
  const { updateUser } = useAuth();

  const [isJoining, setIsJoining] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);
    try {
      const result = await coupleApi.join(code);
      // Update user context with new coupleId from response
      if (result.user) {
        updateUser({ coupleId: result.user.coupleId });
      }
      setIsSuccess(true);
    } catch (e) {
      setError((e as Error).message || 'Failed to join couple');
    } finally {
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return {
    code,
    isJoining,
    isSuccess,
    error,
    handleJoin,
    handleBack,
  };
}
