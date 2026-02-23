import { useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { settingsApi } from '../lib/api';

const SETTING_KEY = 'relationship-start-date';

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '1', 10);
  const d = parseInt(parts[2] ?? '1', 10);
  return new Date(y, m - 1, d); // local midnight, not UTC
}

function calcDiff(startDate: string, now: Date) {
  const start = parseLocalDate(startDate);
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  // h/m/s: remainder after subtracting full calendar years+months+days (local time)
  const reference = new Date(start);
  reference.setFullYear(reference.getFullYear() + years);
  reference.setMonth(reference.getMonth() + months);
  reference.setDate(reference.getDate() + days);
  const remainderMs = now.getTime() - reference.getTime();
  const hours = Math.floor(remainderMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainderMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainderMs % (1000 * 60)) / 1000);
  return { years, months, days, totalDays, hours, minutes, seconds };
}

interface Props {
  /** Optional content rendered below the timer inside the same card (e.g. stats row) */
  footer?: ReactNode;
}

/** Hero visual timer — large numbers, gradient bg, display-only */
export default function RelationshipTimer({ footer }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(t);
  }, []);

  const { data } = useQuery({
    queryKey: ['settings', SETTING_KEY],
    queryFn: () => settingsApi.get(SETTING_KEY),
  });

  const startDate = data?.value ?? '';

  // ── No date set ───────────────────────────────────────────────────────
  if (!startDate) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-6 py-8 flex flex-col items-center gap-2">
        <Heart className="w-6 h-6 text-primary/40" />
        <p className="text-sm text-primary/60 font-medium">Chưa cấu hình</p>
        <Link to="/more" className="text-xs text-primary underline">
          Cài đặt ngày yêu nhau
        </Link>
        {footer && (
          <>
            <div className="w-full mt-4 pt-4 border-t border-white/30" />
            {footer}
          </>
        )}
      </div>
    );
  }

  // ── Hero display ──────────────────────────────────────────────────────
  const { years, months, days, totalDays, hours, minutes, seconds } = calcDiff(startDate, now);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-6 py-5 overflow-hidden relative">
      {/* Subtle decorative circles */}
      <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-primary/5 pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-secondary/5 pointer-events-none" />

      {/* Header label */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        <Heart className="w-4 h-4 text-primary fill-primary" />
        <span className="text-xs font-medium text-text-light tracking-widest uppercase">Bên nhau</span>
      </div>

      {/* Single flex row: năm · tháng · ngày · giờ · phút · giây */}
      <div className="flex items-end justify-center flex-wrap gap-x-3 gap-y-2 md:gap-x-5">
        {[
          ...(years > 0 ? [{ value: years,   label: 'năm',  mono: false }] : []),
          ...((years > 0 || months > 0) ? [{ value: months, label: 'tháng', mono: false }] : []),
          { value: days,    label: 'ngày', mono: false },
          { value: hours,   label: 'giờ',  mono: true  },
          { value: minutes, label: 'phút', mono: true  },
          { value: seconds, label: 'giây', mono: true  },
        ].map(({ value, label, mono }, i) => (
          <div key={label} className="flex items-end gap-x-3 md:gap-x-5">
            {i > 0 && <span className="text-2xl text-text-light/40 mb-4">·</span>}
            <div className="text-center">
              <p className={`font-heading font-bold text-text leading-none${mono ? ' text-3xl md:text-4xl tabular-nums text-text/70' : ' text-5xl md:text-6xl'}`}>
                {mono ? String(value).padStart(2, '0') : value}
              </p>
              <p className="text-xs text-text-light mt-1.5 tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total days */}
      <p className="text-center text-xs text-text-light mt-3">
        {totalDays.toLocaleString()} ngày · mãi yêu nhau
      </p>

      {/* Footer slot — stats row lives here */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-black/5">
          {footer}
        </div>
      )}
    </div>
  );
}
