// T421 (Sprint 65) — short relative-time formatter for Letters list rows.
// Keeps Vietnamese first ("hôm qua" / "{n} ngày trước") and an English fallback.
// Intl.RelativeTimeFormat would give us this but emits machine-y phrases like
// "1 ngày trước" and lacks "hôm qua". A 30-line bespoke formatter matches the
// prototype voice (`ago: { vi: '4 ngày trước', en: '4 days ago' }`).

export function relativeAgo(iso: string, locale: string): string {
  const isVi = locale.startsWith('vi');
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60_000);
  const hour = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);

  if (isVi) {
    if (min < 1) return 'vừa xong';
    if (min < 60) return `${min} phút trước`;
    if (hour < 24) return `${hour} giờ trước`;
    if (day === 1) return 'hôm qua';
    if (day < 7) return `${day} ngày trước`;
    if (day < 30) return `${Math.floor(day / 7)} tuần trước`;
    if (day < 365) return `${Math.floor(day / 30)} tháng trước`;
    return `${Math.floor(day / 365)} năm trước`;
  }

  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hour < 24) return `${hour}h ago`;
  if (day === 1) return 'yesterday';
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  if (day < 365) return `${Math.floor(day / 30)}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

// Schedule-time formatter: "14/11/2026" (vi) / "Nov 14, 2026" (en).
const VI_MONTHS_NUMERIC = (m: number) => `${m + 1}`;

const EN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatScheduleDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const isVi = locale.startsWith('vi');
  if (isVi) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = VI_MONTHS_NUMERIC(d.getMonth()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  return `${EN_MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
