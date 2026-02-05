import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EnergyData } from '../../types';

interface EnergyChartProps {
  data: EnergyData[];
  darkMode: boolean;
}

export function EnergyChart({ data, darkMode }: EnergyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
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
        <Legend />
        <Line type="monotone" dataKey="usage" stroke="#60A5FA" strokeWidth={3} name="Energy (kWh)" />
        <Line type="monotone" dataKey="doorOpens" stroke="#F87171" strokeWidth={3} name="Door Opens" />
      </LineChart>
    </ResponsiveContainer>
  );
}