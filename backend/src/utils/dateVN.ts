// Vietnam-timezone (Asia/Ho_Chi_Minh, UTC+7) day-math helpers.
//
// The product runs exclusively for VN couples and the cron jobs are scheduled
// in `Asia/Ho_Chi_Minh`. Using raw UTC `Date.now() / msPerDay` for the
// daily-question dayNumber meant the 0AM VN cron (UTC 17:00 prev day) computed
// `yesterdayNumber = currentUTCDay - 1`, which pointed at the *day before*
// the question users actually saw on their VN-yesterday — bothAnswered was
// always false → streak reset every night.
//
// VN has no DST, so a fixed +7h offset is sufficient. If we ever need
// non-VN couples, swap to `Intl.DateTimeFormat` with the requested zone.

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const VN_OFFSET_MS = 7 * MS_PER_HOUR;

// Days since the Unix epoch in the VN calendar. Same UTC instant maps to a
// different integer once it crosses VN midnight (UTC 17:00 prev day).
export function dayNumberVN(date: Date = new Date()): number {
  return Math.floor((date.getTime() + VN_OFFSET_MS) / MS_PER_DAY);
}

// 'YYYY-MM-DD' for the VN calendar day containing `date`.
export function toLocalIso(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + VN_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// UTC instant of VN midnight on `iso` ('YYYY-MM-DD'). Throws on bad input
// rather than producing a silent NaN Date.
export function parseLocalIso(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`parseLocalIso: invalid YYYY-MM-DD '${iso}'`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo - 1, d) - VN_OFFSET_MS);
}

// UTC instant of VN midnight today (or VN midnight of the day containing
// `date`). Convenience for streak comparisons.
export function startOfDayVN(date: Date = new Date()): Date {
  return parseLocalIso(toLocalIso(date));
}
