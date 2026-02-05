import { useState } from 'react';
import { Theme } from '../types';

export function useTheme() {
  const [darkMode, setDarkMode] = useState(true);

  const theme: { light: Theme; dark: Theme } = {
    light: {
      bg: 'bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100',
      card: 'bg-white/80 backdrop-blur-lg border-slate-200',
      text: 'text-slate-900',
      textMuted: 'text-slate-600',
      accent: 'text-sky-600',
      hover: 'hover:bg-sky-50'
    },
    dark: {
      bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-black',
      card: 'bg-slate-800/50 backdrop-blur-lg border-slate-700',
      text: 'text-white',
      textMuted: 'text-slate-400',
      accent: 'text-sky-400',
      hover: 'hover:bg-slate-700/50'
    }
  };

  const t = darkMode ? theme.dark : theme.light;

  return { darkMode, setDarkMode, theme: t };
}