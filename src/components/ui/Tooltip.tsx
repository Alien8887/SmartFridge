import React, { useState } from 'react';

interface TooltipProps { text: string; children: React.ReactNode; darkMode: boolean; }

export function Tooltip({ text, children, darkMode }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50 animate-scale-in shadow-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'}`}>
          {text}
          <span className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 ${darkMode ? 'bg-slate-700' : 'bg-slate-800'}`} />
        </span>
      )}
    </span>
  );
}