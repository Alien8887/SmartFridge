import React, { useState, useEffect, useCallback } from 'react';
import { UserCircle, ShieldCheck, KeyRound, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DeviceConnectCard } from '../../components/ui/DeviceConnectCard';
import { Theme } from '../../types';

const BASE = process.env.REACT_APP_API_URL || '';

interface ProfileViewProps { token: string; username: string; darkMode: boolean; theme: Theme; }
interface ProfileData { username: string; role: string; createdAt: number; hasDevice: boolean; }

export function ProfileView({ token, username, darkMode, theme }: ProfileViewProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { const r = await fetch(`${BASE}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setProfile(await r.json()); } catch { /* ignore */ } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null); setPwSuccess(false);
    if (newPw.length < 4) { setPwError('New password must be at least 4 characters'); return; }
    if (newPw !== confirmPw) { setPwError('New password and confirmation do not match'); return; }
    setPwLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'changePassword', currentPassword: currentPw, newPassword: newPw }),
      });
      const d = await r.json();
      if (!r.ok) { setPwError(d.error || 'Failed to change password'); return; }
      setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { setPwError('Network error'); } finally { setPwLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-sky-400" /></div>;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${theme.text}`}>{username}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
              profile?.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : profile?.role === 'guest' ? 'bg-slate-500/20 text-slate-400' : 'bg-sky-500/20 text-sky-400'
            }`}>
              <ShieldCheck className="w-3 h-3 inline mr-1" />{profile?.role ?? 'user'}
            </span>
            {profile?.createdAt && <span className={`text-xs flex items-center gap-1 ${theme.textMuted}`}><Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      <DeviceConnectCard token={token} darkMode={darkMode} theme={theme} />

      <Card className={theme.card}>
        <h3 className={`font-semibold ${theme.text} mb-1 flex items-center gap-2`}><KeyRound className="w-5 h-5 text-sky-400" /> Change password</h3>
        <p className={`text-sm ${theme.textMuted} mb-4`}>Update the password used to sign in to this account.</p>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <Input type="password" label="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} isDark={darkMode} autoComplete="current-password" />
          <Input type="password" label="New password" value={newPw} onChange={e => setNewPw(e.target.value)} isDark={darkMode} autoComplete="new-password" />
          <Input type="password" label="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} isDark={darkMode} autoComplete="new-password" />
          {pwError && <p className="text-xs text-red-400">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Password updated.</p>}
          <Button type="submit" variant="primary" loading={pwLoading}>Update password</Button>
        </form>
      </Card>
    </div>
  );
}