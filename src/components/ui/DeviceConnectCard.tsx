import React, { useState } from 'react';
import { KeyRound, Copy, Check, Loader2, Cpu, Usb } from 'lucide-react';
import { Theme } from '../../types';
import { copyText } from '../../utils/clipboard';

const BASE = process.env.REACT_APP_API_URL || '';

interface DeviceConnectCardProps { token: string; darkMode: boolean; theme: Theme; }

export function DeviceConnectCard({ token, darkMode, theme }: DeviceConnectCardProps) {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [instructionsTab, setInstructionsTab] = useState<'hardware' | 'wokwi'>('hardware');

  const fetchDeviceToken = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${BASE}/api/auth?action=device-token`, { headers: { Authorization: `Bearer ${token}` } });
      let d: any = {};
      try { d = await r.json(); } catch { /* non-JSON response */ }
      if (!r.ok) throw new Error(d.error || `Request failed (HTTP ${r.status}) — is the API deployed?`);
      setDeviceToken(d.deviceToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch your device code.');
    } finally { setLoading(false); }
  };

  const copy = async () => {
    if (!deviceToken) return;
    const ok = await copyText(deviceToken);
    if (ok) { setCopied(true); setCopyFailed(false); setTimeout(() => setCopied(false), 2000); }
    else { setCopyFailed(true); setTimeout(() => setCopyFailed(false), 4000); }
  };

  return (
    <div className={`${theme.card} border rounded-xl p-4 animate-fade-in`}>
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-5 h-5 text-sky-400" />
        <h3 className={`font-semibold ${theme.text}`}>Connect your fridge</h3>
      </div>

      {!deviceToken ? (
        <>
          <p className={`text-sm ${theme.textMuted} mb-3`}>Generate a private code, then follow the instructions for your setup below.</p>
          <button onClick={fetchDeviceToken} disabled={loading} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? 'Generating…' : 'Get connection code'}
          </button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </>
      ) : (
        <div className="animate-scale-in space-y-3">
          <div className={`flex items-center gap-2 p-3 rounded-lg font-mono text-xs break-all select-all ${darkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
            <span className="flex-1">{deviceToken}</span>
            <button onClick={copy} className="flex-shrink-0 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors" aria-label="Copy device token">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {copyFailed && <p className="text-xs text-amber-400">Couldn't copy automatically — the code above is selectable, so triple-click it and press Ctrl/Cmd+C.</p>}

          <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <button onClick={() => setInstructionsTab('hardware')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors ${instructionsTab === 'hardware' ? 'bg-sky-500 text-white' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}><Usb className="w-3.5 h-3.5" /> Real hardware</button>
            <button onClick={() => setInstructionsTab('wokwi')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors ${instructionsTab === 'wokwi' ? 'bg-sky-500 text-white' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}><Cpu className="w-3.5 h-3.5" /> Wokwi simulator</button>
          </div>

          <div className={`text-xs ${theme.textMuted} space-y-1`}>
            {instructionsTab === 'hardware' ? (
              <>
                <p>1. Power on your ESP32 and open its Serial Monitor (115200 baud).</p>
                <p>2. It prints "DEVICE PAIRING REQUIRED" and waits for input.</p>
                <p>3. Paste the code above, press Enter — saved to flash permanently, across power loss.</p>
                <p>4. To switch accounts later, type <code className="font-mono">RESET_TOKEN</code> in the Serial Monitor.</p>
              </>
            ) : (
              <>
                <p>Wokwi does not save flash writes between full simulation restarts, so Serial pairing only lasts for the current run.</p>
                <p>For repeated test sessions, paste the code into <code className="font-mono">DEVICE_TOKEN_OVERRIDE</code> near the top of the .ino file instead — leave that blank for real hardware.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}