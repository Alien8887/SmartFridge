import React from 'react';

export function Skeleton({ darkMode, className = '' }: { darkMode: boolean; className?: string }) {
  return <div className={`animate-pulse rounded-lg ${darkMode ? 'bg-slate-700/60' : 'bg-slate-200'} ${className}`} />;
}