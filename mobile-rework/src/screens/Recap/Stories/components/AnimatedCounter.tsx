// Sprint 67 T459 — Count-up animated number for stat slides. Uses the
// same setInterval ramp as frontend MonthlyRecapPage (memory): 30 steps
// × 50ms = 1.5s. Resets when `value` changes.
//
// Renders the literal `display` string when the caller passes a
// pre-formatted token like '2.1k' (no animation, just static text).

import { useEffect, useState } from 'react';
import { Text } from 'react-native';

type Props = {
  value: number | string;
  className?: string;
};

const STEPS = 30;
const STEP_MS = 50;

export function AnimatedCounter({ value, className }: Props) {
  const [display, setDisplay] = useState<number | string>(
    typeof value === 'number' ? 0 : value,
  );

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let cancelled = false;
    let step = 0;
    const interval = setInterval(() => {
      if (cancelled) return;
      step += 1;
      const fraction = Math.min(1, step / STEPS);
      const eased = 1 - Math.pow(1 - fraction, 3); // ease-out cubic
      setDisplay(Math.round(value * eased));
      if (step >= STEPS) {
        clearInterval(interval);
        setDisplay(value);
      }
    }, STEP_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [value]);

  return <Text className={className}>{display}</Text>;
}
