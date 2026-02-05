import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types';

interface TempChartProps {
  data: ChartDataPoint[];
  darkMode: boolean;
}

export function TempChart({ data, darkMode }: TempChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
        <Area type="monotone" dataKey="value" stroke="#60A5FA" fillOpacity={1} fill="url(#colorTemp)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}