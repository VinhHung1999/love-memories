import { useState, useEffect } from 'react';
import { Heart, Pencil, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const LS_KEY = 'love-scrum-start-date';

function calcDiff(startDate: string, now: Date) {
  const start = new Date(startDate);
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonthEnd.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  const totalDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return { years, months, days, totalDays };
}

export default function RelationshipTimer() {
  const [startDate, setStartDate] = useState<string>(() => localStorage.getItem(LS_KEY) ?? '');
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const save = () => {
    if (!editValue) return;
    localStorage.setItem(LS_KEY, editValue);
    setStartDate(editValue);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (!startDate && !editing) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => { setEditValue(''); setEditing(true); }}
        className="w-full bg-white border-2 border-dashed border-primary/30 rounded-2xl p-5 flex items-center gap-3 text-primary/60 hover:border-primary/60 hover:text-primary transition-colors mb-8"
      >
        <Heart className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">Thêm ngày bắt đầu quen nhau...</span>
      </motion.button>
    );
  }

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 shadow-sm mb-8 flex items-center gap-3"
      >
        <Heart className="w-5 h-5 text-primary fill-primary flex-shrink-0" />
        <span className="text-sm font-medium text-text-light flex-shrink-0">Ngày quen nhau:</span>
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        />
        <button onClick={save} disabled={!editValue} className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={cancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-text-light" />
        </button>
      </motion.div>
    );
  }

  const { years, months, days, totalDays } = calcDiff(startDate, now);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 rounded-2xl p-5 shadow-sm mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <Heart className="w-5 h-5 text-primary fill-primary" />
          </motion.div>
          <span className="font-heading text-base font-semibold">Ngày quen nhau</span>
        </div>
        <button
          onClick={() => { setEditValue(startDate); setEditing(true); }}
          className="p-1.5 rounded-lg hover:bg-black/5 text-text-light hover:text-primary transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-end gap-4 justify-center py-1">
        {years > 0 && (
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{years}</p>
            <p className="text-xs text-text-light mt-0.5">năm</p>
          </div>
        )}
        {(years > 0 || months > 0) && (
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary">{months}</p>
            <p className="text-xs text-text-light mt-0.5">tháng</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-3xl font-bold text-accent">{days}</p>
          <p className="text-xs text-text-light mt-0.5">ngày</p>
        </div>
      </div>

      <p className="text-center text-xs text-text-light mt-3">
        {totalDays.toLocaleString()} ngày bên nhau 💕
      </p>
    </motion.div>
  );
}
