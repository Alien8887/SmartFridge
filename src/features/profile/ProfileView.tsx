import React, { useState, useEffect } from 'react';
import { UserCircle, ShieldCheck, KeyRound, Calendar, Loader2, CheckCircle2, AlertTriangle, RotateCcw, Refrigerator, Users, Flame, LogOut, Download, Trash2, Clock, Award } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DeviceConnectCard } from '../../components/ui/DeviceConnectCard';
import { ConfettiBurst } from '../../components/ui/ConfettiBurst';
import { Theme } from '../../types';
import { ProfileData } from '../../hooks/useProfile';
import { useConfettiOnMilestone } from '../../hooks/useConfettiOnMilestone';
import { formatStat } from '../../utils/numberUtils';

const BASE = process.env.REACT_APP_API_URL || '';
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Halal', 'Kosher', 'Nut-Free'];
const MILESTONES = [
  { threshold: 1, label: 'Getting Started', icon: '🌱' },
  { threshold: 10, label: 'Waste Warrior', icon: '⚔️' },
  { threshold: 50, label: 'Fridge Master', icon: '👑' },
  { threshold: 100, label: 'Zero-Waste Hero', icon: '🏆' },
];

interface ProfileViewProps {
  token: string; username: string; darkMode: boolean; theme: Theme;
  profile: ProfileData | null; profileLoading: boolean;
  totalConsumed: number;
  onUpdateFridgeInfo: (updates: Partial<ProfileData>) => Promise<boolean>;
  onResetInventory: () => Promise<void>;
  onResetStats: () => Promise<void>;
  onLogoutAllSessions: () => Promise<boolean>;
  onDeleteAccount: (confirmUsername: string) => Promise<{ success: boolean; error?: string }>;
  onExportData: () => Promise<void>;
  onLogout: () => void;
}

