import { useState, useEffect, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || '';

export interface AuthUser {
  username: string;
  role:     string;
  token:    string;
}

export function useAuth() {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sf-token');
    if (!stored) { setLoading(false); return; }
    fetch(`${BASE}/api/auth/verify`, { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.json())
      .then(d => {
        if (d.valid) setUser({ username: d.username, role: d.role, token: stored });
        else         localStorage.removeItem('sf-token');
      })
      .catch(() => localStorage.removeItem('sf-token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Login failed'); return false; }
      localStorage.setItem('sf-token', d.token);
      setUser({ username: d.username, role: d.role, token: d.token });
      return true;
    } catch {
      setError('Network error — check connection');
      return false;
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const r = await fetch(`${BASE}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Registration failed'); return false; }
      return true;
    } catch { setError('Network error'); return false; }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('sf-token');
    if (token) {
      try {
        await fetch(`${BASE}/api/auth/logout`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* ignore */ }
    }
    localStorage.removeItem('sf-token');
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem('sf-token') || '', []);

  return { user, loading, error, setError, login, register, logout, getToken };
}