import { apiClient } from '@/lib/apiClient';

// T425 (Sprint 65) — typed wrappers around BE notification routes
// (mounted at /api/notifications in backend/src/routes/index.ts). The BE
// schema is loose: `type` is a free-form string and `link` is optional.
// The list endpoint returns the 50 most recent rows for the calling user
// (NotificationService.list L4-10), ordered by createdAt desc.

export type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function listNotifications() {
  return apiClient.get<NotificationRow[]>('/api/notifications');
}

export function getUnreadNotificationCount() {
  return apiClient.get<{ count: number }>(
    '/api/notifications/unread-count',
  );
}

export function markAllNotificationsRead() {
  return apiClient.put<{ ok: true }>('/api/notifications/read-all');
}

export function markNotificationRead(id: string) {
  return apiClient.put<NotificationRow>(`/api/notifications/${id}/read`);
}
