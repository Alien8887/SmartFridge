import React, { useState } from 'react';
import { Package, PenLine, ChevronLeft, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Product, Theme } from '../../types';
import { CATEGORIES, getIconForCategory, getCategoryColors, groupByCategory } from '../../utils/categoryUtils';
import { availableProducts } from '../../data/productsCatalog';
import { unitLabel, sanitizeAmount } from '../../utils/unitUtils';
interface ProductModalProps { onAdd: (product: Product, quantityAmount: number, quantityUnit: string) => void; onClose: () => void; darkMode: boolean; theme: Theme; }

const UNITS = ['pcs', 'g', 'kg', 'ml', 'L'];
const selectClass = (isDark: boolean) => `w-full px-4 py-2 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-slate-900'}`;

export function ProductModal({ onAdd, onClose, darkMode, theme }: ProductModalProps) {
  const [tab, setTab] = useState<'quick' | 'custom'>('quick');

  // ── Quick Add state ────────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickAmount, setQuickAmount] = useState('1');
  const [quickUnit, setQuickUnit] = useState('pcs');
  const groupedCatalog = groupByCategory(availableProducts.map(p => ({ ...p, category: p.category })) as any);

  const handleQuickConfirm = () => {
    if (!selectedProduct) return;
    const amt = sanitizeAmount(Number(quickAmount) || 1, quickUnit);
    onAdd(selectedProduct, amt, quickUnit);
    onClose();
  };

  // ── Custom state (unchanged full manual entry) ─────────────────────────
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [amount, setAmount] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [expiryDate, setExpiryDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const today = new Date().toISOString().split('T')[0];

  const validateCustom = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Product name is required';
    if (!expiryDate) e.expiryDate = 'Expiry date is required';
    const amt = Number(amount);
    if (!amt || amt <= 0) e.amount = 'Enter a quantity greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCustom()) return;
    const expiry = new Date(expiryDate);
    const defaultExpiry = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 86_400_000));
    onAdd({ name: name.trim(), category, defaultExpiry }, sanitizeAmount(Number(amount), unit), unit);
    onClose();
  };

  return (
    <Modal isOpen title="Add new product" onClose={onClose} theme={theme}>
      <div className="space-y-5">
        <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <button type="button" onClick={() => { setTab('quick'); setSelectedProduct(null); }} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'quick' ? 'bg-sky-500 text-white' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}><Package className="w-4 h-4" /> Quick Add</button>
          <button type="button" onClick={() => setTab('custom')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${tab === 'custom' ? 'bg-sky-500 text-white' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}><PenLine className="w-4 h-4" /> Custom</button>
        </div>

        {tab === 'quick' && (
          <div className="animate-fade-in">
            {!selectedProduct ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {Object.entries(groupedCatalog).map(([cat, items]) => {
                  const CatIcon = getIconForCategory(cat);
                  return (
                    <div key={cat}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${theme.textMuted}`}><CatIcon className="w-3.5 h-3.5" /> {cat}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {(items as Product[]).map(p => (
                          <button key={p.name} type="button" onClick={() => { setSelectedProduct(p); setQuickUnit(p.defaultUnit || 'pcs'); }}
                            className={`p-2 rounded-lg border text-xs font-medium text-center transition-colors ${darkMode ? 'border-slate-700 hover:border-sky-500 hover:bg-sky-500/10 text-slate-200' : 'border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700'}`}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 animate-scale-in">
                <button type="button" onClick={() => setSelectedProduct(null)} className={`text-xs flex items-center gap-1 ${theme.textMuted} hover:${theme.text}`}><ChevronLeft className="w-3.5 h-3.5" /> Back to list</button>

                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <p className={`font-semibold ${theme.text}`}>{selectedProduct.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{selectedProduct.category} · expires in {selectedProduct.defaultExpiry} days from today</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Quantity</label>
                    <input type="number" min="0" step="0.1" value={quickAmount} onChange={e => setQuickAmount(e.target.value)} className={selectClass(darkMode)} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Unit</label>
                    <select value={quickUnit} onChange={e => setQuickUnit(e.target.value)} className={selectClass(darkMode)}>
                      {UNITS.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}
                    </select>
                  </div>
                </div>

                <Button variant="primary" fullWidth onClick={handleQuickConfirm}><Plus className="w-4 h-4" /> Add to fridge</Button>
              </div>
            )}
          </div>
        )}

        {tab === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="space-y-5 animate-fade-in">
            <Input label="Product name *" type="text" placeholder="e.g. Homemade lasagna" value={name} onChange={e => setName(e.target.value)} error={errors.name} isDark={darkMode} />

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Category *</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = getIconForCategory(cat);
                  const colors = getCategoryColors(cat);
                  const selected = category === cat;
                  return (
                    <button key={cat} type="button" onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${selected ? `border-sky-500 ${darkMode ? 'bg-sky-500/15' : colors.bg}` : darkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}>
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
                <select value={unit} onChange={e => setUnit(e.target.value)} className={selectClass(darkMode)}>{UNITS.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}</select>
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
        )}
      </div>
    </Modal>
  );
}