import React from 'react';

interface SensorCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  connected: boolean;
  theme: any;
}

export function SensorCard({ icon, label, value, connected, theme }: SensorCardProps) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${connected ? theme.accent : theme.textMuted}`}>
        {value}
      </div>
      <div className={`text-xs ${theme.textMuted}`}>{label}</div>
    </div>
  );
}