import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { datePlansApi } from '../../../lib/api';
import type { DatePlan } from '../../../types';

export interface StopDraft {
  time: string;
  title: string;
  notes: string;
}

export function usePlanFormViewModel(onClose: () => void, initialPlan?: DatePlan) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialPlan?.title ?? '');
  const [date, setDate] = useState(initialPlan?.date?.slice(0, 10) ?? '');
  const [notes, setNotes] = useState(initialPlan?.notes ?? '');
  const [stops, setStops] = useState<StopDraft[]>(
    initialPlan?.stops?.map(s => ({ time: s.time, title: s.title, notes: s.notes ?? '' })) ?? [
      { time: '', title: '', notes: '' },
    ],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = title.trim().length > 0 && date.trim().length > 0;

  const addStop = () => setStops(prev => [...prev, { time: '', title: '', notes: '' }]);
  const removeStop = (idx: number) => setStops(prev => prev.filter((_, i) => i !== idx));
  const updateStop = (idx: number, field: keyof StopDraft, value: string) => {
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const save = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setError(null);
    try {
      const validStops = stops
        .filter(s => s.title.trim())
        .map((s, i) => ({ time: s.time, title: s.title.trim(), notes: s.notes.trim() || undefined, order: i }));
      const data = {
        title: title.trim(),
        date,
        notes: notes.trim() || undefined,
        stops: validStops,
      };
      if (initialPlan) {
        await datePlansApi.update(initialPlan.id, data);
      } else {
        await datePlansApi.create(data);
      }
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      onClose();
    } catch {
      setError('Failed to save plan');
    }
    setIsSaving(false);
  };

  return {
    title, setTitle,
    date, setDate,
    notes, setNotes,
    stops,
    addStop, removeStop, updateStop,
    isValid,
    isSaving,
    error,
    save,
  };
}
