import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export function usePreferences(token: string, username: string) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const loadedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!username) { setRatings({}); return; }
    if (loadedForUser.current === username) return;
    loadedForUser.current = username;
    setRatings({});
    if (!token) return;
    fetch(`${BASE}/api/user-data?resource=preferences`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d.ratings) setRatings(d.ratings); })
      .catch(() => { /* ignore */ });
  }, [username, token]);

  const rateRecipe = useCallback((recipeId: string, stars: number) => {
    setRatings(prev => ({ ...prev, [recipeId]: stars }));
    if (token) {
      fetch(`${BASE}/api/user-data?resource=preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'rate', recipeId, stars }),
      }).catch(() => { /* ignore */ });
    }
  }, [token]);

  return { ratings, rateRecipe };
}