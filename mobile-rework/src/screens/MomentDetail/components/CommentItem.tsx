import { useMemo } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';

import type { MomentCommentRow } from '@/api/moments';

// T401 (Sprint 63) — single comment row. Prototype moments.jsx L714-753.
// Layout: circular avatar (sm=32px) + name+bubble + time line.
// Long-press fires Alert.alert destructive ONLY when comment.userId matches
// the current user — partners can't nuke each other's threads. BE also
// enforces owner-only (MomentService.deleteComment) so this is UX polish,
// not the trust boundary.

type Props = {
  comment: MomentCommentRow;
  locale: string;
  currentUserId: string | null;
  onDelete: (commentId: string) => Promise<boolean>;
  justNowLabel: string;
};

export function CommentItem({
  comment,
  locale,
  currentUserId,
  onDelete,
  justNowLabel,
}: Props) {
  const { t } = useTranslation();
  const isOwn = currentUserId !== null && comment.userId === currentUserId;

  const relative = useMemo(
    () => formatRelative(new Date(comment.createdAt), locale, justNowLabel),
    [comment.createdAt, locale, justNowLabel],
  );

  const confirmDelete = () => {
    Alert.alert(
      t('moments.detail.comments.deleteAlert.title'),
      t('moments.detail.comments.deleteAlert.body'),
      [
        {
          text: t('moments.detail.comments.deleteAlert.cancel'),
          style: 'cancel',
        },
        {
          text: t('moments.detail.comments.deleteAlert.confirm'),
          style: 'destructive',
          onPress: async () => {
            const ok = await onDelete(comment.id);
            if (!ok) {
              Alert.alert(t('moments.detail.comments.deleteError'));
            }
          },
        },
      ],
    );
  };

  const displayName = comment.user?.name ?? comment.author;
  const avatarUri = comment.user?.avatar ?? null;

  return (
    <Pressable
      onLongPress={isOwn ? confirmDelete : undefined}
      accessibilityRole={isOwn ? 'button' : undefined}
      accessibilityLabel={
        isOwn
          ? `${displayName}: ${comment.content}`
          : undefined
      }
      delayLongPress={400}
      className="flex-row gap-2.5 mb-3"
    >
      <Avatar uri={avatarUri} name={displayName} size="sm" />
      <View className="flex-1">
        <View className="self-start max-w-full px-3 py-2 rounded-2xl rounded-tl-sm bg-surface border border-line-on-surface">
          <Text className="font-bodySemibold text-ink text-[12px]">
            {displayName}
          </Text>
          <Text className="font-body text-ink text-[13px] leading-[18px] mt-0.5">
            {comment.content}
          </Text>
        </View>
        <Text className="font-body text-ink-mute text-[10px] mt-1">
          {relative}
        </Text>
      </View>
    </Pressable>
  );
}

function formatRelative(date: Date, locale: string, justNow: string): string {
  const lang = locale.startsWith('vi') ? 'vi-VN' : 'en-US';
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return justNow;
  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return rtf.format(-diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return rtf.format(-diffDay, 'day');
    const diffMonth = Math.round(diffDay / 30);
    if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
    return rtf.format(-Math.round(diffMonth / 12), 'year');
  } catch {
    return date.toLocaleDateString(lang);
  }
}
