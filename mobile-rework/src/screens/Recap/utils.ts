// Sprint 67 T452 — Date helpers for Recap screens. Mobile-rework treats the
// month string `YYYY-MM` as the canonical input (matches BE query param) and
// renders locale-appropriate display labels at the View boundary.

export function isValidMonthStr(s: string | null | undefined): s is string {
  return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export function isValidWeekStr(s: string | null | undefined): s is string {
  return typeof s === 'string' && /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(s);
}

// Default = previous full month, matches BE getMonthly()'s default behaviour.
// Used when the route doesn't pass `?month=`.
export function previousMonthStr(now: Date = new Date()): string {
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based; subtract 1 → 0-based prev → +1 below
  if (month === 0) {
    year -= 1;
    month = 12;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

const VI_MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const EN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export type MonthDisplay = {
  monthNumber: number; // 1..12
  year: number;
  monthNameVi: string; // 'Tháng 3'
  monthNameEn: string; // 'March'
  // Locale-formatted period label used by the cover kicker and signature.
  // 'Tháng 3, 2026' / 'March 2026'.
  formatted: { vi: string; en: string };
};

export function describeMonth(monthStr: string): MonthDisplay {
  const [yearRaw, monthRaw] = monthStr.split('-');
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);
  const idx = Math.min(Math.max(monthNumber - 1, 0), 11);
  return {
    monthNumber,
    year,
    monthNameVi: VI_MONTH_NAMES[idx]!,
    monthNameEn: EN_MONTH_NAMES[idx]!,
    formatted: {
      vi: `${VI_MONTH_NAMES[idx]}, ${year}`,
      en: `${EN_MONTH_NAMES[idx]} ${year}`,
    },
  };
}

export function daysInRange(startISO: string, endISO: string): number {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1);
}

// Pull the leading non-whitespace grapheme so the cover avatars can show
// "L"/"M" without false-positive emoji handling.
export function nameInitial(name: string | null | undefined): string {
  if (!name) return '·';
  const trimmed = name.trim();
  if (!trimmed) return '·';
  const first = Array.from(trimmed)[0]!;
  return first.toUpperCase();
}
