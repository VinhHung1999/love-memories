import { useEffect, useMemo, useState } from 'react';

// T415 (Sprint 64) — Dashboard Timer Hero realtime counter.
// Ported 1:1 from docs/design/prototype/memoura-v2/dashboard.jsx useRelationshipTime
// (rough calendar math: 365.25 days/year, 30.44 days/month — matches the prototype
// so day/month/year breakdown lines up with what the Boss saw in JSX review).
//
// Tick cadence: 1s setInterval in an effect keyed on [] — one timer per mounted
// hook instance. Anniversary is passed as a Date; we normalize to epoch ms so the
// inner math memoizes on a scalar instead of an object identity (callers that
// construct a fresh Date each render won't thrash the memo).

const FALLBACK_ANNIV_ISO = '2022-11-14T00:00:00';

export type RelationshipTime = {
  y: number;
  m: number;
  d: number;
  h: number;
  min: number;
  s: number;
  totalDays: number;
  daysToAnniv: number;
};

export function useRelationshipTime(anniversary: Date | null): RelationshipTime {
  const annivMs = (anniversary ?? new Date(FALLBACK_ANNIV_ISO)).getTime();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const ms = Math.max(0, nowMs - annivMs);
    const s = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000) % 24;
    const totalDays = Math.floor(ms / 86400000);
    const y = Math.floor(totalDays / 365.25);
    const dAfterY = totalDays - Math.floor(y * 365.25);
    const mo = Math.floor(dAfterY / 30.44);
    const d = Math.floor(dAfterY - mo * 30.44);

    const anniv = new Date(annivMs);
    const nowDate = new Date(nowMs);
    const next = new Date(nowDate.getFullYear(), anniv.getMonth(), anniv.getDate());
    if (next.getTime() < nowDate.getTime()) {
      next.setFullYear(nowDate.getFullYear() + 1);
    }
    const daysToAnniv = Math.max(
      0,
      Math.ceil((next.getTime() - nowDate.getTime()) / 86400000),
    );

    return { y, m: mo, d, h, min, s, totalDays, daysToAnniv };
  }, [nowMs, annivMs]);
}

export const FALLBACK_ANNIVERSARY_ISO = FALLBACK_ANNIV_ISO;
