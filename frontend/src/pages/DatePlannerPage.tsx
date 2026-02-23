import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarHeart, Heart, Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { dateWishesApi, momentsApi, foodSpotsApi } from '../lib/api';
import type { DateWish } from '../types';
import Modal from '../components/Modal';

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'wishes', label: 'Muốn đi' },
  { id: 'plans', label: 'Kế hoạch' },
] as const;

type Tab = typeof TABS[number]['id'];

const CATEGORIES = [
  { id: 'eating',        label: 'Ăn uống',   icon: '🍜' },
  { id: 'travel',        label: 'Du lịch',   icon: '✈️' },
  { id: 'entertainment', label: 'Giải trí',  icon: '🎬' },
  { id: 'cafe',          label: 'Cafe',      icon: '☕' },
  { id: 'shopping',      label: 'Shopping',  icon: '🛍️' },
] as const;

type Category = typeof CATEGORIES[number]['id'];

const STATUS_FILTERS = [
  { id: 'all',  label: 'Tất cả' },
  { id: 'todo', label: 'Muốn đi' },
  { id: 'done', label: 'Đã đi' },
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]['id'];

function getCategoryIcon(category: string): string {
  return CATEGORIES.find((c) => c.id === category)?.icon ?? '📍';
}

function getCategoryLabel(category: string): string {
  return CATEGORIES.find((c) => c.id === category)?.label ?? category;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DatePlannerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('wishes');
  const [showForm, setShowForm] = useState(false);
  const [editWish, setEditWish] = useState<DateWish | null>(null);
  const [doneWish, setDoneWish] = useState<DateWish | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const queryClient = useQueryClient();

  const { data: wishes = [], isLoading } = useQuery({
    queryKey: ['date-wishes'],
    queryFn: dateWishesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dateWishesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-wishes'] });
      toast.success('Đã xóa!');
    },
    onError: () => toast.error('Không thể xóa'),
  });

  const filtered = wishes.filter((w) => {
    if (filterCategory !== 'all' && w.category !== filterCategory) return false;
    if (filterStatus === 'todo' && w.done) return false;
    if (filterStatus === 'done' && !w.done) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Date Planner</h1>
          <p className="text-text-light text-sm mt-1">Kế hoạch hẹn hò của chúng mình</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-text shadow-sm'
                : 'text-text-light hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Wishes tab ── */}
      {activeTab === 'wishes' && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-text-light hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-light hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-6">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.id}
                onClick={() => setFilterStatus(sf.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === sf.id
                    ? 'bg-secondary text-white'
                    : 'bg-gray-100 text-text-light hover:bg-gray-200'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-14 h-14 text-primary/25 mb-4" />
              <p className="font-heading text-lg font-semibold text-text-light">
                Chưa có ước mơ nào
              </p>
              <p className="text-text-light text-sm mt-1 mb-5">Thêm ngay những nơi muốn đến cùng nhau!</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Thêm ước mơ
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {filtered.map((wish, i) => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    index={i}
                    onEdit={() => setEditWish(wish)}
                    onDelete={() => {
                      if (confirm('Xóa ước mơ này?')) deleteMutation.mutate(wish.id);
                    }}
                    onMarkDone={() => setDoneWish(wish)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* FAB */}
          {filtered.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-40"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* ── Plans tab placeholder ── */}
      {activeTab === 'plans' && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarHeart className="w-16 h-16 text-primary/30 mb-4" />
          <p className="font-heading text-lg font-semibold text-text-light">Sắp ra mắt...</p>
          <p className="text-text-light text-sm mt-1">Tính năng lập kế hoạch đang được xây dựng</p>
        </div>
      )}

      {/* Modals */}
      <WishFormModal
        open={showForm || editWish !== null}
        wish={editWish}
        onClose={() => { setShowForm(false); setEditWish(null); }}
      />
      {doneWish && (
        <MarkDoneModal
          wish={doneWish}
          onClose={() => setDoneWish(null)}
        />
      )}
    </div>
  );
}

// ── WishCard ─────────────────────────────────────────────────────────────────

function WishCard({
  wish,
  index,
  onEdit,
  onDelete,
  onMarkDone,
}: {
  wish: DateWish;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-transparent transition-all ${
        wish.done ? 'opacity-60' : 'hover:shadow-md hover:border-black/5'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="text-2xl flex-shrink-0 mt-0.5">{getCategoryIcon(wish.category)}</div>

        {/* Content — tap to edit */}
        <button className="flex-1 text-left min-w-0" onClick={onEdit}>
          <p className={`font-semibold text-sm leading-snug ${wish.done ? 'line-through text-text-light' : 'text-text'}`}>
            {wish.title}
          </p>
          {wish.description && (
            <p className="text-text-light text-xs mt-0.5 line-clamp-2">{wish.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {getCategoryLabel(wish.category)}
            </span>
            {wish.done && wish.doneAt && (
              <span className="text-xs text-text-light">✓ {formatDate(wish.doneAt)}</span>
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {!wish.done && (
            <button
              onClick={onMarkDone}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Check className="w-3 h-3" /> Đã đi!
            </button>
          )}
        </div>
      </div>

      {/* Links to moment/foodspot after done */}
      {wish.done && (wish.linkedMomentId || wish.linkedFoodSpotId) && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-border">
          {wish.linkedMomentId && (
            <Link
              to={`/moments/${wish.linkedMomentId}`}
              className="text-xs text-primary hover:underline"
            >
              📸 Xem kỷ niệm →
            </Link>
          )}
          {wish.linkedFoodSpotId && (
            <Link
              to={`/foodspots/${wish.linkedFoodSpotId}`}
              className="text-xs text-secondary hover:underline"
            >
              🍽️ Xem quán →
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── WishFormModal ─────────────────────────────────────────────────────────────

function WishFormModal({
  open,
  wish,
  onClose,
}: {
  open: boolean;
  wish: DateWish | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = wish !== null;

  const [title, setTitle] = useState(wish?.title ?? '');
  const [description, setDescription] = useState(wish?.description ?? '');
  const [category, setCategory] = useState<Category>(
    (wish?.category as Category) ?? 'eating'
  );

  // Sync fields when wish changes (edit mode)
  const wishId = wish?.id;
  const wishTitle = wish?.title;
  const wishDescription = wish?.description;
  const wishCategory = wish?.category;

  // Reset when modal opens for new wish or switches to a different wish
  const [lastWishId, setLastWishId] = useState<string | undefined>(undefined);
  if (wishId !== lastWishId) {
    setLastWishId(wishId);
    setTitle(wishTitle ?? '');
    setDescription(wishDescription ?? '');
    setCategory((wishCategory as Category) ?? 'eating');
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return dateWishesApi.update(wish.id, {
          title,
          description: description || undefined,
          category,
        });
      }
      return dateWishesApi.create({ title, description: description || undefined, category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-wishes'] });
      toast.success(isEdit ? 'Đã cập nhật!' : 'Đã thêm ước mơ!');
      onClose();
    },
    onError: () => toast.error('Không thể lưu'),
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa ước mơ' : 'Thêm ước mơ mới'}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tên địa điểm / hoạt động *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="Ví dụ: Đi ăn lẩu Haidilao"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ghi thêm chi tiết, địa chỉ..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Loại hoạt động</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-colors ${
                  category === cat.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-light hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !title.trim()}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── MarkDoneModal ─────────────────────────────────────────────────────────────

function MarkDoneModal({ wish, onClose }: { wish: DateWish; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [linkedMomentId, setLinkedMomentId] = useState<string>('');
  const [linkedFoodSpotId, setLinkedFoodSpotId] = useState<string>('');

  const { data: moments = [] } = useQuery({
    queryKey: ['moments'],
    queryFn: momentsApi.list,
  });

  const { data: foodSpots = [] } = useQuery({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
  });

  const mutation = useMutation({
    mutationFn: () =>
      dateWishesApi.markDone(
        wish.id,
        linkedMomentId || null,
        linkedFoodSpotId || null,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-wishes'] });
      toast.success('Đã đánh dấu đã đi! 🎉');
      onClose();
    },
    onError: () => toast.error('Không thể cập nhật'),
  });

  return (
    <Modal open onClose={onClose} title="Đã đi rồi! 🎉">
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-primary/5 rounded-xl p-3">
          <span className="text-2xl">{getCategoryIcon(wish.category)}</span>
          <div>
            <p className="font-semibold text-sm">{wish.title}</p>
            <p className="text-xs text-text-light">{getCategoryLabel(wish.category)}</p>
          </div>
        </div>

        <p className="text-sm text-text-light">
          Muốn link tới kỷ niệm hoặc quán ăn liên quan không?
        </p>

        {moments.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">📸 Link tới Moment</label>
            <select
              value={linkedMomentId}
              onChange={(e) => { setLinkedMomentId(e.target.value); if (e.target.value) setLinkedFoodSpotId(''); }}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Không link</option>
              {moments.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} — {new Date(m.date).toLocaleDateString('vi-VN')}
                </option>
              ))}
            </select>
          </div>
        )}

        {foodSpots.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">🍽️ Link tới Food Spot</label>
            <select
              value={linkedFoodSpotId}
              onChange={(e) => { setLinkedFoodSpotId(e.target.value); if (e.target.value) setLinkedMomentId(''); }}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Không link</option>
              {foodSpots.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-3 pb-2 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-border mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {mutation.isPending ? 'Đang lưu...' : 'Xác nhận đã đi!'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
