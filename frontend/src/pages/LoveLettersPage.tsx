import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Plus, Clock, Check, CheckCheck, Trash2, Calendar, Camera, Mic, Play, Pause, Edit2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import LetterReadOverlay from '../components/LetterReadOverlay';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { loveLettersApi } from '../lib/api';
import { uploadQueue } from '../lib/uploadQueue';
import { useModuleTour } from '../lib/useModuleTour';
import type { LoveLetter, LetterStatus, LetterPhoto, LetterAudio } from '../types';
import Modal from '../components/Modal';

const MOODS = [
  { key: 'romantic', label: 'Lãng mạn', emoji: '🌹' },
  { key: 'grateful', label: 'Biết ơn', emoji: '🙏' },
  { key: 'playful', label: 'Vui vẻ', emoji: '😄' },
  { key: 'encouragement', label: 'Động viên', emoji: '💪' },
  { key: 'apology', label: 'Xin lỗi', emoji: '🥺' },
  { key: 'missing', label: 'Nhớ nhung', emoji: '💭' },
] as const;

function getMoodEmoji(mood: string | null): string {
  return MOODS.find((m) => m.key === mood)?.emoji ?? '💌';
}

function StatusBadge({ status }: { status: LetterStatus }) {
  const map: Record<LetterStatus, { label: string; className: string }> = {
    DRAFT: { label: 'Nháp', className: 'bg-gray-100 text-gray-600' },
    SCHEDULED: { label: 'Đã hẹn giờ', className: 'bg-blue-100 text-blue-700' },
    DELIVERED: { label: 'Chưa đọc', className: 'bg-primary/10 text-primary' },
    READ: { label: 'Đã đọc', className: 'bg-green-100 text-green-700' },
  };
  const { label, className } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>{label}</span>;
}

