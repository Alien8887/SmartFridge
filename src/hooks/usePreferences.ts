import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export function usePreferences(token: string) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!token || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`${BASE}/api/preferences-db`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d.ratings) setRatings(d.ratings); })
      .catch(() => { /* ignore */ });
  }, [token]);

  const rateRecipe = useCallback((recipeId: string, stars: number) => {
    setRatings(prev => ({ ...prev, [recipeId]: stars }));
    if (token) {
      fetch(`${BASE}/api/preferences-db`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'rate', recipeId, stars }) }).catch(() => {});
    }
  }, [token]);

  return { ratings, rateRecipe };
}