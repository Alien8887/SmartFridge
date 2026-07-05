import { useState, useEffect, useCallback, useRef } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface ProfileData {
  username: string; role: string; createdAt: number; hasDevice: boolean;
  fridgeModel: string; fridgeCapacityLiters: number | null;
  householdSize: number | null; dietaryPreferences: string[];
  dailyCalorieGoal: number | null; sessionExpiresAt: number;
}

export function useProfile(token: string, username: string) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedForUser = useRef<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try { const r = await fetch(`${BASE}/api/auth?action=profile`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setProfile(await r.json()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!username) { setProfile(null); setLoading(false); return; }
    if (loadedForUser.current === username) return;
    loadedForUser.current = username;
    setProfile(null);
    setLoading(true);
    refetch();
  }, [username, refetch]);

  const updateFridgeInfo = useCallback(async (updates: Partial<Pick<ProfileData, 'fridgeModel' | 'fridgeCapacityLiters' | 'householdSize' | 'dietaryPreferences' | 'dailyCalorieGoal'>>) => {
    if (!token) return false;
    try { const r = await fetch(`${BASE}/api/auth?action=profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subaction: 'updateFridgeInfo', ...updates }) }); if (r.ok) { await refetch(); return true; } return false; } catch { return false; }
  }, [token, refetch]);

  const logoutAllSessions = useCallback(async () => {
    if (!token) return false;
    try { const r = await fetch(`${BASE}/api/auth?action=profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subaction: 'logoutAllSessions' }) }); return r.ok; } catch { return false; }
  }, [token]);

  const deleteAccount = useCallback(async (confirmUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not signed in' };
    try {
      const r = await fetch(`${BASE}/api/auth?action=profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subaction: 'deleteAccount', confirmUsername }) });
      const d = await r.json();
      return r.ok ? { success: true } : { success: false, error: d.error || 'Failed to delete account' };
    } catch { return { success: false, error: 'Network error' }; }
  }, [token]);

  const exportData = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${BASE}/api/auth?action=export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      const d = await r.json();
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `smart-fridge-export-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [token]);

  return { profile, loading, updateFridgeInfo, refetch, logoutAllSessions, deleteAccount, exportData };
}