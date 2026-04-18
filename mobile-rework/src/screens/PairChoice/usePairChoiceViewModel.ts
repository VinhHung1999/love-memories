import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T284. POST /api/couple with no body creates an empty couple
// (name is null, set later in T286 Personalize). Returns refreshed JWT carrying
// coupleId + the first inviteCode. We pass the code to PairInvite as a route
// param so it can render immediately without a second round-trip.

// BE returns `inviteCode` at the top level (CoupleController.createCouple
// spreads buildAuthResponse + appends inviteCode), not under a `couple` field.
type CreateCoupleResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    coupleId: string | null;
  };
  inviteCode: string;
};

type FormError = { kind: 'network' };

export function usePairChoiceViewModel() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  const onCreate = useCallback(async () => {
    if (creating) return;
    setError(null);
    setCreating(true);
    try {
      const res = await apiClient.post<CreateCoupleResponse>('/api/couple', {});
      await setSession({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: {
          id: res.user.id,
          email: res.user.email,
          name: res.user.name,
          avatarUrl: res.user.avatar,
          coupleId: res.user.coupleId,
        },
      });
      router.replace({
        pathname: '/(auth)/pair-invite',
        params: { code: res.inviteCode },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ kind: 'network' });
      } else {
        setError({ kind: 'network' });
      }
    } finally {
      setCreating(false);
    }
  }, [creating, router, setSession]);

  const onJoin = useCallback(() => {
    if (creating) return;
    router.push('/(auth)/pair-join');
  }, [creating, router]);

  return {
    creating,
    error,
    onCreate,
    onJoin,
  };
}
