import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from './api';

export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
  return data?.count ?? 0;
}
