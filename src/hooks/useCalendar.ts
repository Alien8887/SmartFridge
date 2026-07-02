import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface DayMeals { breakfast: string | null; lunch: string | null; dinner: string | null; }
export type CalendarData = Record<string, DayMeals>;
export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

function isCalendarData(value: unknown): value is CalendarData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
    fetch(`${BASE}/api/user-data?resource=calendar`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : ({} as unknown))
      .then((d: unknown) => setCalendar(isCalendarData(d) ? d : {}))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, [username, token]);

  const setMeal = useCallback((date: string, meal: MealSlot, recipeId: string | null) => {
    setCalendar(prev => {
      const day = prev[date] || { breakfast: null, lunch: null, dinner: null };
      return { ...prev, [date]: { ...day, [meal]: recipeId } };
    });
    if (token) {
      fetch(`${BASE}/api/user-data?resource=calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, meal, recipeId }),
      }).catch(() => { /* ignore */ });
    }
  }, [token]);

  return { calendar, loading, setMeal };
}