import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface ProfileData {
  username: string; role: string; createdAt: number; hasDevice: boolean;
  fridgeModel: string; fridgeCapacityLiters: number | null;
  householdSize: number | null; dietaryPreferences: string[];
  dailyCalorieGoal: number | null;
}

export function useProfile(token: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const refetch = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try { const r = await fetch(`${BASE}/api/auth?action=profile`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setProfile(await r.json()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refetch();
  }, [token, refetch]);

  const updateFridgeInfo = useCallback(async (updates: Partial<Pick<ProfileData, 'fridgeModel' | 'fridgeCapacityLiters' | 'householdSize' | 'dietaryPreferences' | 'dailyCalorieGoal'>>) => {
    if (!token) return false;
    try {
      const r = await fetch(`${BASE}/api/auth?action=profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subaction: 'updateFridgeInfo', ...updates }) });
      if (r.ok) { await refetch(); return true; }
      return false;
    } catch { return false; }
  }, [token, refetch]);

  return { profile, loading, updateFridgeInfo, refetch };
}