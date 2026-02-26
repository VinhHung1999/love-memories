import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { expensesApi } from '../lib/api';
import type { Expense, ExpenseCategory } from '../types';
import { useModuleTour } from '../lib/useModuleTour';

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string; color: string }[] = [
  { key: 'food',      label: 'Ăn uống',   emoji: '🍜', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { key: 'dating',    label: 'Hẹn hò',    emoji: '💑', color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { key: 'shopping',  label: 'Mua sắm',   emoji: '🛍️', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { key: 'transport', label: 'Di chuyển', emoji: '🚗', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { key: 'gifts',     label: 'Quà tặng',  emoji: '🎁', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  { key: 'other',     label: 'Khác',      emoji: '📦', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<ExpenseCategory, typeof CATEGORIES[0]>;

// ── Formatters ────────────────────────────────────────────────────────────────

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

// ── Month helpers ─────────────────────────────────────────────────────────────

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function offsetMonth(m: string, delta: number) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y!, mo! - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y!, mo! - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

// ── Tour steps ────────────────────────────────────────────────────────────────

const TOUR_STEPS = [
  { element: '[data-tour="expenses-month-nav"]', popover: { title: 'Điều hướng tháng', description: 'Dùng mũi tên để xem chi tiêu tháng trước hoặc tháng sau.' } },
  { element: '[data-tour="expenses-summary"]', popover: { title: 'Tổng chi tiêu', description: 'Xem tổng số tiền và số lần chi tiêu trong tháng.' } },
  { element: '[data-tour="expenses-category-filter"]', popover: { title: 'Lọc theo danh mục', description: 'Chọn danh mục để lọc chi tiêu: ăn uống, hẹn hò, mua sắm, ...' } },
  { element: '[data-tour="expenses-list"]', popover: { title: 'Danh sách chi tiêu', description: 'Các khoản chi tiêu được nhóm theo ngày. Nhấn vào để sửa hoặc xoá.' } },
  { element: '[data-tour="expenses-fab"]', popover: { title: 'Thêm chi tiêu', description: 'Nhấn để ghi lại khoản chi tiêu mới.' } },
];

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = () => ({
  amount: '',
  description: '',
  category: 'food' as ExpenseCategory,
  date: new Date().toISOString().slice(0, 10),
  note: '',
});

// ─────────────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useModuleTour('expenses', TOUR_STEPS);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', month],
    queryFn: () => expensesApi.list(month),
    staleTime: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['expenses-stats', month],
    queryFn: () => expensesApi.stats(month),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', month] });
      qc.invalidateQueries({ queryKey: ['expenses-stats', month] });
    },
  });

  // Filtered + grouped by date
  const filtered = useMemo(() => {
    const list = filterCat ? expenses.filter((e) => e.category === filterCat) : expenses;
    // Group by date (YYYY-MM-DD)
    const groups: Record<string, Expense[]> = {};
    for (const e of list) {
      const day = e.date.slice(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day]!.push(e);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses, filterCat]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      amount: String(e.amount),
      description: e.description,
      category: e.category,
      date: toDateInput(e.date),
      note: e.note ?? '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0 || !form.description.trim()) return;
    setSaving(true);
    try {
      const payload = {
        amount,
        description: form.description.trim(),
        category: form.category,
        date: new Date(form.date).toISOString(),
        note: form.note.trim() || undefined,
      };
      if (editing) {
        await expensesApi.update(editing.id, payload);
      } else {
        await expensesApi.create(payload);
      }
      qc.invalidateQueries({ queryKey: ['expenses', month] });
      qc.invalidateQueries({ queryKey: ['expenses-stats', month] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu chi tiêu');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: Expense) {
    if (!confirm(`Xoá khoản "${e.description}"?`)) return;
    deleteMutation.mutate(e.id);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Chi tiêu 💰</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi chi tiêu của hai bạn</p>
      </div>

      {/* Month nav */}
      <div
        data-tour="expenses-month-nav"
        className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-4"
      >
        <button
          onClick={() => setMonth((m) => offsetMonth(m, -1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-heading font-semibold text-gray-800 capitalize">{monthLabel(month)}</span>
        <button
          onClick={() => setMonth((m) => offsetMonth(m, 1))}
          disabled={month >= currentMonth()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Summary card */}
      <div
        data-tour="expenses-summary"
        className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white mb-5 shadow-md"
      >
        <p className="text-sm text-white/80 mb-1">Tổng chi tiêu tháng này</p>
        <p className="font-heading text-3xl font-bold">{formatVND(stats?.total ?? 0)}</p>
        <p className="text-sm text-white/70 mt-1">{stats?.count ?? 0} khoản chi tiêu</p>
        {/* Category bars */}
        {stats && stats.total > 0 && (
          <div className="mt-4 space-y-1.5">
            {CATEGORIES.filter((c) => (stats.byCategory[c.key]?.total ?? 0) > 0).map((c) => {
              const pct = Math.round(((stats.byCategory[c.key]?.total ?? 0) / stats.total) * 100);
              return (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <span className="w-16 shrink-0 text-white/80">{c.emoji} {c.label}</span>
                  <div className="flex-1 bg-white/20 rounded-full h-1.5">
                    <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-white/80">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category filter chips */}
      <div data-tour="expenses-category-filter" className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          onClick={() => setFilterCat(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            filterCat === null
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
          }`}
        >
          Tất cả
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilterCat(filterCat === c.key ? null : c.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filterCat === c.key ? 'bg-primary text-white border-primary' : `${c.color} border`
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Expense list */}
      <div data-tour="expenses-list">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 text-gray-400"
          >
            <p className="text-4xl mb-3">💸</p>
            <p className="font-medium">Chưa có chi tiêu nào</p>
            <p className="text-sm mt-1">Nhấn + để thêm khoản chi tiêu mới</p>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {filtered.map(([day, items]) => (
              <div key={day}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {formatDate(day + 'T00:00:00')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatVND(items.reduce((s, e) => s + e.amount, 0))}
                  </p>
                </div>
                {/* Items */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((expense) => {
                      const cat = CAT_MAP[expense.category];
                      return (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
                        >
                          <span className="text-2xl">{cat?.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{expense.description}</p>
                            {expense.note && (
                              <p className="text-xs text-gray-400 truncate">{expense.note}</p>
                            )}
                            <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full border ${cat?.color}`}>
                              {cat?.label}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                              {formatVND(expense.amount)}
                            </p>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEdit(expense)}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(expense)}
                                className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        data-tour="expenses-fab"
        onClick={openNew}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-40"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Sửa chi tiêu' : 'Thêm chi tiêu'}
      >
        <div className="space-y-4 pb-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền (₫) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="150000"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-base"
              style={{ fontSize: '16px' }}
            />
            {form.amount && parseFloat(form.amount) > 0 && (
              <p className="text-xs text-primary mt-1">{formatVND(parseFloat(form.amount))}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Bún bò Huế, Cafe date, ..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-base"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Category grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: c.key }))}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    form.category === c.key
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <span className={`text-xs font-medium ${form.category === c.key ? 'text-primary' : 'text-gray-600'}`}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-base"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tuỳ chọn)</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Thêm ghi chú..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-base"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.amount || !form.description.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
