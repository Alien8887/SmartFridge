import { useState, useEffect, useRef } from 'react';
import { Milestone } from '../data/milestones';

export function useConfettiOnMilestone(currentValue: number, milestones: Milestone[]) {
  const prevRef = useRef(currentValue);
  const [burst, setBurst] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<Milestone | null>(null);

  useEffect(() => {
    const crossed = milestones.filter(m => prevRef.current < m.threshold && currentValue >= m.threshold);
    prevRef.current = currentValue;
    if (crossed.length === 0) return;
    setBurst(true);
    setJustUnlocked(crossed[crossed.length - 1]); // celebrate the highest if several crossed at once
    const t = setTimeout(() => setBurst(false), 1600);
    return () => clearTimeout(t);
  }, [currentValue, milestones]);

  return { burst, justUnlocked, clearUnlocked: () => setJustUnlocked(null) };
}