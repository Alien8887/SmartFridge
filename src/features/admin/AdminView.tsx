import React, { useEffect } from 'react';
import { ShieldCheck, Users, Loader2, Refrigerator, KeyRound } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Theme } from '../../types';
import { useAdmin } from '../../hooks/useAdmin';

interface AdminViewProps { token: string; darkMode: boolean; theme: Theme; }

export function AdminView({ token, darkMode, theme }: AdminViewProps) {
  const { users, loading, error, loaded, fetchUsers } = useAdmin(token);
  useEffect(() => { if (!loaded) fetchUsers(); }, [loaded, fetchUsers]);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl md:text-3xl font-bold ${theme.text} flex items-center gap-2`}><ShieldCheck className="w-6 h-6 text-amber-400" /> All Accounts</h2>
        <button onClick={fetchUsers} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors">Refresh</button>
      </div>

      {loading ? (
        <Card className={theme.card}><div className="text-center py-10"><Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" /></div></Card>
      ) : error ? (
        <Card className={`${theme.card} border-red-500/30`}><p className="text-sm text-red-400">{error}</p></Card>
      ) : (
        <Card className={theme.card}>
          <div className="flex items-center gap-2 mb-4"><Users className={`w-4 h-4 ${theme.textMuted}`} /><span className={`text-sm ${theme.textMuted}`}>{users.length} account{users.length !== 1 ? 's' : ''}</span></div>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.username} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${theme.text}`}>{u.username}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>{u.role}</span>
                  </div>
                  <div className={`text-xs mt-0.5 flex items-center gap-3 flex-wrap ${theme.textMuted}`}>
                    {u.createdAt && <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>}
                    {u.fridgeModel && <span className="flex items-center gap-1"><Refrigerator className="w-3 h-3" /> {u.fridgeModel}</span>}
                    {u.householdSize && <span>{u.householdSize} people</span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {u.hasDevice ? <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center gap-1"><KeyRound className="w-3 h-3" /> Connected</span>
                    : <span className={`text-xs px-2 py-1 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>No device</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}