import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import AudioRecorderPlayer, { type PlayBackType } from 'react-native-audio-recorder-player';

// v3 exports a class — module-level instance shared across renders
const audioPlayer = new AudioRecorderPlayer();
import type { MomentsStackParamList } from '../../navigation';
import { momentsApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { MomentPhoto } from '../../types';
import t from '../../locales/en';

type Nav = NativeStackNavigationProp<MomentsStackParamList>;
type Route = RouteProp<MomentsStackParamList, 'MomentDetail'>;

const PRESET_EMOJIS = ['❤️', '😂', '😍', '🥺', '🔥', '👏', '😢', '🎉'];


export function useMomentDetailViewModel() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { momentId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Audio playback state ───────────────────────────────────────────────────
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  // ── Comment input ──────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState('');

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: moment, isLoading } = useQuery({
    queryKey: ['moment', momentId],
    queryFn: () => momentsApi.get(momentId),
    staleTime: 30_000,
  });

  // ── Reactions computed ─────────────────────────────────────────────────────

  const reactionCounts = useCallback(
    (emoji: string) => moment?.reactions.filter(r => r.emoji === emoji).length ?? 0,
    [moment],
  );

  const hasReacted = useCallback(
    (emoji: string) =>
      moment?.reactions.some(r => r.emoji === emoji && r.author === (user?.name ?? '')) ?? false,
    [moment, user],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const reactionMutation = useMutation({
    mutationFn: (emoji: string) =>
      momentsApi.toggleReaction(momentId, { emoji, author: user?.name ?? 'Unknown' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moment', momentId] }),
    onError: () => Alert.alert(t.common.error, t.moments.errors.reactionFailed),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      momentsApi.addComment(momentId, { content, author: user?.name ?? 'Unknown' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moment', momentId] });
      setCommentText('');
    },
    onError: () => Alert.alert(t.common.error, t.moments.errors.commentFailed),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => momentsApi.deleteComment(momentId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moment', momentId] }),
  });

  const deleteMomentMutation = useMutation({
    mutationFn: () => momentsApi.delete(momentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      navigation.goBack();
    },
    onError: () => Alert.alert(t.common.error, t.moments.errors.deleteFailed),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = () => navigation.goBack();

  const handleEdit = () => navigation.navigate('CreateMoment', { momentId });

  const handleOpenGallery = (photos: MomentPhoto[], initialIndex: number) => {
    navigation.navigate('PhotoGallery', { photos, initialIndex });
  };

  const handleToggleReaction = (emoji: string) => {
    if (reactionMutation.isPending) return;
    reactionMutation.mutate(emoji);
  };

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text || commentMutation.isPending) return;
    commentMutation.mutate(text);
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(t.common.delete, 'Remove this comment?', [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => deleteCommentMutation.mutate(commentId) },
    ]);
  };

  const handleDeleteMoment = () => {
    Alert.alert(t.moments.detail.deleteTitle, t.moments.detail.deleteMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.moments.detail.deleteConfirm,
        style: 'destructive',
        onPress: () => deleteMomentMutation.mutate(),
      },
    ]);
  };

  const handlePlayAudio = async (audioId: string, url: string) => {
    try {
      if (playingAudioId === audioId) {
        await audioPlayer.stopPlayer();
        audioPlayer.removePlayBackListener();
        setPlayingAudioId(null);
        return;
      }
      if (playingAudioId) {
        await audioPlayer.stopPlayer();
        audioPlayer.removePlayBackListener();
      }
      setPlayingAudioId(audioId);
      await audioPlayer.startPlayer(url);
      audioPlayer.addPlayBackListener((e: PlayBackType) => {
        const progress = e.duration > 0 ? e.currentPosition / e.duration : 0;
        setAudioProgress(prev => ({ ...prev, [audioId]: progress }));
        if (e.currentPosition >= e.duration && e.duration > 0) {
          setPlayingAudioId(null);
          audioPlayer.removePlayBackListener();
          setAudioProgress(prev => ({ ...prev, [audioId]: 0 }));
        }
      });
    } catch {
      setPlayingAudioId(null);
    }
  };

  const handleStopAudio = async () => {
    if (!playingAudioId) return;
    await audioPlayer.stopPlayer().catch(() => {});
    audioPlayer.removePlayBackListener();
    setPlayingAudioId(null);
  };

  return {
    moment,
    isLoading,
    user,
    presetEmojis: PRESET_EMOJIS,
    playingAudioId,
    audioProgress,
    commentText,
    isCommentSubmitting: commentMutation.isPending,
    isDeleting: deleteMomentMutation.isPending,

    reactionCounts,
    hasReacted,

    setCommentText,
    handleBack,
    handleEdit,
    handleOpenGallery,
    handleToggleReaction,
    handleAddComment,
    handleDeleteComment,
    handleDeleteMoment,
    handlePlayAudio,
    handleStopAudio,
  };
}
