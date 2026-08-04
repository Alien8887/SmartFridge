import React, { useId } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTimestampTick, computeForecastCurve, exportChartCSV, FixedBucket } from '../../utils/chartUtils';
import { ChartHeader, ChartFooter, ChartEmptyState } from './ChartControls';

interface TempChartProps { data: FixedBucket[]; darkMode: boolean; windowStart: number; windowEnd: number; showForecast: boolean; }
const TEMP_BOUNDS: [number, number] = [-10, 30];

export function TempChart({ data, darkMode, windowStart, windowEnd, showForecast }: TempChartProps) {
  const gradientId = `temp-${useId().replace(/:/g, '')}`;

  const allEmpty = data.every(d => d.value === null);
  const span = windowEnd - windowStart;
  const realPoints = data.filter(d => d.value !== null).map(d => ({ time: d.time, value: d.value as number, timestamp: d.timestamp }));
  const last = realPoints[realPoints.length - 1] ?? null;

  const forecastCurve = showForecast && last ? computeForecastCurve(realPoints, Math.min(Math.max(Date.now() - last.timestamp, 600_000), 1_800_000), TEMP_BOUNDS) : [];
  const combined = [
    ...data.map(d => ({ time: d.time, timestamp: d.timestamp, value: d.value, ewmaValue: d.ewmaValue, forecastValue: null as number | null })),
    ...(forecastCurve.length > 0 && last
      ? [{ time: last.time, timestamp: last.timestamp, value: null, ewmaValue: null, forecastValue: last.value }, ...forecastCurve.map(fp => ({ time: fp.time, timestamp: fp.timestamp, value: null, ewmaValue: null, forecastValue: fp.value }))]
      : []),
  ];

  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div>
      <ChartHeader darkMode={darkMode} onExport={() => exportChartCSV(realPoints, 'Temperature', '°C')} />
      {allEmpty ? <ChartEmptyState darkMode={darkMode} /> : (
        <ResponsiveContainer width="100%" height={250}>
          {/* syncId + syncMethod="value": showForecast is now owned by
              EnvironmentView and shared across all three sensor charts —
              their arrays always stay the same length, which is the real
              fix. syncMethod="value" (matches by timestamp, not array
              index) is defense-in-depth on top, confirmed against
              Recharts' own docs. */}
          <ComposedChart data={combined} syncId="fridge-sensors" syncMethod="value" margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8} /><stop offset="95%" stopColor="#60A5FA" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="timestamp" type="number" domain={[windowStart, windowEnd]} scale="time" tickFormatter={(ts: number) => formatTimestampTick(ts, span)} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }}
              formatter={(v: number, key: string) => v == null ? ['No data', ''] : key === 'forecastValue' ? [`${v.toFixed(1)}°C`, 'Predicted'] : key === 'ewmaValue' ? [`${v.toFixed(1)}°C`, 'Trend'] : [`${v.toFixed(1)}°C`, 'Temperature']}
              labelFormatter={(ts: number) => new Date(ts).toLocaleString()} />
            <Area type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} fillOpacity={0.8} fill={`url(#${gradientId})`} isAnimationActive={false} connectNulls={false} />
            <Line type="monotone" dataKey="ewmaValue" stroke={darkMode ? '#e2e8f0' : '#475569'} strokeWidth={1.5} strokeDasharray="2 3" dot={false} isAnimationActive={false} connectNulls={false} />
            {showForecast && <Line type="monotone" dataKey="forecastValue" stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} connectNulls />}
          </ComposedChart>
        </ResponsiveContainer>
      )}
      <ChartFooter lastTimestamp={last?.timestamp ?? null} darkMode={darkMode} note={showForecast ? ' — dashed purple is a trend projection, clipped to a realistic range.' : undefined} />
    </div>
  );
}