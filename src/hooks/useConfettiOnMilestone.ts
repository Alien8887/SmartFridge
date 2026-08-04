import { useState, useEffect, useRef } from 'react';
import { Milestone } from '../data/milestones';

export function useConfettiOnMilestone(currentValue: number, milestones: Milestone[], loading: boolean) {
  const prevRef = useRef(currentValue);
  const armedRef = useRef(false);
  const [burst, setBurst] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<Milestone | null>(null);

  useEffect(() => {
    if (loading) {
      // A fresh load cycle just started (mount, or switching accounts) —
      // disarm so the NEXT settle establishes a clean baseline instead of
      // comparing across two different loading states.
      armedRef.current = false;
      return;
    }
    if (!armedRef.current) {
      // First settled value we see — this is the baseline, not a crossing.
      armedRef.current = true;
      prevRef.current = currentValue;
      return;
    }
    const crossed = milestones.filter(m => prevRef.current < m.threshold && currentValue >= m.threshold);
    prevRef.current = currentValue;
    if (crossed.length === 0) return;
    setBurst(true);
    setJustUnlocked(crossed[crossed.length - 1]);
    const t = setTimeout(() => setBurst(false), 1600);
    return () => clearTimeout(t);
  }, [currentValue, loading, milestones]);

  return { burst, justUnlocked, clearUnlocked: () => setJustUnlocked(null) };
}