import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EnergyData } from '../../types';
import { exportEnergyCSV } from '../../utils/chartUtils';
import { ExportButton } from '../ui/ExportButton';

interface EnergyChartProps { data: EnergyData[]; darkMode: boolean; }

export function EnergyChart({ data, darkMode }: EnergyChartProps) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No door events yet</div>;

  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';
  const last = data[data.length - 1];
  const maxOpens = Math.max(1, ...data.map(d => d.doorOpens));

  return (
    <div>
      <div className="flex justify-end mb-2"><ExportButton darkMode={darkMode} onClick={() => exportEnergyCSV(data)} /></div>
      <ResponsiveContainer width="100%" height={250}>
        {/* Categorical (not numeric/time-scaled) x-axis on purpose — door
            events are sparse and discrete, and Recharts' bar-width math only
            behaves against a categorical axis. Pairing Bar with a numeric
            time axis is what let the bars balloon past the plot area. */}
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="time" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <YAxis yAxisId="left" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <YAxis yAxisId="right" orientation="right" allowDecimals={false} domain={[0, Math.max(4, Math.ceil(maxOpens * 1.3))]} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
          <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }} />
          <Legend />
          <Bar yAxisId="right" dataKey="doorOpens" fill="#FBBF24" name="Door opens (this period)" maxBarSize={28} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="left" type="monotone" dataKey="usage" stroke="#60A5FA" strokeWidth={2} dot={false} name="Energy (kWh)" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className={`text-xs text-right mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Last event: {last.time}</p>
    </div>
  );
}