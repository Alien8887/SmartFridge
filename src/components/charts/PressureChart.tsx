import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types';

interface PressureChartProps {
  data: ChartDataPoint[];
  darkMode: boolean;
}

export function PressureChart({ data, darkMode }: PressureChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
        <XAxis dataKey="time" stroke={darkMode ? '#94a3b8' : '#64748b'} />
        <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
            borderRadius: '12px'
          }}
        />
        <Line type="monotone" dataKey="value" stroke="#A78BFA" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}