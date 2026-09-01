import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ConsumptionData } from '../../types';
import { startOfWeek, addDays } from '../../utils/dateUtils';
import { exportConsumptionCSV } from '../../utils/chartUtils';
import { ChartHeader, ChartEmptyState } from './ChartControls';

interface ConsumptionChartProps { data: ConsumptionData[]; darkMode: boolean; }

const CATEGORY_COLORS = { dairy: '#60A5FA', meat: '#F87171', vegetables: '#34D399', fruits: '#FBBF24' } as const;

export function ConsumptionChart({ data, darkMode }: ConsumptionChartProps) {
  // FIXED: bars previously showed only "Mon"/"Tue" with no calendar date
  // attached anywhere — genuinely impossible to tell which week this was.
  // Real dates computed from the current week's Monday, using the SAME
  // startOfWeek() Calendar itself uses, so "this week" is unambiguous and
  // matches Calendar's own grid.
  const weekStart = startOfWeek(new Date());
  const chartData = data.map((row, i) => {
    const date = addDays(weekStart, i);
    return { ...row, dateLabel: date.toLocaleDateString([], { month: 'short', day: 'numeric' }), fullDate: date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) };
  });

  const total = data.reduce((sum, row) => sum + row.dairy + row.meat + row.vegetables + row.fruits, 0);
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div>
      <ChartHeader darkMode={darkMode} onExport={() => exportConsumptionCSV(chartData)} />
      {total === 0 ? (
        <ChartEmptyState darkMode={darkMode} message="Nothing logged yet this week — mark items Used or Wasted to see them here." />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="dateLabel" stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <YAxis allowDecimals={false} stroke={axisColor} style={{ fontSize: '11px' }} tick={{ fill: axisColor }} />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`, borderRadius: '12px' }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="dairy" stackId="a" name="Dairy" fill={CATEGORY_COLORS.dairy} />
            <Bar dataKey="meat" stackId="a" name="Meat" fill={CATEGORY_COLORS.meat} />
            <Bar dataKey="vegetables" stackId="a" name="Vegetables" fill={CATEGORY_COLORS.vegetables} />
            <Bar dataKey="fruits" stackId="a" name="Fruits" fill={CATEGORY_COLORS.fruits} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Week of {weekStart.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} – {addDays(weekStart, 6).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
}