function LetterCard({
  letter,
  view,
  onRead,
  onDelete,
  onSend,
  onEdit,
}: {
  letter: LoveLetter;
  view: 'inbox' | 'sent';
  onRead: (letter: LoveLetter) => void;
  onDelete?: (id: string) => void;
  onSend?: (id: string) => void;
  onEdit?: (letter: LoveLetter) => void;
}) {
  const isUnread = letter.status === 'DELIVERED';
  const person = view === 'inbox' ? letter.sender : letter.recipient;
  const isDraft = letter.status === 'DRAFT';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-2xl border p-4 cursor-pointer transition-shadow hover:shadow-md ${isUnread ? 'border-primary/40 shadow-sm' : 'border-border'}`}
      onClick={() => (view === 'inbox' || letter.status === 'DELIVERED' || letter.status === 'READ') && onRead(letter)}
    >
      <div className="flex items-start gap-3">
        {/* Envelope icon with mood */}
        <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isUnread ? 'bg-primary/10' : 'bg-gray-50'}`}>
          {getMoodEmoji(letter.mood)}
          {isUnread && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {letter.title}
            </p>
            {view === 'sent' && <StatusBadge status={letter.status} />}
          </div>
          <p className="text-xs text-text-light mb-1">
            {view === 'inbox' ? `Từ: ${person?.name ?? '—'}` : `Tới: ${person?.name ?? '—'}`}
          </p>
          <p className="text-xs text-text-light/70">
            {letter.status === 'SCHEDULED' && letter.scheduledAt
              ? `Gửi lúc: ${format(new Date(letter.scheduledAt), 'dd/MM/yyyy HH:mm')}`
              : letter.deliveredAt
              ? formatDistanceToNow(new Date(letter.deliveredAt), { addSuffix: true, locale: vi })
              : formatDistanceToNow(new Date(letter.createdAt), { addSuffix: true, locale: vi })}
          </p>
          {/* Media indicators */}
          {((letter.photos?.length ?? 0) > 0 || (letter.audio?.length ?? 0) > 0) && (
            <div className="flex gap-1.5 mt-1">
              {(letter.photos?.length ?? 0) > 0 && (
                <span className="text-xs text-text-light/60 flex items-center gap-0.5">
                  <Camera className="w-3 h-3" /> {letter.photos!.length}
                </span>
              )}
              {(letter.audio?.length ?? 0) > 0 && (
                <span className="text-xs text-text-light/60 flex items-center gap-0.5">
                  <Mic className="w-3 h-3" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          {letter.status === 'READ' && <CheckCheck className="w-4 h-4 text-green-500" />}
          {letter.status === 'DELIVERED' && <Check className="w-4 h-4 text-primary" />}
          {letter.status === 'SCHEDULED' && <Clock className="w-4 h-4 text-blue-500" />}
          {view === 'sent' && (isDraft || letter.status === 'SCHEDULED') && (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              {isDraft && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(letter)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {isDraft && onSend && (
                <button
                  type="button"
                  onClick={() => onSend(letter.id)}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Gửi ngay"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(letter.id)}
                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ComposeLetterModal({
  open,
  onClose,
  initialLetter,
}: {
  open: boolean;
  onClose: () => void;
  initialLetter?: LoveLetter;
}) {
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState(initialLetter?.title ?? '');
  const [content, setContent] = useState(initialLetter?.content ?? '');
  const [mood, setMood] = useState(initialLetter?.mood ?? '');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  // Draft state — set once letter is saved
  const [draftId, setDraftId] = useState<string | null>(initialLetter?.id ?? null);

  // Media state
  const [photos, setPhotos] = useState<LetterPhoto[]>(initialLetter?.photos ?? []);
  const [audioEntry, setAudioEntry] = useState<LetterAudio | null>(initialLetter?.audio?.[0] ?? null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const reset = () => {
    setTitle('');
    setContent('');
    setMood('');
    setScheduleMode(false);
    setScheduledAt('');
    setDraftId(null);
    setPhotos([]);
    setAudioEntry(null);
    setIsRecording(false);
    setRecordSeconds(0);
    setIsPlaying(false);
    clearInterval(timerRef.current);
    audioPlayerRef.current?.pause();
    audioPlayerRef.current = null;
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  // Save draft (create or update)
  const saveDraftMutation = useMutation({
    mutationFn: () => {
      if (draftId) {
        return loveLettersApi.update(draftId, {
          title,
          content,
          mood: mood || undefined,
          scheduledAt: scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        });
      }
      return loveLettersApi.create({
        title,
        content,
        mood: mood || undefined,
        scheduledAt: scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
    },
    onSuccess: (letter) => {
      setDraftId(letter.id);
      setPhotos(letter.photos ?? []);
      setAudioEntry(letter.audio?.[0] ?? null);
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
      toast.success('Đã lưu nháp!');
    },
    onError: () => toast.error('Không thể lưu thư. Thử lại nhé.'),
  });

  // Send letter
  const sendMutation = useMutation({
    mutationFn: async () => {
      let id = draftId;
      if (!id) {
        const draft = await loveLettersApi.create({
          title,
          content,
          mood: mood || undefined,
          scheduledAt: scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        });
        id = draft.id;
      }
      return loveLettersApi.send(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
      toast.success('Đã gửi thư!');
      handleClose();
    },
    onError: () => toast.error('Không thể gửi thư. Thử lại nhé.'),
  });

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !draftId) return;
    const remaining = 5 - photos.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) return;
    const label = toUpload.length === 1 ? `Đang tải ảnh...` : `Đang tải ${toUpload.length} ảnh...`;
    uploadQueue.enqueue(
      `letter-photos-${draftId}-${Date.now()}`,
      label,
      (onProgress) => loveLettersApi.uploadPhotos(draftId, toUpload, onProgress),
      (result) => {
        setPhotos((prev) => [...prev, ...(result as LetterPhoto[])]);
        queryClient.invalidateQueries({ queryKey: ['love-letters'] });
      },
    );
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!draftId) return;
    try {
      await loveLettersApi.deletePhoto(draftId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
    } catch {
      toast.error('Không thể xóa ảnh');
    }
  };

  // Audio recording
  const startRecording = useCallback(async () => {
    if (!draftId) {
      toast.error('Lưu nháp trước khi ghi âm');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-memo-${Date.now()}.${ext}`, { type: blob.type });
        const dur = recordSeconds;
        uploadQueue.enqueue(
          `letter-audio-${draftId}-${Date.now()}`,
          'Đang lưu voice memo...',
          (onProgress) => loveLettersApi.uploadAudio(draftId, file, dur, onProgress),
          (result) => {
            setAudioEntry(result as LetterAudio);
            queryClient.invalidateQueries({ queryKey: ['love-letters'] });
          },
        );
        clearInterval(timerRef.current);
        setRecordSeconds(0);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 29) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error('Không thể truy cập microphone');
    }
  }, [draftId, recordSeconds, queryClient]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const handleDeleteAudio = async () => {
    if (!draftId || !audioEntry) return;
    try {
      await loveLettersApi.deleteAudio(draftId, audioEntry.id);
      setAudioEntry(null);
      audioPlayerRef.current?.pause();
      audioPlayerRef.current = null;
      setIsPlaying(false);
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
    } catch {
      toast.error('Không thể xóa voice memo');
    }
  };

  const togglePlay = () => {
    if (!audioEntry) return;
    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      const a = new Audio(audioEntry.url);
      a.onended = () => setIsPlaying(false);
      a.play();
      audioPlayerRef.current = a;
      setIsPlaying(true);
    }
  };

  const canSubmit = title.trim() && content.trim();

  return (
    <Modal open={open} onClose={handleClose} title="Viết thư tình 💌">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Gửi người ấy..."
            autoFocus
            style={{ fontSize: 16 }}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nội dung *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết điều bạn muốn nói..."
            rows={6}
            style={{ fontSize: 16 }}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Photo section — visible only after draft saved */}
        {draftId && (
          <div>
            <label className="block text-sm font-medium mb-2">📷 Ảnh đính kèm (tùy chọn)</label>
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative flex-shrink-0">
                    <img
                      src={photo.url}
                      alt=""
                      className="w-20 h-20 object-cover rounded-xl border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < 5 && (
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-text-light cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4" />
                Thêm ảnh ({photos.length}/5)
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddPhotos}
                />
              </label>
            )}
          </div>
        )}

        {/* Voice memo section — visible only after draft saved */}
        {draftId && (
          <div>
            <label className="block text-sm font-medium mb-2">🎤 Voice memo (tùy chọn, tối đa 30 giây)</label>
            {audioEntry ? (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-border">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-light">Voice memo</p>
                  {audioEntry.duration != null && (
                    <p className="text-xs font-medium">{Math.round(audioEntry.duration)}s</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Xóa voice memo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : isRecording ? (
              <div className="flex items-center gap-3 bg-red-50 rounded-xl px-3 py-2 border border-red-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium text-red-700 flex-1">{recordSeconds}s / 30s</span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  Dừng
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-text-light hover:bg-gray-50 transition-colors"
              >
                <Mic className="w-4 h-4" />
                Ghi âm
              </button>
            )}
          </div>
        )}

        {/* Mood picker */}
        <div>
          <label className="block text-sm font-medium mb-2">Tâm trạng</label>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(mood === m.key ? '' : m.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  mood === m.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-light border-border hover:bg-gray-50'
                }`}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule toggle */}
        {!draftId && (
          <div className="border border-border rounded-xl p-3">
            <button
              type="button"
              onClick={() => setScheduleMode(!scheduleMode)}
              className="flex items-center gap-2 text-sm font-medium text-text-light w-full"
            >
              <Calendar className="w-4 h-4" />
              Hẹn giờ gửi
              <span className={`ml-auto w-9 h-5 rounded-full transition-colors ${scheduleMode ? 'bg-primary' : 'bg-gray-200'} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${scheduleMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
            </button>
            {scheduleMode && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                style={{ fontSize: 16 }}
                className="mt-3 w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
          </div>
        )}

        {/* Media hint when not yet saved */}
        {!draftId && (
          <p className="text-xs text-text-light/70 text-center">
            💡 Lưu nháp trước để đính kèm ảnh và voice memo
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-2">
          {draftId ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => saveDraftMutation.mutate()}
                disabled={!canSubmit || saveDraftMutation.isPending}
                className="px-4 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cập nhật
              </button>
              <button
                type="button"
                onClick={() => sendMutation.mutate()}
                disabled={!canSubmit || sendMutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Gửi ngay
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => saveDraftMutation.mutate()}
                disabled={!canSubmit || saveDraftMutation.isPending}
                className="px-4 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Lưu nháp
              </button>
              <button
                type="button"
                onClick={() => sendMutation.mutate()}
                disabled={!canSubmit || sendMutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Gửi ngay
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}


export default function LoveLettersPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<LoveLetter | undefined>(undefined);
  const [readLetter, setReadLetter] = useState<LoveLetter | null>(null);

  useModuleTour('love-letters', [
    { element: '[data-tour="compose-letter"]', popover: { title: '✉️ Viết thư tình', description: 'Bấm để viết thư tình gửi người ấy. Có thể hẹn giờ gửi và đính kèm ảnh + voice memo lãng mạn!', side: 'bottom' } },
    { element: '[data-tour="letter-tabs"]', popover: { title: '📬 Hộp thư', description: 'Xem thư nhận (từ người ấy) và thư đã gửi. Thư nháp có thể chỉnh sửa, thêm ảnh/ghi âm trước khi gửi.', side: 'bottom' } },
  ]);

  const { data: received = [], isLoading: loadingInbox } = useQuery({
    queryKey: ['love-letters', 'received'],
    queryFn: loveLettersApi.received,
  });

  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ['love-letters', 'sent'],
    queryFn: loveLettersApi.sent,
  });

  const deleteMutation = useMutation({
    mutationFn: loveLettersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
      toast.success('Đã xóa thư');
    },
    onError: () => toast.error('Không thể xóa thư'),
  });

  const sendMutation = useMutation({
    mutationFn: loveLettersApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
      toast.success('Đã gửi thư!');
    },
    onError: () => toast.error('Không thể gửi thư'),
  });

  const handleRead = async (letter: LoveLetter) => {
    if (tab === 'inbox' && letter.status === 'DELIVERED') {
      try {
        const updated = await loveLettersApi.get(letter.id);
        setReadLetter(updated);
        queryClient.invalidateQueries({ queryKey: ['love-letters', 'received'] });
      } catch {
        setReadLetter(letter);
      }
    } else {
      setReadLetter(letter);
    }
  };

  const handleEdit = (letter: LoveLetter) => {
    setEditingLetter(letter);
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setTimeout(() => setEditingLetter(undefined), 300);
  };

  const letters = tab === 'inbox' ? received : sent;
  const isLoading = tab === 'inbox' ? loadingInbox : loadingSent;
  const unreadCount = received.filter((l) => l.status === 'DELIVERED').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-heading font-bold text-gray-900">Love Letters</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">{unreadCount}</span>
          )}
        </div>
        <button
          data-tour="compose-letter"
          type="button"
          onClick={() => { setEditingLetter(undefined); setComposeOpen(true); }}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" /> Viết thư
        </button>
      </div>

      {/* Tabs */}
      <div data-tour="letter-tabs" className="flex rounded-xl overflow-hidden border border-border mb-5">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            tab === 'inbox' ? 'bg-primary text-white' : 'bg-white text-text-light hover:bg-gray-50'
          }`}
        >
          <Mail className="w-4 h-4" /> Hộp thư
          {unreadCount > 0 && (
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${tab === 'inbox' ? 'bg-white/30' : 'bg-primary/10 text-primary'}`}>
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            tab === 'sent' ? 'bg-primary text-white' : 'bg-white text-text-light hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4" /> Thư đã gửi
        </button>
      </div>

      {/* Letter list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-16 text-text-light">
          <div className="text-5xl mb-3">💌</div>
          <p className="font-medium">
            {tab === 'inbox' ? 'Hộp thư trống' : 'Chưa có thư nào được gửi'}
          </p>
          <p className="text-sm mt-1">
            {tab === 'inbox' ? 'Chờ thư từ người ấy...' : 'Hãy viết thư cho người ấy đi!'}
          </p>
          {tab === 'sent' && (
            <button
              type="button"
              onClick={() => { setEditingLetter(undefined); setComposeOpen(true); }}
              className="mt-4 bg-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Viết thư ngay
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              view={tab}
              onRead={handleRead}
              onDelete={tab === 'sent' ? (id) => deleteMutation.mutate(id) : undefined}
              onSend={tab === 'sent' ? (id) => sendMutation.mutate(id) : undefined}
              onEdit={tab === 'sent' ? handleEdit : undefined}
            />
          ))}
        </div>
      )}

      <ComposeLetterModal
        open={composeOpen}
        onClose={handleComposeClose}
        initialLetter={editingLetter}
        key={editingLetter?.id ?? 'new'}
      />

      {readLetter && (
        <LetterReadOverlay letters={[readLetter]} onClose={() => setReadLetter(null)} autoMarkRead={false} />
      )}
    </div>
  );
}
