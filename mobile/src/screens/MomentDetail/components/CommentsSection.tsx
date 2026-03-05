import React from 'react';
import { Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../../navigation/theme';
import t from '../../../locales/en';
import type { MomentComment } from '../../../types';

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
      <View
        className="w-8 h-8 rounded-full items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isOwn ? colors.primary : colors.accent }}>
        <Text className="text-xs font-bold text-white">{initial}</Text>
      </View>

      {/* Bubble */}
      <View className="flex-1 rounded-tl-none rounded-2xl px-3 py-2 bg-textDark/4">
        <View className="flex-row items-center justify-between mb-0.5">
          <Text className="text-[11px] font-semibold text-textDark">{comment.author}</Text>
          {isOwn ? (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Icon name="trash-can-outline" size={12} color={colors.textLight} />
            </Pressable>
          ) : null}
        </View>
        <Text className="text-xs text-textMid leading-relaxed">{comment.content}</Text>
        <Text className="text-[10px] text-textLight mt-1">{timeAgo(comment.createdAt)}</Text>
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
  const colors = useAppColors();

  return (
    <View className="mb-4">
      {comments.length === 0 ? (
        <Text className="text-xs text-textLight italic mb-3">{t.moments.detail.noComments}</Text>
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
      <View className="flex-row items-center gap-2 mt-1 p-2 rounded-2xl bg-textDark/4">
        <TextInput
          className="flex-1 text-[13px] text-textDark px-2 min-h-[36px] max-h-[80px]"
          placeholder={t.moments.detail.addComment}
          placeholderTextColor={colors.textLight}
          value={commentText}
          onChangeText={onChangeText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={() => !isSubmitting && onSubmit()}
          disabled={!commentText.trim() || isSubmitting}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: commentText.trim() ? colors.primary : colors.primaryMuted }}>
          <Icon name="send" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
