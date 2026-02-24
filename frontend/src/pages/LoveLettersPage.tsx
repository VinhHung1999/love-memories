import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Send, Plus, Clock, Check, CheckCheck, Trash2, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { loveLettersApi } from '../lib/api';
import type { LoveLetter, LetterStatus } from '../types';
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
}: {
  letter: LoveLetter;
  view: 'inbox' | 'sent';
  onRead: (letter: LoveLetter) => void;
  onDelete?: (id: string) => void;
  onSend?: (id: string) => void;
}) {
  const isUnread = letter.status === 'DELIVERED';
  const person = view === 'inbox' ? letter.sender : letter.recipient;

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
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          {letter.status === 'READ' && <CheckCheck className="w-4 h-4 text-green-500" />}
          {letter.status === 'DELIVERED' && <Check className="w-4 h-4 text-primary" />}
          {letter.status === 'SCHEDULED' && <Clock className="w-4 h-4 text-blue-500" />}
          {view === 'sent' && (letter.status === 'DRAFT' || letter.status === 'SCHEDULED') && (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              {letter.status === 'DRAFT' && onSend && (
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

function ComposeLetterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const reset = () => {
    setTitle(''); setContent(''); setMood(''); setScheduleMode(false); setScheduledAt('');
  };

  const handleClose = () => { onClose(); setTimeout(reset, 300); };

  const createMutation = useMutation({
    mutationFn: (sendNow: boolean) =>
      loveLettersApi.create({
        title,
        content,
        mood: mood || undefined,
        scheduledAt: scheduleMode && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        sendNow: sendNow || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['love-letters'] });
      toast.success('Thư đã được lưu!');
      handleClose();
    },
    onError: () => toast.error('Không thể lưu thư. Thử lại nhé.'),
  });

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
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

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
              className="mt-3 w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>

        <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-2">
          <button type="button" onClick={handleClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => createMutation.mutate(false)}
            disabled={!canSubmit || createMutation.isPending}
            className="px-4 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            onClick={() => createMutation.mutate(true)}
            disabled={!canSubmit || createMutation.isPending}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Gửi ngay
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReadLetterModal({ letter, onClose }: { letter: LoveLetter; onClose: () => void }) {
  if (!letter) return null;

  const mood = MOODS.find((m) => m.key === letter.mood);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #f8e4ea 0%, #fce8d5 50%, #e8f4f0 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
          style={{ background: 'linear-gradient(160deg, #fff9f9 0%, #fffdf8 100%)' }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          {/* Mood + header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{mood?.emoji ?? '💌'}</div>
            {mood && <p className="text-xs text-text-light mb-1">{mood.label}</p>}
            <h2 className="text-xl font-heading font-bold text-gray-900 leading-snug">{letter.title}</h2>
            <p className="text-xs text-text-light mt-1.5">
              {letter.sender?.name ?? '—'} → {letter.recipient?.name ?? '—'}
            </p>
            {letter.deliveredAt && (
              <p className="text-xs text-text-light/60 mt-0.5">
                {format(new Date(letter.deliveredAt), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-primary/20 mb-5" />

          {/* Content */}
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-body">
            {letter.content}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-dashed border-primary/20 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Đóng 💕
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function LoveLettersPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [readLetter, setReadLetter] = useState<LoveLetter | null>(null);

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

  const letters = tab === 'inbox' ? received : sent;
  const isLoading = tab === 'inbox' ? loadingInbox : loadingSent;
  const unreadCount = received.filter((l) => l.status === 'DELIVERED').length;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
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
          type="button"
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" /> Viết thư
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border mb-5">
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
              onClick={() => setComposeOpen(true)}
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
            />
          ))}
        </div>
      )}

      <ComposeLetterModal open={composeOpen} onClose={() => setComposeOpen(false)} />

      {readLetter && (
        <ReadLetterModal letter={readLetter} onClose={() => setReadLetter(null)} />
      )}
    </div>
  );
}
