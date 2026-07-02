import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

interface SortOption { value: string; label: string; }
interface SortMenuProps { options: SortOption[]; value: string; onChange: (v: string) => void; darkMode: boolean; }

export function SortMenu({ options, value, onChange, darkMode }: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} type="button"
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          darkMode ? 'bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}>
        <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Sort: {current?.label ?? '—'}</span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute right-0 mt-1 w-44 rounded-lg border shadow-lg z-20 overflow-hidden animate-scale-in ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} type="button"
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                o.value === value
                  ? 'bg-sky-500/15 text-sky-400 font-medium'
                  : darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
              }`}>
              {o.label}
              {o.value === value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}