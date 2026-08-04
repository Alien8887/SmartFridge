import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Theme } from '../../types';

interface ModeInsightBannerProps { message: string; darkMode: boolean; theme: Theme; }

// Indigo, not purple — per the color system: rule-based "smart" logic gets
// indigo; true purple is reserved for genuine AI/ML output.
export function ModeInsightBanner({ message, darkMode, theme }: ModeInsightBannerProps) {
  return (
    <div className={`animate-slide-down flex items-center gap-2 rounded-xl p-3 border ${darkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/60 border-indigo-200'}`}>
      <Lightbulb className="w-4 h-4 text-indigo-400 flex-shrink-0" />
      <p className={`text-sm ${theme.text}`}>{message}</p>
    </div>
  );
}