import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2, Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { notificationsApi } from '../lib/api';
import type { AppNotification } from '../types';

const TYPE_ICON: Record<string, string> = {
  new_moment: '📸',
  new_comment: '💬',
  new_reaction: '❤️',
  new_recipe: '🍳',
  new_foodspot: '📍',
  cooking_completed: '🎯',
  achievement_unlocked: '🏆',
  new_date_wish: '💝',
  new_date_plan: '📅',
  daily_plan_reminder: '⏰',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Đã đọc tất cả');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Không thể xóa thông báo'),
  });

  const handleTap = (notif: AppNotification) => {
    if (!notif.read) markReadMutation.mutate(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Đọc tất cả
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="text-center py-20 text-text-light">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có thông báo nào</p>
        </div>
      )}

      {/* Notification cards */}
      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer select-none ${
              notif.read ? 'bg-white' : 'bg-accent/5 border border-accent/20'
            }`}
            onClick={() => handleTap(notif)}
          >
            {/* Unread dot */}
            {!notif.read && (
              <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />
            )}

            {/* Type icon */}
            <span className="flex-shrink-0 text-2xl leading-none mt-0.5">
              {TYPE_ICON[notif.type] ?? '🔔'}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${notif.read ? 'text-text-light' : 'text-text'}`}>
                {notif.title}
              </p>
              <p className="text-sm text-text-light mt-0.5 leading-snug">{notif.message}</p>
              <p className="text-[11px] text-text-light mt-1">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
              </p>
            </div>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(notif.id);
              }}
              className="flex-shrink-0 text-gray-300 hover:text-red-400 p-1 rounded transition-colors self-start"
              aria-label="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
