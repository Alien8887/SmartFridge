import React from 'react';

/** Purely decorative ambient background for the login screen — three
 *  softly blurred, staggered-pulse gradient circles. Absolutely
 *  positioned and pointer-events-none, so they never interfere with any
 *  real interaction. */
export function GradientBlob({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl animate-glow-pulse ${darkMode ? 'bg-sky-500/10' : 'bg-sky-300/20'}`} />
      <div className={`absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-3xl ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-300/20'}`} style={{ animation: 'glow-pulse 3s ease-in-out infinite 1s' }} />
      <div className={`absolute -bottom-24 left-1/3 w-72 h-72 rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/15'}`} style={{ animation: 'glow-pulse 3s ease-in-out infinite 2s' }} />
    </div>
  );
}