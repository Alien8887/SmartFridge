import React, { useEffect } from 'react';
import { X, PartyPopper } from 'lucide-react';

interface MilestoneToastProps { label: string; icon: string; onDismiss: () => void; }

export function MilestoneToast({ label, icon, onDismiss }: MilestoneToastProps) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <span className="text-2xl animate-number-pop">{icon}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90 flex items-center gap-1"><PartyPopper className="w-3 h-3" /> Milestone unlocked</p>
          <p className="font-bold">{label}</p>
        </div>
        <button onClick={onDismiss} className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}