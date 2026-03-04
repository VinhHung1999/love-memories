import type { ExpenseCategory } from '../../lib/api';

export const EXPENSE_CATEGORIES: { key: ExpenseCategory | 'all'; emoji: string; label: string }[] = [
  { key: 'all',       emoji: '✨', label: 'All' },
  { key: 'food',      emoji: '🍜', label: 'Food' },
  { key: 'dating',    emoji: '💑', label: 'Dating' },
  { key: 'shopping',  emoji: '🛍️', label: 'Shopping' },
  { key: 'transport', emoji: '🚗', label: 'Transport' },
  { key: 'gifts',     emoji: '🎁', label: 'Gifts' },
  { key: 'other',     emoji: '📦', label: 'Other' },
];

export const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', dating: '💑', shopping: '🛍️',
  transport: '🚗', gifts: '🎁', other: '📦',
};

export const CATEGORY_BG: Record<string, string> = {
  food:      'rgba(244,162,97,0.14)',
  dating:    'rgba(232,120,138,0.14)',
  shopping:  'rgba(126,200,181,0.14)',
  transport: 'rgba(100,149,237,0.12)',
  gifts:     'rgba(232,120,138,0.10)',
  other:     'rgba(168,152,173,0.12)',
};

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function getCategoryEmoji(cat: string): string {
  return CATEGORY_EMOJI[cat] ?? '📦';
}

export function getCategoryBg(cat: string): string {
  return CATEGORY_BG[cat] ?? 'rgba(168,152,173,0.12)';
}
