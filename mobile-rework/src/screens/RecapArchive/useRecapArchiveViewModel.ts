// Sprint 67 T458 — RecapArchive ViewModel.
//
// Builds two lists client-side: past 12 months + past 12 ISO weeks ending
// at the current period. No BE list endpoint needed — every recap row is
// just a YYYY-MM / YYYY-Www slug; the existing /api/recap/{monthly,weekly}
// fetches the actual data when the user taps in.
//
// Client-side compute matches the BE date math (`isoWeekFromDate` mirrors
// `RecapService.getISOWeek`). 12 entries fit comfortably without pagination
// — spec note about "lazy infinite-scroll if data > 12" is reserved for a
// future backlog item once the user has > 12 of recorded history.

import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { describeMonth, formatWeekRange } from '@/screens/Recap/utils';

const ARCHIVE_LIMIT = 12;

export type ArchiveMonthEntry = {
  monthStr: string;       // YYYY-MM
  title: string;          // 'Tháng 4' / 'April'
  sub: string;            // '2026'
};

export type ArchiveWeekEntry = {
  weekStr: string;        // YYYY-Www
  title: string;          // 'Tuần 17'
  sub: string;            // '21 - 27 thg 4'
};

export type RecapArchiveViewModel = {
  monthsTitle: string;
  weeksTitle: string;
  introBody: string;
  months: ArchiveMonthEntry[];
  weeks: ArchiveWeekEntry[];
  onOpenMonth: (monthStr: string) => void;
  onOpenWeek: (weekStr: string) => void;
};

function isoWeekFromDate(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

// Monday + Sunday UTC of an ISO week — mirror of BE weekToRange().
function isoWeekRange(year: number, week: number): { startISO: string; endISO: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    startISO: monday.toISOString().split('T')[0]!,
    endISO: sunday.toISOString().split('T')[0]!,
  };
}

function buildMonths(now: Date, limit: number, isVi: boolean): ArchiveMonthEntry[] {
  const out: ArchiveMonthEntry[] = [];
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based
  for (let i = 0; i < limit; i++) {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const md = describeMonth(monthStr);
    out.push({
      monthStr,
      title: isVi ? md.monthNameVi : md.monthNameEn,
      sub: String(md.year),
    });
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return out;
}

function buildWeeks(
  now: Date,
  limit: number,
  isVi: boolean,
  weekLabel: (n: number) => string,
): ArchiveWeekEntry[] {
  const out: ArchiveWeekEntry[] = [];
  for (let i = 0; i < limit; i++) {
    const cursor = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const { year, week } = isoWeekFromDate(cursor);
    const weekStr = `${year}-W${String(week).padStart(2, '0')}`;
    const range = isoWeekRange(year, week);
    out.push({
      weekStr,
      title: weekLabel(week),
      sub: formatWeekRange(range.startISO, range.endISO, isVi ? 'vi' : 'en'),
    });
  }
  // Dedupe — `Date - 7d` near month/year boundaries can occasionally repeat
  // an ISO week. Filter by weekStr keeping first occurrence.
  const seen = new Set<string>();
  return out.filter((w) => {
    if (seen.has(w.weekStr)) return false;
    seen.add(w.weekStr);
    return true;
  });
}

export function useRecapArchiveViewModel(): RecapArchiveViewModel {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isVi = i18n.language?.toLowerCase().startsWith('vi') ?? true;

  const months = useMemo(
    () => buildMonths(new Date(), ARCHIVE_LIMIT, isVi),
    [isVi],
  );
  const weeks = useMemo(
    () =>
      buildWeeks(new Date(), ARCHIVE_LIMIT, isVi, (n) =>
        t('recapArchive.weekLabel', { n }),
      ),
    [isVi, t],
  );

  const onOpenMonth = useCallback(
    (monthStr: string) => {
      router.push({
        pathname: '/(modal)/recap/monthly',
        params: { month: monthStr },
      });
    },
    [router],
  );

  const onOpenWeek = useCallback(
    (weekStr: string) => {
      router.push({
        pathname: '/(modal)/recap/weekly',
        params: { week: weekStr },
      });
    },
    [router],
  );

  return {
    monthsTitle: t('recapArchive.monthsTitle'),
    weeksTitle: t('recapArchive.weeksTitle'),
    introBody: t('recapArchive.introBody'),
    months,
    weeks,
    onOpenMonth,
    onOpenWeek,
  };
}
