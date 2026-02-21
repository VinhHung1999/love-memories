import { useState, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Pencil, Check, X } from 'lucide-react';
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

/** Hero visual timer — large numbers, gradient bg, edit via pencil */
export default function RelationshipTimer({ footer }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(t);
  }, []);

  const { data } = useQuery({
    queryKey: ['settings', SETTING_KEY],
    queryFn: () => settingsApi.get(SETTING_KEY),
  });

  const saveMutation = useMutation({
    mutationFn: (value: string) => settingsApi.set(SETTING_KEY, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', SETTING_KEY] });
      setEditing(false);
    },
  });

  const startDate = data?.value ?? '';

  const save = () => {
    if (!editValue) return;
    saveMutation.mutate(editValue);
  };

  const cancel = () => setEditing(false);

  // ── Editing state (inline within hero card) ───────────────────────────
  if (editing) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-6 py-5">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <Heart className="w-4 h-4 text-primary fill-primary" />
          <span className="text-xs font-medium text-text-light tracking-widest uppercase">Bên nhau từ</span>
        </div>
        <div className="flex items-center gap-2 max-w-xs mx-auto">
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white/70"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          />
          <button
            onClick={save}
            disabled={!editValue || saveMutation.isPending}
            className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={cancel}
            className="p-2 rounded-xl hover:bg-white/60 text-text-light hover:text-text transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── No date set ───────────────────────────────────────────────────────
  if (!startDate) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-6 py-8 flex flex-col items-center gap-2">
        <button
          onClick={() => { setEditValue(''); setEditing(true); }}
          className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <Heart className="w-6 h-6 text-primary/40" />
          <span className="text-sm text-primary/60 font-medium">Thêm ngày quen nhau...</span>
        </button>
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
    <div className="relative group rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 px-6 py-5 overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-primary/5 pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-secondary/5 pointer-events-none" />

      {/* Edit button — always visible on mobile, hover-reveal on desktop */}
      <button
        onClick={() => { setEditValue(startDate); setEditing(true); }}
        className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/60 text-text-light hover:text-primary transition-colors md:opacity-0 md:group-hover:opacity-100"
        aria-label="Edit start date"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

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
