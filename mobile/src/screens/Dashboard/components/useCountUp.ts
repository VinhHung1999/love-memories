import { useEffect, useState } from 'react';

export function useCountUp(target: number, durationMs = 900): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const steps = 36;
    const stepMs = durationMs / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.round((step / steps) * target));
      if (step >= steps) clearInterval(timer);
    }, stepMs);
    return () => clearInterval(timer);
  }, [target, durationMs]);
  return count;
}
