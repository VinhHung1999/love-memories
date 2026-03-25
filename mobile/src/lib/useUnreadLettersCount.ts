import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth';
import { loveLettersApi } from './api';

/** Shared hook for unread letters count — used by CurvedTabBar badge + any other consumer. */
export function useUnreadLettersCount(): number {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ['love-letters-unread-count'],
    queryFn: loveLettersApi.unreadCount,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  return data?.count ?? 0;
}
