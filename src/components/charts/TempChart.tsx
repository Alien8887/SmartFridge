import React, { useId } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types';
import { formatTimestampTick, hasRealTimestamps, exportChartCSV } from '../../utils/chartUtils';
import { ExportButton } from '../ui/ExportButton';

interface TempChartProps { data: ChartDataPoint[]; darkMode: boolean; }

export function TempChart({ data, darkMode }: TempChartProps) {
  const gradientId = `temp-${useId().replace(/:/g, '')}`;
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No data yet</div>;

  const realTs = hasRealTimestamps(data);
  const span = realTs ? (data[data.length - 1].timestamp ?? 0) - (data[0].timestamp ?? 0) : 0;
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
  const last = data[data.length - 1];

  return (
    <div>
      <div className="flex justify-end mb-2"><ExportButton darkMode={darkMode} onClick={() => exportChartCSV(data, 'Temperature', '°C')} /></div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey={realTs ? 'timestamp' : 'time'}
            type={realTs ? 'number' : 'category'}
            domain={realTs ? ['dataMin', 'dataMax'] : undefined}
            scale={realTs ? 'time' : 'auto'}
            tickFormatter={realTs ? (ts: number) => formatTimestampTick(ts, span) : undefined}
            stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }}
          />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <Tooltip
            contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }}
            formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperature']}
            labelFormatter={realTs ? (ts: number) => new Date(ts).toLocaleString() : undefined}
          />
          <Area type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      <p className={`text-xs text-right mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Last reading: {realTs && last.timestamp ? new Date(last.timestamp).toLocaleTimeString() : last.time}
      </p>
    </div>
  );
}