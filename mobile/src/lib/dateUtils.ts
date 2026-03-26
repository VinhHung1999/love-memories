/**
 * Parse an ISO date string (YYYY-MM-DD or full ISO) into a local-timezone Date.
 * Avoids the UTC-midnight → local-day-shift that `new Date(isoString)` causes.
 */
export function parseLocalDate(isoString: string): Date {
  const datePart = isoString.slice(0, 10); // 'YYYY-MM-DD'
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format an ISO date string for display using local timezone.
 */
export function formatLocalDate(
  isoString: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
  locale = 'en-US',
): string {
  return parseLocalDate(isoString).toLocaleDateString(locale, options);
}
