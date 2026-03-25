import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type AppNotification } from '../../lib/api';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { handleNotificationNavigation } from '../../lib/pushNotifications';

export function useNotificationsViewModel() {
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const handleNotificationPress = useCallback((n: AppNotification) => {
    if (!n.read) markReadMutation.mutate(n.id);
    const data: Record<string, string> = {};
    if (n.link) data.link = n.link;
    if (n.type) data.type = n.type;
    handleNotificationNavigation(navigation as any, data);
  }, [markReadMutation, navigation]);

  // Group by date label
  const grouped = groupByDate(data);
  const hasUnread = data.some(n => !n.read);

  return {
    grouped,
    isLoading,
    hasUnread,
    refetch,
    handleNotificationPress,
    handleMarkAll: () => markAllMutation.mutate(),
    handleDelete: (id: string) => deleteMutation.mutate(id),
  };
}

function groupByDate(items: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, AppNotification[]> = {};
  for (const item of items) {
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = 'today';
    else if (d.getTime() === yesterday.getTime()) label = 'yesterday';
    else label = 'earlier';
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return (['today', 'yesterday', 'earlier'] as const)
    .filter(k => groups[k]?.length)
    .map(k => ({ label: k, items: groups[k] }));
}

export function useUnreadCount() {
  const { data } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 10_000,
  });
  return Math.min(data?.count ?? 0, 99);
}
