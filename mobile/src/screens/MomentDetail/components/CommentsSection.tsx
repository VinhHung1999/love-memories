import React from 'react';
import { Pressable, View } from 'react-native';
import { Body, Caption } from '../../../components/Typography';
import { Trash2 } from 'lucide-react-native';
import { useAppColors } from '../../../navigation/theme';
import { useTranslation } from 'react-i18next';
import type { MomentComment } from '../../../types';
import AvatarCircle from '../../../components/AvatarCircle';
import CommentInput from '../../../components/CommentInput';

interface CommentsSectionProps {
  comments: MomentComment[];
  commentText: string;
  currentUserName?: string;
  isSubmitting: boolean;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onDelete: (commentId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CommentItem({
  comment,
  isOwn,
  onDelete,
}: {
  comment: MomentComment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const colors = useAppColors();
  const initial = comment.author?.charAt(0).toUpperCase() ?? '?';

  return (
    <View className="flex-row gap-2.5 mb-3">
      {/* Avatar */}
      <AvatarCircle
        uri={comment.user?.avatar}
        initials={initial}
        size={32}
      />

      {/* Bubble */}
      <View className="flex-1 rounded-tl-none rounded-2xl px-3 py-2 bg-textDark/4">
        <View className="flex-row items-center justify-between mb-0.5">
          <Caption className="font-semibold text-textDark dark:text-darkTextDark">{comment.author}</Caption>
          {isOwn ? (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Trash2 size={12} color={colors.textLight} strokeWidth={1.5} />
            </Pressable>
          ) : null}
        </View>
        <Body size="sm" className="text-textMid dark:text-darkTextMid leading-relaxed">{comment.content}</Body>
        <Caption className="text-textLight dark:text-darkTextLight mt-1">{timeAgo(comment.createdAt)}</Caption>
      </View>
    </View>
  );
}

export default function CommentsSection({
  comments,
  commentText,
  currentUserName,
  isSubmitting,
  onChangeText,
  onSubmit,
  onDelete,
}: CommentsSectionProps) {
  const { t } = useTranslation();
  const colors = useAppColors();

  return (
    <View className="mb-4">
      {comments.length === 0 ? (
        <Body size="sm" className="text-textLight dark:text-darkTextLight italic mb-3">{t('moments.detail.noComments')}</Body>
      ) : (
        comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isOwn={comment.author === currentUserName}
            onDelete={() => onDelete(comment.id)}
          />
        ))
      )}

      {/* Input */}
      <CommentInput
        value={commentText}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        placeholder={t('moments.detail.addComment')}
      />
    </View>
  );
}
