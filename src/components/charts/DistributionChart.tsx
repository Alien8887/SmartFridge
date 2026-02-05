import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryData } from '../../types';

interface DistributionChartProps {
  data: CategoryData[];
  darkMode: boolean;
}

export function DistributionChart({ data, darkMode }: DistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={5}
          dataKey="value"
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            border: '1px solid ' + (darkMode ? '#475569' : '#e2e8f0'),
            borderRadius: '12px'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}