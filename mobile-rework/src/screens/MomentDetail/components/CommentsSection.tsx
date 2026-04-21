import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CommentItem } from './CommentItem';
import type { MomentCommentRow } from '@/api/moments';

// T401 (Sprint 63) — Comments list under ReactionsBar. Empty state shows
// once the initial fetch resolves (commentsLoaded=true AND 0 rows), so the
// placeholder doesn't flash during the first load. Subsequent polls don't
// toggle commentsLoaded (silent refresh) — the list just reconciles.

type Props = {
  comments: MomentCommentRow[];
  loaded: boolean;
  locale: string;
  currentUserId: string | null;
  onDelete: (commentId: string) => Promise<boolean>;
};

export function CommentsSection({
  comments,
  loaded,
  locale,
  currentUserId,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const justNowLabel = t('moments.detail.justNow');

  return (
    <View className="mt-7">
      <Text className="font-bodySemibold text-ink text-[14px] mb-3">
        {t('moments.detail.comments.title')}
      </Text>
      {loaded && comments.length === 0 ? (
        <Text className="font-body text-ink-mute text-[13px]">
          {t('moments.detail.comments.empty')}
        </Text>
      ) : (
        <View>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              locale={locale}
              currentUserId={currentUserId}
              onDelete={onDelete}
              justNowLabel={justNowLabel}
            />
          ))}
        </View>
      )}
    </View>
  );
}
