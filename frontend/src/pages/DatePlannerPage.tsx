import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarHeart, Heart, Plus, Trash2, Check, ChevronUp, ChevronDown, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { dateWishesApi, datePlansApi, momentsApi, foodSpotsApi } from '../lib/api';
import type { DateWish, DatePlan } from '../types';
import Modal from '../components/Modal';
import LocationPicker from '../components/LocationPicker';
import { ActionLink, ActionPill, DirectionsLink } from '../components/ActionButtons';

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
  // Wishes state
  const [showForm, setShowForm] = useState(false);
  const [editWish, setEditWish] = useState<DateWish | null>(null);
  const [doneWish, setDoneWish] = useState<DateWish | null>(null);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  // Plans state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editPlan, setEditPlan] = useState<DatePlan | null>(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: wishes = [], isLoading } = useQuery({
    queryKey: ['date-wishes'],
    queryFn: dateWishesApi.list,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['date-plans'],
    queryFn: datePlansApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dateWishesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-wishes'] });
      toast.success('Đã xóa!');
    },
    onError: () => toast.error('Không thể xóa'),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => datePlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['date-plans'] });
      toast.success('Đã xóa kế hoạch!');
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

        </>
      )}

      {/* ── Plans tab ── */}
      {activeTab === 'plans' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-light text-sm">{plans.length} kế hoạch</p>
            <button
              onClick={() => setShowPlanForm(true)}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Tạo kế hoạch
            </button>
          </div>

          {plansLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarHeart className="w-14 h-14 text-primary/25 mb-4" />
              <p className="font-heading text-lg font-semibold text-text-light">Chưa có kế hoạch nào</p>
              <p className="text-text-light text-sm mt-1 mb-5">Lên kế hoạch cho buổi hẹn hò tiếp theo!</p>
              <button
                onClick={() => setShowPlanForm(true)}
                className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tạo kế hoạch
              </button>
            </div>
          ) : (() => {
            const today = new Date();
            const activePlans = plans.filter((p) => {
              const pd = new Date(p.date);
              const isToday = pd.getDate() === today.getDate() && pd.getMonth() === today.getMonth() && pd.getFullYear() === today.getFullYear();
              return p.status === 'active' && isToday;
            });
            const otherPlans = plans.filter((p) => !activePlans.includes(p));
            const renderCard = (plan: DatePlan, i: number) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                forceActive={activePlans.includes(plan)}
                onClick={() => navigate(`/date-planner/plans/${plan.id}`)}
                onEdit={() => setEditPlan(plan)}
                onDelete={() => { if (confirm('Xóa kế hoạch này?')) deletePlanMutation.mutate(plan.id); }}
              />
            );
            return (
              <div className="space-y-4">
                {activePlans.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Đang diễn ra</p>
                    <div className="space-y-3">{activePlans.map((p, i) => renderCard(p, i))}</div>
                  </div>
                )}
                {otherPlans.length > 0 && (
                  <div>
                    {activePlans.length > 0 && <p className="text-xs font-semibold text-text-light uppercase tracking-wide mb-2">Kế hoạch khác</p>}
                    <div className="space-y-3">{otherPlans.map((p, i) => renderCard(p, i))}</div>
                  </div>
                )}
              </div>
            );
          })()}

        </>
      )}

      {/* FAB — rendered at page root level to avoid overflow/transform parent issues */}
      {activeTab === 'wishes' && filtered.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      {activeTab === 'plans' && plans.length > 0 && (
        <button
          onClick={() => setShowPlanForm(true)}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
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
      <PlanFormModal
        open={showPlanForm || editPlan !== null}
        plan={editPlan}
        wishes={wishes.filter((w) => !w.done)}
        onClose={() => { setShowPlanForm(false); setEditPlan(null); }}
      />
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
          {wish.address && (
            <p className="text-text-light text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />{wish.address}
            </p>
          )}
          {wish.description && (
            <p className="text-text-light text-xs mt-0.5 line-clamp-2">{wish.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {getCategoryLabel(wish.category)}
            </span>
            {wish.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-gray-100 text-text-light rounded-full text-xs">{t}</span>
            ))}
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

      {/* URL link + directions + done links */}
      {(wish.url || wish.latitude != null || wish.address || (wish.done && (wish.linkedMomentId || wish.linkedFoodSpotId))) && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-border flex-wrap">
          <DirectionsLink
            latitude={wish.latitude}
            longitude={wish.longitude}
            address={wish.address}
            title={wish.title}
            onClick={(e) => e.stopPropagation()}
          />
          {wish.url && (
            <ActionPill href={wish.url} label="🔗 Xem link →" color="secondary" onClick={(e) => e.stopPropagation()} />
          )}
          {wish.done && wish.linkedMomentId && (
            <ActionLink to={`/moments/${wish.linkedMomentId}`} label="📸 Xem kỷ niệm →" color="primary" />
          )}
          {wish.done && wish.linkedFoodSpotId && (
            <ActionLink to={`/foodspots/${wish.linkedFoodSpotId}`} label="🍽️ Xem quán →" color="secondary" />
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
  const [address, setAddress] = useState(wish?.address ?? '');
  const [latitude, setLatitude] = useState<number | null>(wish?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(wish?.longitude ?? null);
  const [url, setUrl] = useState(wish?.url ?? '');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>(wish?.tags ?? []);

  // Reset when modal opens for new wish or switches to a different wish
  const [lastWishId, setLastWishId] = useState<string | undefined>(undefined);
  if (wish?.id !== lastWishId) {
    setLastWishId(wish?.id);
    setTitle(wish?.title ?? '');
    setDescription(wish?.description ?? '');
    setCategory((wish?.category as Category) ?? 'eating');
    setAddress(wish?.address ?? '');
    setLatitude(wish?.latitude ?? null);
    setLongitude(wish?.longitude ?? null);
    setUrl(wish?.url ?? '');
    setTags(wish?.tags ?? []);
    setTagsInput('');
  }

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagsInput('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description: description || undefined,
        category,
        address: address || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        url: url || undefined,
        tags,
      };
      if (isEdit) return dateWishesApi.update(wish.id, payload);
      return dateWishesApi.create(payload);
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
            placeholder="Ghi thêm chi tiết..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Địa chỉ</label>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            location={address || null}
            onChange={({ latitude: lat, longitude: lng, location }) => {
              setLatitude(lat);
              setLongitude(lng);
              setAddress(location);
            }}
            onClear={() => {
              setLatitude(null);
              setLongitude(null);
              setAddress('');
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="text-primary/60 hover:text-primary ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(tagsInput); }
                if (e.key === ',') { e.preventDefault(); addTag(tagsInput); }
              }}
              placeholder="Nhập tag rồi Enter..."
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => addTag(tagsInput)}
              disabled={!tagsInput.trim()}
              className="px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 disabled:opacity-40 transition-colors"
            >
              Thêm
            </button>
          </div>
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

// ── PlanCard ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  planned:   { label: 'Sắp tới',    cls: 'bg-gray-100 text-gray-500' },
  active:    { label: 'Đang diễn ra', cls: 'bg-blue-100 text-blue-600' },
  completed: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-600' },
};

function PlanCard({
  plan,
  index,
  forceActive = false,
  onClick,
  onEdit,
  onDelete,
}: {
  plan: DatePlan;
  index: number;
  forceActive?: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = forceActive
    ? (STATUS_LABELS['active'] ?? { label: 'Đang diễn ra', cls: 'bg-blue-100 text-blue-600' })
    : (STATUS_LABELS[plan.status] ?? { label: 'Sắp tới', cls: 'bg-gray-100 text-gray-500' });
  const doneCount = plan.stops.filter((st) => st.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border cursor-pointer ${
        forceActive ? 'border-blue-200 ring-1 ring-blue-100' : 'border-transparent hover:border-black/5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-text truncate">{plan.title}</p>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
          </div>
          <p className="text-xs text-text-light mt-0.5">
            {new Date(plan.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-text-light flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {plan.stops.length} điểm đến
            </span>
            {plan.stops.length > 0 && (
              <span className="text-xs text-text-light">{doneCount}/{plan.stops.length} done</span>
            )}
          </div>
        </div>
      </div>
      {/* Actions row */}
      <div className="flex gap-2 mt-3 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
        {plan.status !== 'completed' && (
          <button
            onClick={onEdit}
            className="flex-1 text-xs text-text-light hover:text-primary py-1 transition-colors"
          >
            Chỉnh sửa
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex-1 text-xs text-red-400 hover:text-red-500 py-1 transition-colors"
        >
          Xóa
        </button>
      </div>
    </motion.div>
  );
}

// ── PlanFormModal ─────────────────────────────────────────────────────────────

type StopDraft = {
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

function PlanFormModal({
  open,
  plan,
  wishes,
  onClose,
}: {
  open: boolean;
  plan: DatePlan | null;
  wishes: DateWish[];
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
