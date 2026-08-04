import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Theme } from '../../types';

interface SectionHeadingProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accentColor?: 'sky' | 'purple' | 'indigo' | 'amber' | 'teal' | 'emerald';
  action?: React.ReactNode;
  theme: Theme;
  darkMode: boolean;
}

const ACCENT_MAP: Record<string, { bg: string; text: string; gradient: string }> = {
  sky:     { bg: 'bg-sky-500/15',     text: 'text-sky-400',     gradient: 'from-sky-500 to-blue-500'       },
  purple:  { bg: 'bg-purple-500/15',  text: 'text-purple-400',  gradient: 'from-purple-500 to-fuchsia-500' },
  indigo:  { bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  gradient: 'from-indigo-500 to-violet-500'  },
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-400',   gradient: 'from-amber-500 to-orange-500'   },
  teal:    { bg: 'bg-teal-500/15',    text: 'text-teal-400',    gradient: 'from-teal-500 to-cyan-500'      },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', gradient: 'from-emerald-500 to-green-500'  },
};

/** Reusable page header: icon chip + title + optional subtitle + optional
 *  right-aligned action, with a short gradient accent underline colored
 *  by the section's own identity (teal for Calendar, sky for the app
 *  default, etc.). */
export function SectionHeading({ icon: Icon, title, subtitle, accentColor = 'sky', action, theme, darkMode }: SectionHeadingProps) {
  const accent = ACCENT_MAP[accentColor];
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent.bg}`}>
          <Icon className={`w-5 h-5 ${accent.text}`} />
        </div>
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${theme.text}`}>{title}</h2>
          {subtitle && <p className={`text-sm ${theme.textMuted}`}>{subtitle}</p>}
          <div className={`h-0.5 w-10 mt-1.5 rounded-full bg-gradient-to-r ${accent.gradient}`} />
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}