import { useState, useEffect } from 'react';
import { ConsumptionData } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function makeInitial(): ConsumptionData[] {
  return DAYS.map(day => ({ day, dairy: 0, meat: 0, vegetables: 0, fruits: 0 }));
}

function loadNumber(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? '0') || 0; }
  catch { return 0; }
}

export function useConsumption() {
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionData[]>(makeInitial);
  const [totalConsumed, setTotalConsumed] = useState<number>(() => loadNumber('sf-total-consumed'));
  const [totalWasted, setTotalWasted] = useState<number>(() => loadNumber('sf-total-wasted'));

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sf-consumption');
      if (saved) setConsumptionHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const logItem = (category: string, action: 'consume' | 'waste') => {
    if (action === 'waste') {
      setTotalWasted(prev => {
        const next = prev + 1;
        try { localStorage.setItem('sf-total-wasted', String(next)); } catch {}
        return next;
      });
      return;
    }

    // consume: add to chart
    const todayName = DAYS[new Date().getDay()];
    setConsumptionHistory(prev => {
      const updated = prev.map(row => {
        if (row.day !== todayName) return row;
        const key = category.toLowerCase() as keyof ConsumptionData;
        if (key === 'day' || !(key in row)) return row;
        return { ...row, [key]: (row[key] as number) + 1 };
      });
      try { localStorage.setItem('sf-consumption', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setTotalConsumed(prev => {
      const next = prev + 1;
      try { localStorage.setItem('sf-total-consumed', String(next)); } catch {}
      return next;
    });
  };

  return { consumptionHistory, logItem, totalConsumed, totalWasted };
}