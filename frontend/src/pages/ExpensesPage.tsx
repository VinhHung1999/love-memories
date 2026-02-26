import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as ChartTooltip,
} from 'recharts';
import Modal from '../components/Modal';
import AddExpenseModal from '../components/AddExpenseModal';
import { expensesApi } from '../lib/api';
import type { Expense, ExpenseCategory } from '../types';
import { useModuleTour } from '../lib/useModuleTour';

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string; color: string; chartColor: string }[] = [
  { key: 'food',      label: 'Ăn uống',   emoji: '🍜', color: 'bg-orange-100 text-orange-700 border-orange-300', chartColor: '#F97316' },
  { key: 'dating',    label: 'Hẹn hò',    emoji: '💑', color: 'bg-pink-100 text-pink-700 border-pink-300',     chartColor: '#EC4899' },
  { key: 'shopping',  label: 'Mua sắm',   emoji: '🛍️', color: 'bg-purple-100 text-purple-700 border-purple-300', chartColor: '#8B5CF6' },
  { key: 'transport', label: 'Di chuyển', emoji: '🚗', color: 'bg-blue-100 text-blue-700 border-blue-300',     chartColor: '#3B82F6' },
  { key: 'gifts',     label: 'Quà tặng',  emoji: '🎁', color: 'bg-rose-100 text-rose-700 border-rose-300',     chartColor: '#EF4444' },
  { key: 'other',     label: 'Khác',      emoji: '📦', color: 'bg-gray-100 text-gray-700 border-gray-300',     chartColor: '#6B7280' },
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
  { element: '[data-tour="expenses-chart"]', popover: { title: 'Biểu đồ chi tiêu', description: 'Chi tiêu theo ngày, phân theo danh mục màu sắc. Nhấn vào cột để lọc theo ngày đó.' } },
  { element: '[data-tour="expenses-category-filter"]', popover: { title: 'Lọc theo danh mục', description: 'Chọn danh mục để lọc chi tiêu. Biểu tượng ⚠️ báo vượt ngân sách.' } },
  { element: '[data-tour="expenses-list"]', popover: { title: 'Danh sách chi tiêu', description: 'Các khoản chi tiêu được nhóm theo ngày. Nhấn vào để sửa hoặc xoá.' } },
  { element: '[data-tour="expenses-fab"]', popover: { title: 'Thêm chi tiêu', description: 'Nhấn để ghi lại khoản chi tiêu mới. Hỗ trợ quét hoá đơn bằng AI!' } },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | null>(null);
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [limitDraft, setLimitDraft] = useState<Record<string, string>>({});
  const [savingLimits, setSavingLimits] = useState(false);

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

  const { data: dailyStats } = useQuery({
    queryKey: ['expenses-daily-stats', month],
    queryFn: () => expensesApi.dailyStats(month),
    staleTime: 30_000,
  });

  const { data: limits = {} } = useQuery({
    queryKey: ['expenses-limits'],
    queryFn: expensesApi.getLimits,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', month] });
      qc.invalidateQueries({ queryKey: ['expenses-stats', month] });
      qc.invalidateQueries({ queryKey: ['expenses-daily-stats', month] });
    },
  });

  // Chart data — flatten daily stats for recharts
  const chartData = useMemo(() => {
    if (!dailyStats) return [];
    return dailyStats.days.map((d) => ({
      date: d.date,
      day: parseInt(d.date.slice(8), 10),
      food: d.byCategory.food ?? 0,
      dating: d.byCategory.dating ?? 0,
      shopping: d.byCategory.shopping ?? 0,
      transport: d.byCategory.transport ?? 0,
      gifts: d.byCategory.gifts ?? 0,
      other: d.byCategory.other ?? 0,
    }));
  }, [dailyStats]);

  // Filtered + grouped by date
  const filtered = useMemo(() => {
    let list = expenses;
    if (filterCat) list = list.filter((e) => e.category === filterCat);
    if (filterDay) list = list.filter((e) => e.date.slice(0, 10) === filterDay);
    const groups: Record<string, Expense[]> = {};
    for (const e of list) {
      const day = e.date.slice(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day]!.push(e);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [expenses, filterCat, filterDay]);

  function handleSaved() {
    qc.invalidateQueries({ queryKey: ['expenses', month] });
    qc.invalidateQueries({ queryKey: ['expenses-stats', month] });
    qc.invalidateQueries({ queryKey: ['expenses-daily-stats', month] });
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setModalOpen(true);
  }

  async function handleDelete(e: Expense) {
    if (!confirm(`Xoá khoản "${e.description}"?`)) return;
    deleteMutation.mutate(e.id);
  }

  function openLimits() {
    const draft: Record<string, string> = {};
    for (const cat of CATEGORIES) {
      const v = limits[cat.key];
      draft[cat.key] = v != null ? String(v) : '';
    }
    setLimitDraft(draft);
    setLimitsOpen(true);
  }

  async function saveLimits() {
    setSavingLimits(true);
    try {
      const payload: Record<string, number | null> = {};
      for (const cat of CATEGORIES) {
        const v = parseFloat(limitDraft[cat.key] ?? '');
        payload[cat.key] = isNaN(v) || v <= 0 ? null : v;
      }
      await expensesApi.setLimits(payload);
      qc.invalidateQueries({ queryKey: ['expenses-limits'] });
      setLimitsOpen(false);
      toast.success('Đã lưu ngân sách');
    } catch {
      toast.error('Không thể lưu ngân sách');
    } finally {
      setSavingLimits(false);
    }
  }

  function handleBarClick(data: any) {
    if (!data?.activePayload?.length) return;
    const clickedDate = data.activePayload[0]?.payload?.date as string | undefined;
    if (!clickedDate) return;
    setFilterDay((prev) => (prev === clickedDate ? null : clickedDate));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Chi tiêu 💰</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi chi tiêu của hai bạn</p>
        </div>
        <button
          onClick={openLimits}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Ngân sách"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Month nav */}
      <div
        data-tour="expenses-month-nav"
        className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-4"
      >
        <button
          onClick={() => { setMonth((m) => offsetMonth(m, -1)); setFilterDay(null); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-heading font-semibold text-gray-800 capitalize">{monthLabel(month)}</span>
        <button
          onClick={() => { setMonth((m) => offsetMonth(m, 1)); setFilterDay(null); }}
          disabled={month >= currentMonth()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Summary card */}
      <div
        data-tour="expenses-summary"
        className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white mb-4 shadow-md"
      >
        <p className="text-sm text-white/80 mb-1">Tổng chi tiêu tháng này</p>
        <p className="font-heading text-3xl font-bold">{formatVND(stats?.total ?? 0)}</p>
        <p className="text-sm text-white/70 mt-1">{stats?.count ?? 0} khoản chi tiêu</p>
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

      {/* Daily bar chart */}
      {chartData.length > 0 && (
        <div
          data-tour="expenses-chart"
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chi tiêu theo ngày</p>
            {filterDay && (
              <button
                onClick={() => setFilterDay(null)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Bỏ lọc ngày {parseInt(filterDay.slice(8), 10)}
              </button>
            )}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} onClick={handleBarClick} barSize={6} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                formatter={(value: number | undefined) => formatVND(value ?? 0)}
                labelFormatter={(label) => `Ngày ${label}`}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }}
              />
              {CATEGORIES.map((c) => (
                <Bar
                  key={c.key}
                  dataKey={c.key}
                  stackId="a"
                  fill={filterDay ? (chartData.find((d) => d.date === filterDay)
                    ? (c.chartColor + 'CC')
                    : c.chartColor + '55')
                    : c.chartColor}
                  radius={c.key === 'other' ? [2, 2, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
        {CATEGORIES.map((c) => {
          const spent = stats?.byCategory[c.key]?.total ?? 0;
          const limit = limits[c.key];
          const isOver = limit != null && spent > limit;
          return (
            <button
              key={c.key}
              onClick={() => setFilterCat(filterCat === c.key ? null : c.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filterCat === c.key
                  ? 'bg-primary text-white border-primary'
                  : isOver
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : `${c.color} border`
              }`}
            >
              {c.emoji} {c.label}
              {isOver && ' ⚠️'}
              {limit != null && (
                <span className={`ml-1 text-xs opacity-70`}>
                  {Math.round((spent / limit) * 100)}%
                </span>
              )}
            </button>
          );
        })}
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {formatDate(day + 'T00:00:00')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatVND(items.reduce((s, e) => s + e.amount, 0))}
                  </p>
                </div>
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
                          {/* Receipt thumbnail */}
                          {expense.receiptUrl ? (
                            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img src={expense.receiptUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            </a>
                          ) : (
                            <span className="text-2xl shrink-0">{cat?.emoji}</span>
                          )}
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

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />

      {/* Budget Limits Modal */}
      <Modal open={limitsOpen} onClose={() => setLimitsOpen(false)} title="Ngân sách tháng">
        <div className="space-y-4 pb-6">
          <p className="text-sm text-gray-500">Đặt giới hạn chi tiêu cho từng danh mục. Để trống = không giới hạn.</p>
          {CATEGORIES.map((c) => {
            const spent = stats?.byCategory[c.key]?.total ?? 0;
            const limit = limits[c.key];
            const isOver = limit != null && spent > limit;
            return (
              <div key={c.key}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                  {spent > 0 && (
                    <span className={`ml-auto text-xs font-normal ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                      Đã chi: {formatVND(spent)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={limitDraft[c.key] ?? ''}
                  onChange={(e) => setLimitDraft((prev) => ({ ...prev, [c.key]: e.target.value }))}
                  placeholder="Không giới hạn"
                  className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    isOver ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  style={{ fontSize: '16px' }}
                />
                {limitDraft[c.key] && parseFloat(limitDraft[c.key]!) > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatVND(parseFloat(limitDraft[c.key]!))}</p>
                )}
              </div>
            );
          })}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLimitsOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={saveLimits}
              disabled={savingLimits}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {savingLimits ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
