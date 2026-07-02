import React, { useState } from 'react';
import { KeyRound, Copy, Check, Loader2 } from 'lucide-react';
import { Theme } from '../../types';

const BASE = process.env.REACT_APP_API_URL || '';

interface DeviceConnectCardProps { token: string; darkMode: boolean; theme: Theme; }

export function DeviceConnectCard({ token, darkMode, theme }: DeviceConnectCardProps) {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDeviceToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BASE}/api/auth?action=device-token`, { headers: { Authorization: `Bearer ${token}` } });
      let d: any = {};
      try { d = await r.json(); } catch { /* non-JSON response */ }
      if (!r.ok) throw new Error(d.error || `Request failed (HTTP ${r.status}) — is the API deployed?`);
      setDeviceToken(d.deviceToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch your device code.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!deviceToken) return;
    navigator.clipboard?.writeText(deviceToken).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className={`${theme.card} border rounded-xl p-4 animate-fade-in`}>
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-5 h-5 text-sky-400" />
        <h3 className={`font-semibold ${theme.text}`}>Connect your fridge</h3>
      </div>

      {!deviceToken ? (
        <>
          <p className={`text-sm ${theme.textMuted} mb-3`}>
            Generate a private code and paste it into your ESP32 sketch's{' '}
            <code className="mx-1 px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono text-xs">DEVICE_TOKEN</code>
            constant. Every reading that fridge sends will belong only to your account.
          </p>
          <button onClick={fetchDeviceToken} disabled={loading}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? 'Generating…' : 'Get connection code'}
          </button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </>
      ) : (
        <div className="animate-scale-in space-y-2">
          <div className={`flex items-center gap-2 p-3 rounded-lg font-mono text-xs break-all ${darkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
            <span className="flex-1">{deviceToken}</span>
            <button onClick={copy} className="flex-shrink-0 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors" aria-label="Copy device token">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className={`text-xs ${theme.textMuted}`}>This code doesn't expire — treat it like a password.</p>
        </div>
      )}
    </div>
  );
}