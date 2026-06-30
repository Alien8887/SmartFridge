import { useState, useEffect, useCallback, useRef } from 'react';
import { ConsumptionData } from '../types';

const BASE = process.env.REACT_APP_API_URL || '';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function makeInitial(): ConsumptionData[] { return DAYS.map(day => ({ day, dairy: 0, meat: 0, vegetables: 0, fruits: 0 })); }
function loadLocalWeek(): ConsumptionData[] {
  try { const raw = localStorage.getItem('sf-consumption'); return raw ? JSON.parse(raw) : makeInitial(); } catch { return makeInitial(); }
}
function loadLocalNumber(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? '0', 10) || 0; } catch { return 0; }
}

export function useConsumption(token: string) {
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionData[]>(loadLocalWeek);
  const [totalConsumed, setTotalConsumed] = useState(() => loadLocalNumber('sf-total-consumed'));
  const [totalWasted,   setTotalWasted]   = useState(() => loadLocalNumber('sf-total-wasted'));
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!token || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`${BASE}/api/consumption-db`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (d.week) setConsumptionHistory(d.week);
        if (typeof d.totalConsumed === 'number') setTotalConsumed(d.totalConsumed);
        if (typeof d.totalWasted === 'number') setTotalWasted(d.totalWasted);
      })
      .catch(() => { /* keep local cache */ });
  }, [token]);

  const logItem = useCallback((category: string, action: 'consume' | 'waste') => {
    if (action === 'waste') {
      setTotalWasted(prev => { const next = prev + 1; try { localStorage.setItem('sf-total-wasted', String(next)); } catch {} return next; });
    } else {
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
      setTotalConsumed(prev => { const next = prev + 1; try { localStorage.setItem('sf-total-consumed', String(next)); } catch {} return next; });
    }

    if (token) {
      fetch(`${BASE}/api/consumption-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, action }),
      }).catch(() => {});
    }
  }, [token]);

  return { consumptionHistory, logItem, totalConsumed, totalWasted };
}