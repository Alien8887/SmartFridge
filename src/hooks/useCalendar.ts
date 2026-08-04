import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface DayMeals { breakfast: string | null; lunch: string | null; dinner: string | null; }
export type CalendarData = Record<string, DayMeals>;
export type MealSlot = 'breakfast' | 'lunch' | 'dinner';
export interface CalendarUpdate { date: string; meal: MealSlot; recipeId: string | null; }

export function useCalendar(token: string, username: string) {
  const [calendar, setCalendar] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const loadedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!username) { setCalendar({}); setLoading(false); return; }
    if (loadedForUser.current === username) return;
    loadedForUser.current = username;
    if (!token) { setLoading(false); return; }
    setLoading(true);

    // async/await with an explicit `unknown` annotation, rather than a
    // chained .then(r => r.ok ? r.json() : {}) — mixing a Promise<any>
    // branch with a plain {} literal in a ternary is a known TS inference
    // trap that can silently narrow the resolved type down to bare
    // `object` instead of `any`, which is exactly what broke the build.
    (async () => {
      try {
        const r = await fetch(`${BASE}/api/user-data?resource=calendar`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) { setCalendar({}); return; }
        const d: unknown = await r.json();
        setCalendar(d && typeof d === 'object' ? (d as CalendarData) : {});
      } catch {
        /* ignore — keep whatever was already loaded */
      } finally {
        setLoading(false);
      }
    })();
  }, [username, token]);

  /** Single-slot update — fine for one-at-a-time clicks since there's no
   *  concurrency risk with only one request in flight. */
  const setMeal = useCallback((date: string, meal: MealSlot, recipeId: string | null) => {
    setCalendar(prev => {
      const day = prev[date] || { breakfast: null, lunch: null, dinner: null };
      return { ...prev, [date]: { ...day, [meal]: recipeId } };
    });
    if (token) {
      fetch(`${BASE}/api/user-data?resource=calendar`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ date, meal, recipeId }) }).catch(() => { /* ignore */ });
    }
  }, [token]);

  /** Batch update — Fill Week, Clear Week, and Copy Day use this. One
   *  request, one server-side read-modify-write, no race condition. */
  const setMeals = useCallback((updates: CalendarUpdate[]) => {
    if (updates.length === 0) return;
    setCalendar(prev => {
      const next = { ...prev };
      for (const u of updates) {
        const day = next[u.date] || { breakfast: null, lunch: null, dinner: null };
        next[u.date] = { ...day, [u.meal]: u.recipeId };
      }
      return next;
    });
    if (token) {
      fetch(`${BASE}/api/user-data?resource=calendar-batch`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ updates }) }).catch(() => { /* ignore */ });
    }
  }, [token]);

  return { calendar, loading, setMeal, setMeals };
}