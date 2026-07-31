import React from 'react';
import { Sparkles, CircleOff } from 'lucide-react';
import { ExportButton } from '../ui/ExportButton';

interface ChartHeaderProps { onExport: () => void; darkMode: boolean; showForecast?: boolean; onToggleForecast?: () => void; }

export function ChartHeader({ onExport, darkMode, showForecast, onToggleForecast }: ChartHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-2">
      {onToggleForecast ? (
        <button onClick={onToggleForecast} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${showForecast ? 'bg-purple-600 text-white' : 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25'}`}>
          <Sparkles className="w-3 h-3" /> {showForecast ? 'Hide prediction' : 'Predict'}
        </button>
      ) : <span />}
      <ExportButton darkMode={darkMode} onClick={onExport} />
    </div>
  );
}

interface ChartFooterProps { lastTimestamp: number | null; darkMode: boolean; label?: string; emptyLabel?: string; note?: string; liveThresholdMs?: number; }

export function ChartFooter({ lastTimestamp, darkMode, label = 'Last reading', emptyLabel = 'No data in this window', note, liveThresholdMs = 120_000 }: ChartFooterProps) {
  const mutedClass = darkMode ? 'text-slate-500' : 'text-slate-400';
  if (lastTimestamp === null) return <p className={`text-xs mt-1 ${mutedClass}`}>{emptyLabel}</p>;
  const isLive = Date.now() - lastTimestamp < liveThresholdMs;
  return (
    <p className={`text-xs mt-1 flex items-center gap-1.5 ${mutedClass}`}>
      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-status-pulse flex-shrink-0" />}
      {label}: {new Date(lastTimestamp).toLocaleTimeString()}{note}
    </p>
  );
}

export function ChartEmptyState({ darkMode, message = 'No data in this window' }: { darkMode: boolean; message?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 h-[250px] rounded-xl ${darkMode ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
      <CircleOff className={`w-6 h-6 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
      <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{message}</span>
    </div>
  );
}