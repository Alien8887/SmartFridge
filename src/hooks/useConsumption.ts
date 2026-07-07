import { useState, useEffect, useCallback, useRef } from 'react';
import { ConsumptionData } from '../types';
import { roundTo } from '../utils/numberUtils';
import { weekKeyFor } from '../utils/dateUtils';

const BASE = process.env.REACT_APP_API_URL || '';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface TopItem { name: string; count: number; }

function makeInitial(): ConsumptionData[] { return DAYS.map(day => ({ day, dairy: 0, meat: 0, vegetables: 0, fruits: 0 })); }
function weekStorageKey(u: string) { return `sf-consumption:${u}`; }
function weekMetaKey(u: string) { return `sf-consumption-week:${u}`; }
function numKey(u: string, k: string) { return `sf-${k}:${u}`; }

function loadLocalWeek(u: string, currentWeekKey: string): ConsumptionData[] {
  if (!u) return makeInitial();
  try {
    const storedWeekKey = localStorage.getItem(weekMetaKey(u));
    if (storedWeekKey !== currentWeekKey) return makeInitial();
    const raw = localStorage.getItem(weekStorageKey(u));
    return raw ? JSON.parse(raw) : makeInitial();
  } catch { return makeInitial(); }
}
function loadLocalNumber(u: string, k: string): number { if (!u) return 0; try { return parseFloat(localStorage.getItem(numKey(u, k)) ?? '0') || 0; } catch { return 0; } }

export function useConsumption(token: string, username: string) {
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionData[]>(() => makeInitial());
  const [totalConsumed, setTotalConsumed] = useState(0);
  const [totalWasted, setTotalWasted] = useState(0);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const loadedForUser = useRef<string | null>(null);
  const currentWeekKeyRef = useRef(weekKeyFor(new Date()));

  // Re-checks the week boundary hourly — a session left open across a week
  // rollover (e.g. open Sunday night into Monday) still resets without
  // needing a page refresh.
  useEffect(() => {
    const id = setInterval(() => {
      const freshKey = weekKeyFor(new Date());
      if (freshKey !== currentWeekKeyRef.current) {
        currentWeekKeyRef.current = freshKey;
        setConsumptionHistory(makeInitial());
        try { localStorage.setItem(weekMetaKey(username), freshKey); localStorage.setItem(weekStorageKey(username), JSON.stringify(makeInitial())); } catch { /* ignore */ }
      }
    }, 3_600_000);
    return () => clearInterval(id);
  }, [username]);

  useEffect(() => {
    if (!username) { setConsumptionHistory(makeInitial()); setTotalConsumed(0); setTotalWasted(0); setTopItems([]); return; }
    if (loadedForUser.current === username) return;
    loadedForUser.current = username;

    const wk = weekKeyFor(new Date());
    currentWeekKeyRef.current = wk;
    setConsumptionHistory(loadLocalWeek(username, wk));
    setTotalConsumed(loadLocalNumber(username, 'total-consumed'));
    setTotalWasted(loadLocalNumber(username, 'total-wasted'));

    if (!token) return;
    fetch(`${BASE}/api/user-data?resource=consumption&weekKey=${wk}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (d.week) setConsumptionHistory(d.week);
        if (typeof d.totalConsumed === 'number') setTotalConsumed(d.totalConsumed);
        if (typeof d.totalWasted === 'number') setTotalWasted(d.totalWasted);
        if (Array.isArray(d.topItems)) setTopItems(d.topItems);
        try { localStorage.setItem(weekMetaKey(username), wk); } catch { /* ignore */ }
      })
      .catch(() => { /* keep local cache */ });
  }, [username, token]);

  const logItem = useCallback((name: string, category: string, action: 'consume' | 'waste', amount = 1) => {
    if (!username) return;
    const amt = amount > 0 ? amount : 0;
    if (amt <= 0) return;
    const wk = currentWeekKeyRef.current;

    if (action === 'waste') {
      setTotalWasted(prev => { const next = roundTo(prev + amt, 3); try { localStorage.setItem(numKey(username, 'total-wasted'), String(next)); } catch {} return next; });
    } else {
      const todayName = DAYS[new Date().getDay()];
      setConsumptionHistory(prev => {
        const updated = prev.map(row => { if (row.day !== todayName) return row; const key = category.toLowerCase() as keyof ConsumptionData; if (key === 'day' || !(key in row)) return row; return { ...row, [key]: (row[key] as number) + 1 }; });
        try { localStorage.setItem(weekStorageKey(username), JSON.stringify(updated)); localStorage.setItem(weekMetaKey(username), wk); } catch {}
        return updated;
      });
      setTotalConsumed(prev => { const next = roundTo(prev + amt, 3); try { localStorage.setItem(numKey(username, 'total-consumed'), String(next)); } catch {} return next; });
    }
    if (token) {
      fetch(`${BASE}/api/user-data?resource=consumption`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, category, action, amount: amt, weekKey: wk }) })
        .then(r => r.ok ? r.json() : null).then(d => { if (d?.topItems) setTopItems(d.topItems); }).catch(() => {});
    }
  }, [token, username]);

  const resetStats = useCallback(async () => {
    setConsumptionHistory(makeInitial()); setTotalConsumed(0); setTotalWasted(0); setTopItems([]);
    try { localStorage.removeItem(weekStorageKey(username)); localStorage.removeItem(weekMetaKey(username)); localStorage.removeItem(numKey(username, 'total-consumed')); localStorage.removeItem(numKey(username, 'total-wasted')); } catch { /* ignore */ }
    if (token) { try { await fetch(`${BASE}/api/user-data?resource=reset`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ target: 'consumption' }) }); } catch { /* local reset already applied */ } }
  }, [username, token]);

  return { consumptionHistory, logItem, totalConsumed, totalWasted, topItems, resetStats };
}