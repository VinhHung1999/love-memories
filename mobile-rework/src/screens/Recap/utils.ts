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

// Sprint 67 D4 — current calendar month as YYYY-MM. Used by the day-based
// default rule below.
export function currentMonthStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Sprint 67 D4 — day-based default: when the user is in the last few days
// of the month (>= 28) we assume they want a "this month so far" recap,
// otherwise the previous full month (Spotify-Wrapped style). Used as the
// initial month for MonthlyStoriesScreen when no `?month=` param is passed.
// 28 chosen so February (which can end on day 28) and the last days of any
// month all fall into the "current" bucket.
export function defaultMonthStr(now: Date = new Date()): string {
  return now.getDate() >= 28 ? currentMonthStr(now) : previousMonthStr(now);
}

// Sprint 67 D4 — month before the given YYYY-MM string, used by the empty-
// fallback retry to walk backwards until something with data turns up.
export function offsetMonthStr(monthStr: string, deltaMonths: number): string {
  const [yearRaw, monthRaw] = monthStr.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw); // 1-based
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthStr;
  const total = year * 12 + (month - 1) + deltaMonths;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12 + 12) % 12 + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
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

// ── ISO week helpers (Sprint 67 T456) ────────────────────────────────────────
// Mirror of `backend/src/services/RecapService.ts` getISOWeek() so mobile +
// BE agree on which week a Date sits in.

function isoWeekFromDate(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

// Default = previous full ISO week. Matches BE getWeekly()'s default.
export function previousWeekStr(now: Date = new Date()): string {
  const seven = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { year, week } = isoWeekFromDate(seven);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// Sprint 67 D4 — current ISO week as YYYY-Www.
export function currentWeekStr(now: Date = new Date()): string {
  const { year, week } = isoWeekFromDate(now);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// Sprint 67 D4 — day-based default for weekly: when the user is in the back
// half of the week (Fri/Sat/Sun, ISO day 5-7) we assume they want a "this
// week so far" recap; otherwise the previous full week.
export function defaultWeekStr(now: Date = new Date()): string {
  const isoDay = now.getDay() === 0 ? 7 : now.getDay(); // Sun=7
  return isoDay >= 5 ? currentWeekStr(now) : previousWeekStr(now);
}

// Sprint 67 D4 — week before the given YYYY-Www string, used by the empty-
// fallback retry. Walks back via raw 7-day arithmetic so ISO year boundaries
// resolve through `isoWeekFromDate`.
export function offsetWeekStr(weekStr: string, deltaWeeks: number): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekStr);
  if (!m) return weekStr;
  const year = Number(m[1]);
  const week = Number(m[2]);
  // Anchor on Thursday of the given ISO week (ISO 8601 anchor day) so we
  // round-trip through isoWeekFromDate cleanly across year boundaries.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (jan4Day - 1) * 86_400_000);
  const targetMonday = new Date(
    week1Monday.getTime() + (week - 1 + deltaWeeks) * 7 * 86_400_000,
  );
  const { year: ny, week: nw } = isoWeekFromDate(targetMonday);
  return `${ny}-W${String(nw).padStart(2, '0')}`;
}

// Format a "weekly cover" date range from BE response startDate/endDate
// (`YYYY-MM-DD` strings). Locale-aware short date — "2 - 8 thg 3" / "Mar 2 - 8".
// Falls back to the raw range string when parsing fails.
export function formatWeekRange(
  startISO: string | null | undefined,
  endISO: string | null | undefined,
  locale: 'vi' | 'en',
): string {
  if (!startISO || !endISO) return '';
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  if (locale === 'vi') {
    if (sameMonth) {
      return `${start.getUTCDate()} - ${end.getUTCDate()} thg ${start.getUTCMonth() + 1}`;
    }
    return `${start.getUTCDate()} thg ${start.getUTCMonth() + 1} - ${end.getUTCDate()} thg ${end.getUTCMonth() + 1}`;
  }
  const monthName = (d: Date) =>
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]!;
  if (sameMonth) {
    return `${monthName(start)} ${start.getUTCDate()} - ${end.getUTCDate()}`;
  }
  return `${monthName(start)} ${start.getUTCDate()} - ${monthName(end)} ${end.getUTCDate()}`;
}