function timeUntil(ts: number): string {
  const ms = ts - Date.now();
  if (ms <= 0) return 'expired';
  const hrs = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

export function ProfileView({ token, username, darkMode, theme, profile, profileLoading, totalConsumed, onUpdateFridgeInfo, onResetInventory, onResetStats, onLogoutAllSessions, onDeleteAccount, onExportData, onLogout }: ProfileViewProps) {
  const [pwStep, setPwStep] = useState<1 | 2>(1);
  const [currentPw, setCurrentPw] = useState(''); const [newPw, setNewPw] = useState(''); const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null); const [pwSuccess, setPwSuccess] = useState(false); const [pwLoading, setPwLoading] = useState(false);

  const [fridgeModel, setFridgeModel] = useState(''); const [fridgeCapacity, setFridgeCapacity] = useState('');
  const [householdSize, setHouseholdSize] = useState(''); const [calorieGoal, setCalorieGoal] = useState('');
  const [dietary, setDietary] = useState<string[]>([]); const [savingFridge, setSavingFridge] = useState(false); const [fridgeSaved, setFridgeSaved] = useState(false);

  const [confirmingReset, setConfirmingReset] = useState<'inventory' | 'stats' | null>(null);
  const [resetting, setResetting] = useState(false); const [resetDone, setResetDone] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState(''); const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false); const [deleteError, setDeleteError] = useState<string | null>(null);

  const milestoneBurst = useConfettiOnMilestone(totalConsumed, MILESTONES);

  useEffect(() => {
    if (!profile) return;
    setFridgeModel(profile.fridgeModel || ''); setFridgeCapacity(profile.fridgeCapacityLiters != null ? String(profile.fridgeCapacityLiters) : '');
    setHouseholdSize(profile.householdSize != null ? String(profile.householdSize) : ''); setCalorieGoal(profile.dailyCalorieGoal != null ? String(profile.dailyCalorieGoal) : '');
    setDietary(profile.dietaryPreferences || []);
  }, [profile]);

  const toggleDietary = (opt: string) => setDietary(prev => prev.includes(opt) ? prev.filter(d => d !== opt) : [...prev, opt]);

  const handleSaveFridgeInfo = async () => {
    setSavingFridge(true); setFridgeSaved(false);
    const ok = await onUpdateFridgeInfo({
      fridgeModel: fridgeModel.trim(),
      fridgeCapacityLiters: fridgeCapacity ? Number(fridgeCapacity) : undefined,
      householdSize: householdSize ? Number(householdSize) : undefined,
      dailyCalorieGoal: calorieGoal ? Number(calorieGoal) : undefined,
      dietaryPreferences: dietary,
    } as Partial<ProfileData>);
    setSavingFridge(false);
    if (ok) { setFridgeSaved(true); setTimeout(() => setFridgeSaved(false), 3000); }
  };

  const handleContinueToStep2 = () => {
    setPwError(null);
    if (!currentPw.trim()) { setPwError('Enter your current password to continue'); return; }
    setPwStep(2);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(null); setPwSuccess(false);
    if (newPw.length < 4) { setPwError('New password must be at least 4 characters'); return; }
    if (newPw !== confirmPw) { setPwError('New password and confirmation do not match'); return; }
    setPwLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth?action=profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ subaction: 'changePassword', currentPassword: currentPw, newPassword: newPw }) });
      const d = await r.json();
      if (!r.ok) { setPwError(d.error || 'Failed to change password'); return; }
      setPwSuccess(true); setPwStep(1); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { setPwError('Network error'); } finally { setPwLoading(false); }
  };

  const runReset = async (target: 'inventory' | 'stats') => {
    setResetting(true); setResetDone(null);
    try { if (target === 'inventory') await onResetInventory(); else await onResetStats(); setResetDone(target); }
    finally { setResetting(false); setConfirmingReset(null); setTimeout(() => setResetDone(null), 4000); }
  };

  const handleLogoutAll = async () => { setLoggingOutAll(true); const ok = await onLogoutAllSessions(); setLoggingOutAll(false); if (ok) onLogout(); };

  const handleDeleteAccount = async () => {
    setDeleting(true); setDeleteError(null);
    const result = await onDeleteAccount(deleteConfirmText);
    setDeleting(false);
    if (result.success) onLogout(); else setDeleteError(result.error || 'Failed');
  };

  if (profileLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-sky-400" /></div>;

  const earnedMilestones = MILESTONES.filter(m => totalConsumed >= m.threshold);
  const nextMilestone = MILESTONES.find(m => totalConsumed < m.threshold);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {milestoneBurst && <ConfettiBurst />}

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0"><UserCircle className="w-8 h-8 text-white" /></div>
        <div>
          <h2 className={`text-2xl font-bold ${theme.text}`}>{username}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${profile?.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}><ShieldCheck className="w-3 h-3 inline mr-1" />{profile?.role ?? 'user'}</span>
            {profile?.createdAt && <span className={`text-xs flex items-center gap-1 ${theme.textMuted}`}><Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      <Card className={`${theme.card} border-amber-500/20`}>
        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}><Award className="w-5 h-5 text-amber-400" /> Milestones</h3>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map(m => {
            const earned = totalConsumed >= m.threshold;
            return (
              <div key={m.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${earned ? 'bg-amber-500/20 text-amber-400' : darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                <span className={earned ? '' : 'grayscale opacity-50'}>{m.icon}</span> {m.label}
              </div>
            );
          })}
        </div>
        {earnedMilestones.length > 0 && (
          <p className={`text-xs mt-3 ${theme.textMuted}`}>🎉 You've earned {earnedMilestones.length} of {MILESTONES.length}: {earnedMilestones.map(m => m.label).join(', ')}</p>
        )}
        {nextMilestone && (
          <p className={`text-xs mt-2 ${theme.textMuted}`}>{formatStat(totalConsumed)}/{nextMilestone.threshold} used toward "{nextMilestone.label}"</p>
        )}
      </Card>

      <DeviceConnectCard token={token} darkMode={darkMode} theme={theme} />

      <Card className={theme.card}>
        <h3 className={`font-semibold ${theme.text} mb-1 flex items-center gap-2`}><Refrigerator className="w-5 h-5 text-sky-400" /> Household & kitchen</h3>
        <p className={`text-sm ${theme.textMuted} mb-4`}>Helps tailor recipe suggestions, portion sizing, and your calendar's calorie tracking.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Input label="Fridge model" placeholder="e.g. Samsung RF28" value={fridgeModel} onChange={e => setFridgeModel(e.target.value)} isDark={darkMode} />
          <Input label="Fridge capacity (liters)" type="number" placeholder="e.g. 400" value={fridgeCapacity} onChange={e => setFridgeCapacity(e.target.value)} isDark={darkMode} />
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Household size</label>
            <div className="flex items-center gap-2"><Users className={`w-4 h-4 ${theme.textMuted}`} /><input type="number" min="1" value={householdSize} onChange={e => setHouseholdSize(e.target.value)} placeholder="e.g. 3" className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} /></div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Daily calorie goal</label>
            <div className="flex items-center gap-2"><Flame className={`w-4 h-4 ${theme.textMuted}`} /><input type="number" min="0" value={calorieGoal} onChange={e => setCalorieGoal(e.target.value)} placeholder="e.g. 2000" className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} /></div>
          </div>
        </div>
        <div className="mt-4">
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Dietary preferences</label>
          <div className="flex flex-wrap gap-2">{DIETARY_OPTIONS.map(opt => <button key={opt} type="button" onClick={() => toggleDietary(opt)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${dietary.includes(opt) ? 'bg-indigo-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{opt}</button>)}</div>
        </div>
        <div className="mt-4 flex items-center gap-3"><Button variant="primary" loading={savingFridge} onClick={handleSaveFridgeInfo}>Save</Button>{fridgeSaved && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>}</div>
      </Card>

      <Card className={theme.card}>
        <h3 className={`font-semibold ${theme.text} mb-1 flex items-center gap-2`}><KeyRound className="w-5 h-5 text-sky-400" /> Change password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm mt-3">
          {pwStep === 1 ? (
            <>
              <Input type="password" label="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} isDark={darkMode} autoComplete="current-password" />
              {pwError && <p className="text-xs text-red-400">{pwError}</p>}
              <Button type="button" variant="primary" onClick={handleContinueToStep2}>Continue</Button>
            </>
          ) : (
            <>
              <div className={`flex items-center justify-between text-xs ${theme.textMuted}`}>
                <span>Now choose your new password.</span>
                <button type="button" onClick={() => { setPwStep(1); setPwError(null); }} className="underline">← Back</button>
              </div>
              <Input type="password" label="New password" value={newPw} onChange={e => setNewPw(e.target.value)} isDark={darkMode} autoComplete="new-password" />
              <Input type="password" label="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} isDark={darkMode} autoComplete="new-password" />
              {pwError && <p className="text-xs text-red-400">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Password updated.</p>}
              <Button type="submit" variant="primary" loading={pwLoading}>Update password</Button>
            </>
          )}
        </form>
      </Card>

      <Card className={`${theme.card} border-amber-500/20`}>
        <h3 className={`font-semibold ${theme.text} mb-1 flex items-center gap-2`}><ShieldCheck className="w-5 h-5 text-amber-400" /> Security</h3>
        {profile?.sessionExpiresAt && <p className={`text-xs flex items-center gap-1 mt-1 mb-3 ${theme.textMuted}`}><Clock className="w-3 h-3" /> This session expires in {timeUntil(profile.sessionExpiresAt)}</p>}
        <button onClick={handleLogoutAll} disabled={loggingOutAll} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors disabled:opacity-50">
          {loggingOutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Log out of all devices
        </button>
      </Card>

      <Card className={theme.card}>
        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}><Download className="w-5 h-5 text-sky-400" /> Your data</h3>
        <button onClick={onExportData} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Download className="w-4 h-4" /> Export all my data (JSON)</button>
      </Card>

      <Card className={`${theme.card} border-red-500/20`}>
        <h3 className={`font-semibold ${theme.text} mb-1 flex items-center gap-2`}><AlertTriangle className="w-5 h-5 text-red-400" /> Danger zone</h3>
        <p className={`text-sm ${theme.textMuted} mb-4`}>These actions cannot be undone.</p>
        <div className="space-y-3 max-w-md">
          {(['inventory', 'stats'] as const).map(target => (
            <div key={target} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div><p className={`text-sm font-medium ${theme.text}`}>{target === 'inventory' ? 'Reset inventory' : 'Reset usage stats'}</p><p className={`text-xs ${theme.textMuted}`}>{target === 'inventory' ? 'Removes all items from your fridge.' : 'Clears items-used and items-wasted counters.'}</p></div>
              {confirmingReset === target ? (
                <div className="flex items-center gap-2 flex-shrink-0"><button onClick={() => runReset(target)} disabled={resetting} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-1">{resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Confirm</button><button onClick={() => setConfirmingReset(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600 hover:bg-slate-500 text-white transition-colors">Cancel</button></div>
              ) : (<button onClick={() => setConfirmingReset(target)} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors">Reset</button>)}
            </div>
          ))}

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className={`text-sm font-medium ${theme.text} mb-2`}>Delete account</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Delete my account permanently</button>
            ) : (
              <div className="space-y-2 animate-scale-in">
                <p className={`text-xs ${theme.textMuted}`}>Type <strong className={theme.text}>{username}</strong> to confirm. All inventory, history, and preferences are permanently erased.</p>
                <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={username} className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                <div className="flex gap-2"><button onClick={handleDeleteAccount} disabled={deleting || deleteConfirmText !== username} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-40 flex items-center gap-1">{deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Permanently delete</button><button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(null); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600 hover:bg-slate-500 text-white transition-colors">Cancel</button></div>
              </div>
            )}
          </div>
        </div>
        {resetDone && <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Done.</p>}
      </Card>
    </div>
  );
}