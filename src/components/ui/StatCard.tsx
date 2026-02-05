import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  badge?: {
    text: string;
    color: string;
  };
  theme: any;
}

export function StatCard({ icon, value, label, badge, theme }: StatCardProps) {
  return (
    <Card hover className={theme.card}>
      <div className="flex items-center justify-between mb-3">
        <div className={theme.accent}>{icon}</div>
        {badge && (
          <span className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className={`text-2xl md:text-3xl font-bold ${theme.text} mb-1`}>
        {value}
      </div>
      <div className={`text-xs md:text-sm ${theme.textMuted}`}>{label}</div>
    </Card>
  );
}