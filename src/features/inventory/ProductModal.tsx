import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Product, Theme } from '../../types';
import { CATEGORIES, getIconForCategory, getCategoryColors } from '../../utils/categoryUtils';

interface ProductModalProps { onAdd: (product: Product, quantityAmount: number, quantityUnit: string) => void; onClose: () => void; darkMode: boolean; theme: Theme; }

const UNITS = ['pcs', 'g', 'kg', 'ml', 'L'];
const selectClass = (isDark: boolean) => `w-full px-4 py-2 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'}`;

export function ProductModal({ onAdd, onClose, darkMode, theme }: ProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [expiryDate, setExpiryDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Product name is required';
    if (!expiryDate) e.expiryDate = 'Expiry date is required';
    const amt = Number(amount);
    if (!amt || amt <= 0) e.amount = 'Enter a quantity greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const expiry = new Date(expiryDate);
    const defaultExpiry = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 86_400_000));
    onAdd({ name: name.trim(), category, defaultExpiry }, Number(amount), unit);
    onClose();
  };

  return (
    <Modal isOpen title="Add new product" onClose={onClose} theme={theme}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Product name *" type="text" placeholder="e.g. Chicken Breast" value={name} onChange={e => setName(e.target.value)} error={errors.name} isDark={darkMode} />

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category *</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => {
              const Icon = getIconForCategory(cat);
              const colors = getCategoryColors(cat);
              const selected = category === cat;
              return (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                    selected ? `border-sky-500 ${darkMode ? 'bg-sky-500/15' : colors.bg}` : darkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <Icon className={`w-5 h-5 ${selected ? 'text-sky-400' : darkMode ? 'text-slate-300' : colors.text}`} />
                  <span className={`text-xs font-medium ${selected ? (darkMode ? 'text-sky-300' : colors.text) : darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Quantity *</label>
            <input type="number" min="0" step="0.1" value={amount} onChange={e => setAmount(e.target.value)} className={selectClass(darkMode)} />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className={selectClass(darkMode)}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Expiry date *</label>
          <input type="date" value={expiryDate} min={today} onChange={e => setExpiryDate(e.target.value)} className={selectClass(darkMode)} />
          {errors.expiryDate && <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>}
        </div>

        <div className={`flex gap-3 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <Button type="button" variant="ghost" isDark={darkMode} fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" fullWidth>Add product</Button>
        </div>
      </form>
    </Modal>
  );
}