import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ConsumptionData } from '../../types';

interface ConsumptionChartProps {
  data: ConsumptionData[];
  darkMode: boolean;
}

export function ConsumptionChart({ data, darkMode }: ConsumptionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
        <XAxis dataKey="day" stroke={darkMode ? '#94a3b8' : '#64748b'} />
        <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
            borderRadius: '12px'
          }}
        />
        <Bar dataKey="dairy" stackId="a" fill="#60A5FA" />
        <Bar dataKey="meat" stackId="a" fill="#F87171" />
        <Bar dataKey="vegetables" stackId="a" fill="#34D399" />
        <Bar dataKey="fruits" stackId="a" fill="#FBBF24" />
      </BarChart>
    </ResponsiveContainer>
  );
}