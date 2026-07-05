import React, { useState } from 'react';
import { Minus, Plus, Apple, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { formatQuantity, unitLabel, stepForUnit, isContinuousUnit, sanitizeAmount } from '../../utils/unitUtils';
import { Theme } from '../../types';

interface UsageModalProps {
  itemName: string;
  max: number;
  unit: string;
  mode: 'use' | 'waste';
  onConfirm: (amount: number) => void;
  onClose: () => void;
  darkMode: boolean;
  theme: Theme;
}

export function UsageModal({ itemName, max, unit, mode, onConfirm, onClose, darkMode, theme }: UsageModalProps) {
  const step = stepForUnit(unit);
  const [amount, setAmount] = useState(mode === 'waste' ? max : Math.min(step, max));
  const [text, setText] = useState(formatQuantity(mode === 'waste' ? max : Math.min(step, max), unit));

  const clamp = (n: number) => Math.max(0, Math.min(max, n));
  const applyAmount = (n: number) => { const c = clamp(n); setAmount(c); setText(formatQuantity(c, unit)); };

  const handleTextChange = (v: string) => {
    setText(v);
    const parsed = parseFloat(v);
    if (!isNaN(parsed)) setAmount(clamp(sanitizeAmount(parsed, unit)));
  };

  return (
    <Modal isOpen title={mode === 'use' ? `Use ${itemName}` : `Waste ${itemName}`} onClose={onClose} theme={theme}>
      <div className="space-y-5 animate-fade-in">
        <p className={`text-sm ${theme.textMuted}`}>
          {mode === 'use' ? 'How much are you using?' : 'How much is being thrown out?'} You have {formatQuantity(max, unit)} {unitLabel(unit)} left.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button onClick={() => applyAmount(amount - step)} type="button" className="p-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white transition-colors active:scale-95"><Minus className="w-5 h-5" /></button>

          <div className="flex flex-col items-center">
            <input
              type="number"
              inputMode="decimal"
              step={isContinuousUnit(unit) ? '0.1' : '1'}
              min={0}
              max={max}
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              className={`w-28 text-center text-2xl font-bold py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
            />
            <span className={`text-xs mt-1 ${theme.textMuted}`}>{unitLabel(unit)}</span>
          </div>

          <button onClick={() => applyAmount(amount + step)} type="button" className="p-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white transition-colors active:scale-95"><Plus className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 justify-center">
          <button onClick={() => applyAmount(max / 2)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Half</button>
          <button onClick={() => applyAmount(max)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>All</button>
        </div>

        <button onClick={() => onConfirm(amount)} disabled={amount <= 0}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-40 ${mode === 'use' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {mode === 'use' ? <Apple className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
          Confirm {mode === 'use' ? 'use' : 'waste'} of {formatQuantity(amount, unit)} {unitLabel(unit)}
        </button>
      </div>
    </Modal>
  );
}