import { useState, useEffect, useRef } from 'react';

interface MilestoneLike { threshold: number; }

export function useConfettiOnMilestone(currentValue: number, milestones: MilestoneLike[]): boolean {
  const prevRef = useRef(currentValue);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const crossed = milestones.some(m => prevRef.current < m.threshold && currentValue >= m.threshold);
    prevRef.current = currentValue;
    if (!crossed) return;
    setBurst(true);
    const t = setTimeout(() => setBurst(false), 1600);
    return () => clearTimeout(t);
  }, [currentValue, milestones]);

  return burst;
}