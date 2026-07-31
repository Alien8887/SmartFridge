import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EnergyData } from '../../types';
import { exportEnergyCSV } from '../../utils/chartUtils';
import { ChartHeader, ChartFooter, ChartEmptyState } from './ChartControls';

interface EnergyChartProps { data: EnergyData[]; darkMode: boolean; }

export function EnergyChart({ data, darkMode }: EnergyChartProps) {
  // "Zero door opens" is a genuinely GOOD state, not a data gap — door
  // state arrives with every temperature reading, so this only means
  // nobody opened the fridge this period.
  const noEvents = data.length === 0 || data.every(b => b.doorOpens === 0);
  const lastEventBucket = [...data].reverse().find(b => b.doorOpens > 0);
  const lastEventTs = lastEventBucket ? lastEventBucket.timestamp ?? null : null;

  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div>
      <ChartHeader darkMode={darkMode} onExport={() => exportEnergyCSV(data)} />
      {noEvents ? <ChartEmptyState darkMode={darkMode} message="No door opens in this window — good sign!" /> : (
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <YAxis yAxisId="left" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <YAxis yAxisId="right" orientation="right" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar yAxisId="right" dataKey="doorOpens" name="Door opens (this period)" fill="#FBBF24" radius={[4, 4, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="usage" name="Energy (kWh)" stroke="#F59E0B" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
      <ChartFooter lastTimestamp={lastEventTs} darkMode={darkMode} label="Last event" emptyLabel="No door opens recorded" liveThresholdMs={300_000} />
    </div>
  );
}