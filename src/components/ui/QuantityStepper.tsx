import React, { useState } from 'react';
import { Minus, Plus, Check, X } from 'lucide-react';

interface QuantityStepperProps { max: number; unit: string; onConfirm: (amount: number) => void; onCancel: () => void; darkMode: boolean; }

export function QuantityStepper({ max, unit, onConfirm, onCancel, darkMode }: QuantityStepperProps) {
  const [amount, setAmount] = useState(Math.min(1, max));
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg animate-scale-in ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
      <button onClick={() => setAmount(a => Math.max(1, a - 1))} type="button" className="p-1.5 rounded-md bg-slate-600 hover:bg-slate-500 text-white transition-colors"><Minus className="w-3.5 h-3.5" /></button>
      <span className={`text-sm font-medium min-w-[70px] text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>{amount} / {max} {unit}</span>
      <button onClick={() => setAmount(a => Math.min(max, a + 1))} type="button" className="p-1.5 rounded-md bg-slate-600 hover:bg-slate-500 text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
      <button onClick={() => onConfirm(amount)} type="button" className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors ml-1"><Check className="w-3.5 h-3.5" /></button>
      <button onClick={onCancel} type="button" className="p-1.5 rounded-md bg-slate-600 hover:bg-slate-500 text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}