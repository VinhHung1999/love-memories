import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Pencil, Check, X } from 'lucide-react';
import { settingsApi } from '../lib/api';

const SETTING_KEY = 'relationship-start-date';

function calcDiff(startDate: string, now: Date) {
  const start = new Date(startDate);
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return { years, months, days, totalDays };
}

/** Compact inline timer — single row, no card chrome */
export default function RelationshipTimer() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
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

  // ── Editing ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        />
        <button onClick={save} disabled={!editValue || saveMutation.isPending} className="p-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <X className="w-3.5 h-3.5 text-text-light" />
        </button>
      </div>
    );
  }

  // ── No date set ───────────────────────────────────────────────────────
  if (!startDate) {
    return (
      <button
        onClick={() => { setEditValue(''); setEditing(true); }}
        className="flex items-center gap-1.5 text-xs text-primary/50 hover:text-primary transition-colors"
      >
        <Heart className="w-3.5 h-3.5" />
        <span>Thêm ngày quen nhau...</span>
      </button>
    );
  }

  // ── Timer display ─────────────────────────────────────────────────────
  const { years, months, days, totalDays } = calcDiff(startDate, now);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} năm`);
  if (years > 0 || months > 0) parts.push(`${months} tháng`);
  parts.push(`${days} ngày`);

  return (
    <div className="flex items-center gap-1.5">
      <Heart className="w-3.5 h-3.5 text-primary fill-primary flex-shrink-0" />
      <span className="text-sm font-medium text-gray-800">
        {parts.join(' ')} bên nhau
      </span>
      <span className="text-xs text-text-light">· {totalDays.toLocaleString()} ngày</span>
      <button
        onClick={() => { setEditValue(startDate); setEditing(true); }}
        className="ml-0.5 p-0.5 rounded hover:bg-gray-100 text-text-light hover:text-primary transition-colors"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}
