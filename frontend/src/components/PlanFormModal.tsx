import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { datePlansApi } from '../lib/api';
import type { DateWish, DatePlan } from '../types';
import Modal from './Modal';
import LocationPicker from './LocationPicker';

const CATEGORY_ICONS: Record<string, string> = {
  eating: '🍜', travel: '✈️', entertainment: '🎬', cafe: '☕', shopping: '🛍️',
};
function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '📍';
}

type StopDraft = {
  id?: string;
  time: string;
  title: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  url: string;
  tags: string[];
  category: string;
  notes: string;
  wishId: string;
};

function emptyStop(): StopDraft {
  return { time: '', title: '', description: '', address: '', latitude: null, longitude: null, url: '', tags: [], category: '', notes: '', wishId: '' };
}

export default function PlanFormModal({
  open,
  plan,
  wishes = [],
  onClose,
}: {
  open: boolean;
  plan: DatePlan | null;
  wishes?: DateWish[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = plan !== null;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [stops, setStops] = useState<StopDraft[]>([emptyStop()]);

  // Sync on open / plan change
  const [lastPlanId, setLastPlanId] = useState<string | undefined>(undefined);
  if (plan?.id !== lastPlanId) {
    setLastPlanId(plan?.id);
    setTitle(plan?.title ?? '');
    setDate(plan?.date ? plan.date.slice(0, 10) : '');
    setNotes(plan?.notes ?? '');
    setStops(
      plan?.stops.length
        ? plan.stops.map((s) => ({
            id: s.id,
            time: s.time,
            title: s.title,
            description: s.description ?? '',
            address: s.address ?? '',
            latitude: s.latitude ?? null,
            longitude: s.longitude ?? null,
            url: s.url ?? '',
            tags: s.tags ?? [],
            category: s.category ?? '',
            notes: s.notes ?? '',
            wishId: s.wishId ?? '',
          }))
        : [emptyStop()]
    );
  }

  const addStop = () => setStops((prev) => [...prev, emptyStop()]);
  const removeStop = (i: number) => setStops((prev) => prev.filter((_, idx) => idx !== i));
  const moveStop = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= stops.length) return;
    setStops((prev) => {
      const next = [...prev];
      const tmp = next[i]!;
      next[i] = next[j]!;
      next[j] = tmp;
      return next;
    });
  };

  const updateStopDraft = (i: number, draft: StopDraft) =>
    setStops((prev) => prev.map((s, idx) => (idx === i ? draft : s)));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        date,
        notes: notes || undefined,
        stops: stops
          .filter((s) => s.title.trim())
          .map((s, idx) => ({
            id: s.id || undefined,
            time: s.time || '00:00',
            title: s.title,
            description: s.description || undefined,
            address: s.address || undefined,
            latitude: s.latitude ?? undefined,
            longitude: s.longitude ?? undefined,
            url: s.url || undefined,
            tags: s.tags.length > 0 ? s.tags : undefined,
            category: s.category || undefined,
            notes: s.notes || undefined,
            order: idx,
            wishId: s.wishId || undefined,
          })),
      };
      return isEdit
        ? datePlansApi.update(plan.id, payload)
        : datePlansApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-plans'] });
      toast.success(isEdit ? 'Đã cập nhật kế hoạch!' : 'Đã tạo kế hoạch!');
      onClose();
    },
    onError: () => toast.error('Không thể lưu kế hoạch'),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa kế hoạch' : 'Tạo kế hoạch mới'}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tên kế hoạch *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="Ví dụ: Hẹn hò cuối tuần"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ngày hẹn *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ghi chú thêm..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Stops */}
        <div>
          <label className="block text-sm font-medium mb-2">Địa điểm</label>
          <div className="space-y-3">
            {stops.map((stop, i) => (
              <StopEditor
                key={i}
                stop={stop}
                index={i}
                isFirst={i === 0}
                isLast={i === stops.length - 1}
                totalStops={stops.length}
                wishes={wishes}
                onChange={(draft) => updateStopDraft(i, draft)}
                onRemove={() => removeStop(i)}
                onMoveUp={() => moveStop(i, -1)}
                onMoveDown={() => moveStop(i, 1)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addStop}
            className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Thêm điểm dừng
          </button>
        </div>

        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !title.trim() || !date}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo kế hoạch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── StopEditor ─────────────────────────────────────────────────────────────────

function StopEditor({
  stop,
  index,
  isFirst,
  isLast,
  totalStops,
  wishes,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  stop: StopDraft;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  totalStops: number;
  wishes: DateWish[];
  onChange: (draft: StopDraft) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const set = (field: keyof StopDraft, value: StopDraft[keyof StopDraft]) =>
    onChange({ ...stop, [field]: value });

  const handleWishSelect = (wishId: string) => {
    const wish = wishes.find((w) => w.id === wishId);
    onChange({
      ...stop,
      wishId,
      title:       wish?.title       ?? stop.title,
      description: wish?.description ?? stop.description,
      category:    wish?.category    ?? stop.category,
      address:     wish?.address     ?? stop.address,
      latitude:    wish?.latitude    ?? stop.latitude,
      longitude:   wish?.longitude   ?? stop.longitude,
      url:         wish?.url         ?? stop.url,
    });
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2.5 border border-border/50">
      {/* Row: index + time + reorder/delete */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-light w-5 flex-shrink-0">{index + 1}.</span>
        <input
          type="time"
          value={stop.time}
          onChange={(e) => set('time', e.target.value)}
          className="w-28 border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-1 ml-auto">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1 text-text-light disabled:opacity-30 hover:text-text transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1 text-text-light disabled:opacity-30 hover:text-text transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={onRemove} disabled={totalStops === 1} className="p-1 text-red-400 hover:text-red-500 disabled:opacity-30 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wish picker */}
      {wishes.length > 0 && (
        <select
          value={stop.wishId}
          onChange={(e) => handleWishSelect(e.target.value)}
          className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-text-light"
        >
          <option value="">Chọn từ wishlist (tuỳ chọn)...</option>
          {wishes.map((w) => (
            <option key={w.id} value={w.id}>{getCategoryIcon(w.category)} {w.title}</option>
          ))}
        </select>
      )}

      {/* Title */}
      <input
        value={stop.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="Tên địa điểm *"
        className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Description */}
      <textarea
        value={stop.description}
        onChange={(e) => set('description', e.target.value)}
        rows={2}
        placeholder="Mô tả..."
        className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      />

      {/* Address via LocationPicker */}
      <LocationPicker
        latitude={stop.latitude}
        longitude={stop.longitude}
        location={stop.address || null}
        onChange={({ latitude, longitude, location }) =>
          onChange({ ...stop, address: location, latitude, longitude })
        }
        onClear={() => onChange({ ...stop, address: '', latitude: null, longitude: null })}
      />

      {/* URL */}
      <input
        type="url"
        value={stop.url}
        onChange={(e) => set('url', e.target.value)}
        placeholder="URL (https://...)"
        className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Notes */}
      <input
        value={stop.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Ghi chú thêm"
        className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
