import { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { expensesApi, aiApi } from '../lib/api';
import type { Expense, ExpenseCategory } from '../types';

const CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: 'food',      label: 'Ăn uống',   emoji: '🍜' },
  { key: 'dating',    label: 'Hẹn hò',    emoji: '💑' },
  { key: 'shopping',  label: 'Mua sắm',   emoji: '🛍️' },
  { key: 'transport', label: 'Di chuyển', emoji: '🚗' },
  { key: 'gifts',     label: 'Quà tặng',  emoji: '🎁' },
  { key: 'other',     label: 'Khác',      emoji: '📦' },
];

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export interface AddExpenseDefaults {
  description?: string;
  category?: ExpenseCategory;
  amount?: number;
  date?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: Expense | null;
  defaults?: AddExpenseDefaults;
  /** Extra action button rendered next to Cancel (e.g. Skip) */
  extraAction?: { label: string; onClick: () => void };
}

function buildForm(defaults?: AddExpenseDefaults, editing?: Expense | null) {
  if (editing) {
    return {
      amount: String(editing.amount),
      description: editing.description,
      category: editing.category,
      date: editing.date.slice(0, 10),
      note: editing.note ?? '',
      receiptUrl: editing.receiptUrl ?? null,
    };
  }
  return {
    amount: defaults?.amount ? String(defaults.amount) : '',
    description: defaults?.description ?? '',
    category: (defaults?.category ?? 'food') as ExpenseCategory,
    date: defaults?.date ?? new Date().toISOString().slice(0, 10),
    note: '',
    receiptUrl: null as string | null,
  };
}

export default function AddExpenseModal({ open, onClose, onSaved, editing, defaults, extraAction }: Props) {
  const [form, setForm] = useState(() => buildForm(defaults, editing));
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  // Hidden file input always in DOM to avoid conditional render + ref bug
  const fileInputRef = useRef<HTMLInputElement | undefined>(undefined);

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setForm(buildForm(defaults, editing));
      setScanning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  async function handleScan(file: File) {
    setScanning(true);
    try {
      // Scan receipt with AI
      const result = await aiApi.scanReceipt(file);
      // Upload receipt image to CDN
      const uploaded = await expensesApi.uploadReceipt(file);
      const validCats: ExpenseCategory[] = ['food', 'dating', 'shopping', 'transport', 'gifts', 'other'];
      setForm((f) => ({
        ...f,
        amount: result.amount ? String(result.amount) : f.amount,
        description: result.description || f.description,
        category: validCats.includes(result.category as ExpenseCategory)
          ? (result.category as ExpenseCategory)
          : f.category,
        // date: intentionally NOT set from receipt — old receipts have old dates
        // which would save the expense to the wrong month
        receiptUrl: uploaded.url,
      }));
      toast.success('Đã quét hoá đơn thành công!');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể quét hoá đơn');
    } finally {
      setScanning(false);
    }
  }

  async function handleSave() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0 || !form.description.trim()) return;
    if (saving) return; // guard against double-tap
    setSaving(true);
    try {
      const payload = {
        amount,
        description: form.description.trim(),
        category: form.category,
        date: new Date(form.date).toISOString(),
        note: form.note.trim() || undefined,
        receiptUrl: form.receiptUrl || undefined,
      };
      if (editing) {
        await expensesApi.update(editing.id, payload);
      } else {
        await expensesApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu chi tiêu');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa chi tiêu' : 'Thêm chi tiêu'}>
      {/* Always-in-DOM hidden file input */}
      <input
        ref={(el) => { fileInputRef.current = el ?? undefined; }}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleScan(file);
        }}
      />

      <div className="space-y-4 pb-6">
        {/* Receipt section */}
        {form.receiptUrl ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={form.receiptUrl} alt="Hoá đơn" className="w-full h-44 object-cover" />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, receiptUrl: null }))}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-60"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang quét hoá đơn...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Chụp/chọn hoá đơn để tự điền</span>
              </>
            )}
          </button>
        )}

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
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
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
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {extraAction ? (
            <button
              type="button"
              onClick={extraAction.onClick}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            >
              {extraAction.label}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            >
              Huỷ
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || scanning || !form.amount || !form.description.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
