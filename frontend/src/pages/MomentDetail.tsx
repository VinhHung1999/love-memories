import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle, Calendar, MapPin, Navigation, Tag, Trash2, Pencil, Plus, MessageCircle, Send, Share2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { momentsApi, shareApi } from '../lib/api';
import { uploadQueue } from '../lib/uploadQueue';
import { useAuth } from '../lib/auth';
import { useVoiceRecorder } from '../lib/useVoiceRecorder';
import PhotoGallery from '../components/PhotoGallery';
import MomentEditModal from '../components/MomentEditModal';
import VoiceMemoSection from '../components/VoiceMemoSection';
import Modal from '../components/Modal';

const PRESET_EMOJIS = ['❤️', '😂', '😍', '🥺', '🔥', '👏', '😢', '🎉'];

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

  const { isRecording, recordSeconds, startRecording, stopRecording } = useVoiceRecorder({
    onRecordingComplete: (file, duration) => {
      uploadQueue.enqueue(
        `moment-audio-${id}-${Date.now()}`,
        'Đang lưu voice memo...',
        (onProgress) => momentsApi.uploadAudio(id!, file, duration, onProgress),
        () => queryClient.invalidateQueries({ queryKey: ['moments', id] }),
      );
    },
  });

  const { data: moment, isLoading } = useQuery({
    queryKey: ['moments', id],
    queryFn: () => momentsApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => momentsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast.success('Moment deleted');
      navigate('/moments');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => momentsApi.deletePhoto(id!, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', id] });
      toast.success('Photo deleted');
    },
  });


  const deleteAudioMutation = useMutation({
    mutationFn: (audioId: string) => momentsApi.deleteAudio(id!, audioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', id] });
      toast.success('Voice memo deleted');
    },
  });

  // Comments + long-press emoji picker
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showLongPressEmoji, setShowLongPressEmoji] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | undefined>(undefined);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isLongPressRef = useRef(false);
  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      momentsApi.addComment(id!, { author: user?.name ?? 'Anon', content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moments', id] });
      setCommentText('');
      setShowCommentInput(false);
    },
    onError: () => toast.error('Không thể gửi bình luận'),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => momentsApi.deleteComment(id!, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moments', id] }),
    onError: () => toast.error('Không thể xóa bình luận'),
  });

  // Reactions — optimistic update
  const toggleReactionMutation = useMutation({
    mutationFn: (emoji: string) =>
      momentsApi.toggleReaction(id!, { emoji, author: user?.name ?? 'Anon' }),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: ['moments', id] });
      const prev = queryClient.getQueryData<typeof moment>(['moments', id]);
      if (prev) {
        const author = user?.name ?? 'Anon';
        const existing = prev.reactions.find((r) => r.emoji === emoji && r.author === author);
        const nextReactions = existing
          ? prev.reactions.filter((r) => r.id !== existing.id)
          : [...prev.reactions, { id: `opt-${Date.now()}`, momentId: id!, emoji, author, createdAt: new Date().toISOString() }];
        queryClient.setQueryData(['moments', id], { ...prev, reactions: nextReactions });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['moments', id], ctx.prev);
      toast.error('Không thể cập nhật reaction');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['moments', id] }),
  });

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const label = files.length === 1 ? `Đang tải ${files[0]?.name ?? 'ảnh'}` : `Đang tải ${files.length} ảnh...`;
    uploadQueue.enqueue(
      `moment-photos-${id}-${Date.now()}`,
      label,
      (onProgress) => momentsApi.uploadPhotos(id!, files, onProgress),
      () => queryClient.invalidateQueries({ queryKey: ['moments', id] }),
    );
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 rounded-2xl" /><div className="h-8 bg-gray-200 rounded w-1/3" /></div>;
  if (!moment) return <div className="text-center py-16 text-text-light">Moment not found</div>;

  const [heroPhoto, ...thumbPhotos] = moment.photos;
  const heartReacted = moment.reactions.some((r) => r.emoji === '❤️' && r.author === (user?.name ?? 'Anon'));
  const uniqueEmojis = [...new Set(moment.reactions.map((r) => r.emoji))];

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/moments')} className="flex items-center gap-2 text-text-light hover:text-primary mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Moments
      </button>

      {/* Hidden file input */}
      <input
        ref={(el) => { fileInputRef.current = el ?? undefined; }}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAddPhotos}
      />

      {/* Photo Layout: hero + thumbnail strip */}
      {heroPhoto && (
        <div className="mb-6 space-y-2">
          {/* Hero — first photo full width */}
          <div
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => openGallery(0)}
          >
            <img src={heroPhoto.url} alt="" className="w-full h-64 md:h-80 object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Xóa ảnh này?')) deletePhotoMutation.mutate(heroPhoto.id); }}
              className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Thumbnail strip + Add button inline */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {thumbPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => openGallery(i + 1)}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); if (window.confirm('Xóa ảnh này?')) deletePhotoMutation.mutate(photo.id); }}
                  className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {/* Add Photos — last item in strip */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Photos button — only when no photos yet */}
      {!heroPhoto && (
        <div className="mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Photos
          </button>
        </div>
      )}

      {/* Spotify embed — between photos and detail card */}
      {moment.spotifyUrl && (() => {
        const trackId = moment.spotifyUrl!
          .replace('spotify:track:', '')
          .match(/track\/([A-Za-z0-9]+)/)?.[1];
        if (!trackId) return null;
        return (
          <div className="mb-4">
            <iframe
              src={`https://open.spotify.com/embed/track/${trackId}?theme=0&autoplay=1`}
              width="100%"
              height="80"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="eager"
              className="rounded-xl"
              style={{ border: 'none' }}
            />
          </div>
        );
      })()}

      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <h1 className="font-heading text-3xl font-bold">{moment.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const link = await shareApi.create('moment', id!);
                  const url = `${window.location.origin}/s/${link.token}`;
                  if (navigator.share) {
                    await navigator.share({ title: moment.title, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                  }
                  toast.success('Đã tạo link chia sẻ!');
                } catch { /* user cancelled share */ }
              }}
              className="text-text-light hover:text-primary p-2 rounded-lg hover:bg-primary/5 transition-colors"
              data-tour="share-button"
              title="Chia sẻ"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="text-text-light hover:text-primary p-2 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {moment.caption && (
          <p className="text-text-light mt-3 leading-relaxed">{moment.caption}</p>
        )}

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-light">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {format(new Date(moment.date), 'MMMM d, yyyy')}
          </span>
          {moment.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {moment.location}
            </span>
          )}
          {moment.latitude != null && moment.longitude != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${moment.latitude},${moment.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Chỉ đường
            </a>
          )}
        </div>

        {moment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {moment.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Reactions summary (Facebook-style) ─────────────────────── */}
        {uniqueEmojis.length > 0 && (
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100">
            <div className="flex -space-x-0.5">
              {uniqueEmojis.slice(0, 4).map((emoji) => (
                <span key={emoji} className="text-base">{emoji}</span>
              ))}
            </div>
            <span className="text-xs text-text-light">{moment.reactions.length} reactions</span>
          </div>
        )}

        {/* ── Action row (Facebook-style) ─────────────────────────────── */}
        <div className="flex items-center border-t border-gray-100 mt-3 -mx-6 px-1">
          {/* Thích — tap toggles ❤️, long press (~500ms) shows emoji tooltip */}
          <div className="relative flex-1">
            {showLongPressEmoji && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white shadow-lg rounded-full px-3 py-2 flex gap-2 z-10">
                {PRESET_EMOJIS.map((emoji) => {
                  const reacted = moment.reactions.some((r) => r.emoji === emoji && r.author === (user?.name ?? 'Anon'));
                  return (
                    <button
                      key={emoji}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => { toggleReactionMutation.mutate(emoji); setShowLongPressEmoji(false); }}
                      className={`text-xl transition-transform active:scale-90 ${reacted ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onPointerDown={() => {
                isLongPressRef.current = false;
                longPressTimerRef.current = setTimeout(() => {
                  isLongPressRef.current = true;
                  setShowLongPressEmoji(true);
                }, 500);
              }}
              onPointerUp={() => clearTimeout(longPressTimerRef.current)}
              onPointerLeave={() => clearTimeout(longPressTimerRef.current)}
              onClick={() => { if (!isLongPressRef.current) toggleReactionMutation.mutate('❤️'); }}
              className={`flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-medium rounded-xl transition-colors ${
                heartReacted ? 'text-primary' : 'text-text-light hover:bg-gray-50'
              }`}
            >
              <span>{heartReacted ? '❤️' : '🤍'}</span> Thích
            </button>
          </div>
          <button
            onClick={() => {
              const next = !showCommentInput;
              setShowCommentInput(next);
              if (next) setTimeout(() => commentInputRef.current?.focus(), 50);
            }}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-sm font-medium text-text-light hover:bg-gray-50 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Bình luận
          </button>
        </div>

        {/* ── Comments inline ──────────────────────────────────────────── */}
        <div className="mt-1 border-t border-gray-100 pt-3">
          {/* Comments list — always visible */}
          {moment.comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {moment.comments.map((comment) => {
                const displayName = comment.user?.name ?? comment.author;
                const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={comment.id} className="flex gap-2.5">
                    {comment.user?.avatar ? (
                      <img src={comment.user.avatar} alt={displayName} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-text">{displayName}</span>
                        <span className="text-[10px] text-text-light">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className="text-sm text-text mt-0.5 leading-snug">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => { if (window.confirm('Xóa bình luận này?')) deleteCommentMutation.mutate(comment.id); }}
                      className="flex-shrink-0 text-gray-300 hover:text-red-400 p-1 rounded transition-colors self-start"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state — only when no comments and input is hidden */}
          {moment.comments.length === 0 && !showCommentInput && (
            <p className="text-xs text-text-light text-center py-2">Chưa có bình luận nào</p>
          )}

          {/* Comment input — hidden by default, shown on toggle */}
          {showCommentInput && (
            <div className="flex gap-2 items-end mt-2">
              <textarea
                ref={(el) => { commentInputRef.current = el ?? undefined; }}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                rows={1}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && commentText.trim() && !addCommentMutation.isPending) {
                    e.preventDefault();
                    addCommentMutation.mutate(commentText.trim());
                  }
                }}
              />
              <button
                onClick={() => { if (commentText.trim() && !addCommentMutation.isPending) addCommentMutation.mutate(commentText.trim()); }}
                disabled={addCommentMutation.isPending || !commentText.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {addCommentMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Memos */}
      <div className="mt-4 bg-white rounded-2xl p-4">
        <VoiceMemoSection
          isRecording={isRecording}
          recordSeconds={recordSeconds}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          audios={moment.audios}
          onDeleteAudio={(audioId) => {
            if (window.confirm('Xóa voice memo này?')) deleteAudioMutation.mutate(audioId);
          }}
        />
      </div>

      {confirmDelete && (
        <Modal open={true} onClose={() => setConfirmDelete(false)} title="Delete Moment?">
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Delete "{moment.title}"?</p>
                <p>All photos will also be deleted. This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Moment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <PhotoGallery
        photos={moment.photos}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <MomentEditModal
        moment={moment}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['moments', id] })}
      />
    </div>
  );
}
