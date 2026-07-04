import { useState, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface AdminUserSummary { username: string; role: string; createdAt: number | null; hasDevice: boolean; fridgeModel: string; householdSize: number | null; }

export function useAdmin(token: string) {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/api/auth?action=admin-users`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to load users'); return; }
      setUsers(d.users || []);
      setLoaded(true);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, [token]);

  return { users, loading, error, loaded, fetchUsers };
}