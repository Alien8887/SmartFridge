import { useState, useEffect, useRef } from 'react';
import { Milestone } from '../data/milestones';

export function useConfettiOnMilestone(currentValue: number, milestones: Milestone[], loading: boolean, username: string) {
  const prevRef = useRef(currentValue);
  const armedForUserRef = useRef<string | null>(null);
  const [burst, setBurst] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!username || loading) {
      // Not ready to compare — and if the username itself changed (account
      // switch, or logout), drop any stale baseline immediately so a
      // slow-arriving "loading finished" render can't compare against a
      // PREVIOUS account's leftover value.
      if (armedForUserRef.current !== username) armedForUserRef.current = null;
      return;
    }
    if (armedForUserRef.current !== username) {
      // First fully-settled value for THIS specific account — this is the
      // baseline, not a crossing. Keying by the actual username string
      // (not a bare boolean) is what makes this immune to the effect
      // re-firing more than once with the same settled values.
      armedForUserRef.current = username;
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
  }, [currentValue, loading, username, milestones]);

  return { burst, justUnlocked, clearUnlocked: () => setJustUnlocked(null) };
}