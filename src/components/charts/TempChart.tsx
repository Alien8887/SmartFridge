import React, { useId, useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';
import { ChartDataPoint } from '../../types';
import { formatTimestampTick, hasRealTimestamps, exportChartCSV, computeForecastPoint, getStalenessInfo } from '../../utils/chartUtils';
import { ExportButton } from '../ui/ExportButton';

interface TempChartProps { data: ChartDataPoint[]; darkMode: boolean; rangeMs?: number; }

export function TempChart({ data, darkMode, rangeMs = 3_600_000 }: TempChartProps) {
  const gradientId = `temp-${useId().replace(/:/g, '')}`;
  const [, forceTick] = useState(0);
  const [showForecast, setShowForecast] = useState(false);
  useEffect(() => { const id = setInterval(() => forceTick(t => t + 1), 30_000); return () => clearInterval(id); }, []);

  if (!data || data.length === 0) return <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No data yet</div>;

  const realTs = hasRealTimestamps(data);
  const last = data[data.length - 1];
  const span = realTs ? (last.timestamp ?? 0) - (data[0].timestamp ?? 0) : 0;
  const { isStale, staleLabel } = realTs ? getStalenessInfo(last.timestamp, rangeMs) : { isStale: false, staleLabel: '' };

  const staleMs = realTs && last.timestamp ? Date.now() - last.timestamp : 0;
  const forecastAheadMs = Math.min(Math.max(staleMs, 10 * 60_000), 30 * 60_000);
  const forecastPoint = realTs && showForecast ? computeForecastPoint(data, forecastAheadMs) : null;

  const combined = realTs
    ? [...data.map(p => ({ ...p, forecastValue: null as number | null })),
       ...(forecastPoint ? [{ ...last, forecastValue: last.value }, { time: forecastPoint.time, timestamp: forecastPoint.timestamp, value: null, forecastValue: forecastPoint.value }] : [])]
    : data.map(p => ({ ...p, forecastValue: null as number | null }));

  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        {/* Explicit AI opt-in, per-chart — purple, since this is the only AI element here */}
        <button onClick={() => setShowForecast(s => !s)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${showForecast ? 'bg-purple-600 text-white' : 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25'}`}>
          <Sparkles className="w-3 h-3" /> {showForecast ? 'Hide prediction' : 'Predict'}
        </button>
        <ExportButton darkMode={darkMode} onClick={() => exportChartCSV(data, 'Temperature', '°C')} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={combined} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={isStale ? 0.25 : 0.8} />
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey={realTs ? 'timestamp' : 'time'} type={realTs ? 'number' : 'category'} domain={realTs ? ['dataMin', 'dataMax'] : undefined} scale={realTs ? 'time' : 'auto'} tickFormatter={realTs ? (ts: number) => formatTimestampTick(ts, span) : undefined} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }} formatter={(v: number, key: string) => key === 'forecastValue' ? [`${v?.toFixed(1)}°C`, 'Predicted'] : [`${v?.toFixed(1)}°C`, 'Temperature']} labelFormatter={realTs ? (ts: number) => new Date(ts).toLocaleString() : undefined} />
          <Area type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} strokeOpacity={isStale ? 0.35 : 1} fillOpacity={isStale ? 0.4 : 1} fill={`url(#${gradientId})`} isAnimationActive={false} />
          {showForecast && <Line type="monotone" dataKey="forecastValue" stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
      <p className={`text-xs mt-1 ${isStale ? 'text-amber-400' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {isStale ? `⚠ No new data for ${staleLabel}.` : `Last reading: ${realTs && last.timestamp ? new Date(last.timestamp).toLocaleTimeString() : last.time}`}
        {showForecast && ' — dashed line is a simple trend projection, not a guarantee.'}
      </p>
    </div>
  );
}