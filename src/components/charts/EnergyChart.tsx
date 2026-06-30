import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EnergyData } from '../../types';
import { formatTimestampTick, hasRealTimestamps, exportEnergyCSV } from '../../utils/chartUtils';
import { ExportButton } from '../ui/ExportButton';

interface EnergyChartProps { data: EnergyData[]; darkMode: boolean; }

export function EnergyChart({ data, darkMode }: EnergyChartProps) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No door events yet</div>;

  const realTs = hasRealTimestamps(data);
  const span = realTs ? (data[data.length - 1].timestamp ?? 0) - (data[0].timestamp ?? 0) : 0;
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
  const last = data[data.length - 1];

  return (
    <div>
      <div className="flex justify-end mb-2"><ExportButton darkMode={darkMode} onClick={() => exportEnergyCSV(data)} /></div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey={realTs ? 'timestamp' : 'time'}
            type={realTs ? 'number' : 'category'}
            domain={realTs ? ['dataMin', 'dataMax'] : undefined}
            scale={realTs ? 'time' : 'auto'}
            tickFormatter={realTs ? (ts: number) => formatTimestampTick(ts, span) : undefined}
            stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }}
          />
          <YAxis yAxisId="left" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <YAxis yAxisId="right" orientation="right" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <Tooltip
            contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }}
            labelFormatter={realTs ? (ts: number) => new Date(ts).toLocaleString() : undefined}
          />
          <Legend />
          <Bar yAxisId="right" dataKey="doorOpens" fill="#FBBF24" name="Door opens" isAnimationActive={false} />
          <Line yAxisId="left" type="monotone" dataKey="usage" stroke="#60A5FA" strokeWidth={2} dot={false} name="Energy (kWh)" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className={`text-xs text-right mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Last event: {realTs && last.timestamp ? new Date(last.timestamp).toLocaleTimeString() : last.time}
      </p>
    </div>
  );
}