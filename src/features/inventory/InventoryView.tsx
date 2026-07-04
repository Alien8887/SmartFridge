import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter, Clock, AlertTriangle, CheckCircle, Package, Trash2, Apple } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SortMenu } from '../../components/ui/SortMenu';
import { QuantityStepper } from '../../components/ui/QuantityStepper';
import { FreshnessRing } from '../../components/ui/FreshnessRing';
import { ProductModal } from './ProductModal';
import { InventoryItem, Product, Theme } from '../../types';
import { groupByCategory, getIconForCategory, getCategoryColors, getAvailableCategories } from '../../utils/categoryUtils';
import { getItemStatus, getDaysUntilExpiry } from '../../utils/expiryUtils';
import { formatQuantity, unitLabel } from '../../utils/unitUtils';
import { TopItem } from '../../hooks/useConsumption';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddProduct: (product: Product, quantityAmount: number, quantityUnit: string) => void;
  onConsume: (id: number, amount: number) => void;
  onWaste: (id: number) => void;
  loading: boolean;
  topItems?: TopItem[];
  darkMode: boolean;
  theme: Theme;
}

type SortBy = 'expiry' | 'name' | 'category';
type FilterStatus = 'all' | 'expired' | 'expiring' | 'fresh';

const statusColors = {
  fresh:    { ring: 'ring-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-400' },
  expiring: { ring: 'ring-yellow-500/40',  badge: 'bg-yellow-500/20  text-yellow-400'  },
  expired:  { ring: 'ring-red-500/40',     badge: 'bg-red-500/20     text-red-400'     },
} as const;

const SORT_OPTIONS = [{ value: 'expiry', label: 'Expiry' }, { value: 'name', label: 'Name' }, { value: 'category', label: 'Category' }];

export function InventoryView({ inventory, onAddProduct, onConsume, onWaste, loading, topItems = [], darkMode, theme }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('expiry');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStepperId, setActiveStepperId] = useState<number | null>(null);
  const [confirmWasteId, setConfirmWasteId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return inventory
      .filter(item => {
        const q = searchTerm.toLowerCase();
        const matchSearch = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        if (filterStatus === 'all') return matchSearch;
        return matchSearch && getItemStatus(item.expiry, item.addedDate) === filterStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return getDaysUntilExpiry(a.expiry, a.addedDate) - getDaysUntilExpiry(b.expiry, b.addedDate);
      });
  }, [inventory, searchTerm, filterStatus, sortBy]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);
  const categoryOrder = useMemo(() => getAvailableCategories().filter(c => grouped[c]?.length), [grouped]);

  const stats = {
    total: inventory.length,
    fresh: inventory.filter(i => getItemStatus(i.expiry, i.addedDate) === 'fresh').length,
    expiring: inventory.filter(i => getItemStatus(i.expiry, i.addedDate) === 'expiring').length,
    expired: inventory.filter(i => getItemStatus(i.expiry, i.addedDate) === 'expired').length,
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>Inventory</h2>
        <Button onClick={() => setIsModalOpen(true)} variant="primary"><Plus className="w-4 h-4" /> Add product</Button>
      </div>

      {topItems.length > 0 && (
        <div className={`flex items-center gap-2 flex-wrap text-xs ${theme.textMuted}`}>
          <span className="font-medium">You often use:</span>
          {topItems.map(t => <span key={t.name} className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>{t.name}</span>)}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Package className="w-6 h-6" />, val: stats.total, label: 'Total' },
          { icon: <CheckCircle className="w-6 h-6 text-emerald-400" />, val: stats.fresh, label: 'Fresh' },
          { icon: <Clock className="w-6 h-6 text-yellow-400" />, val: stats.expiring, label: 'Expiring' },
          { icon: <AlertTriangle className="w-6 h-6 text-red-400" />, val: stats.expired, label: 'Expired' },
        ].map(s => (
          <div key={s.label} className={`${theme.card} border rounded-xl p-3 text-center card-hover`}>
            <div className="flex justify-center mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${theme.text}`}>{s.val}</div>
            <div className={`text-xs ${theme.textMuted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card className={theme.card}>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
              <Input type="text" placeholder="Search name or category…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} isDark={darkMode} className="pl-9" />
            </div>
            <SortMenu options={SORT_OPTIONS} value={sortBy} onChange={v => setSortBy(v as SortBy)} darkMode={darkMode} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className={`w-4 h-4 ${theme.textMuted}`} />
            {(['all', 'fresh', 'expiring', 'expired'] as FilterStatus[]).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${filterStatus === s ? 'bg-sky-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{s}</button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className={theme.card}><div className="text-center py-10"><div className="w-8 h-8 mx-auto rounded-full border-4 border-sky-500 border-t-transparent animate-spin" /></div></Card>
      ) : filtered.length === 0 ? (
        <Card className={theme.card}><div className="text-center py-12"><Package className={`w-10 h-10 ${theme.textMuted} mx-auto mb-3`} /><p className={`font-medium ${theme.text}`}>No items found</p><p className={`text-sm ${theme.textMuted} mt-1`}>{searchTerm ? 'Try adjusting your search' : 'Add your first product'}</p></div></Card>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map(cat => {
            const items = grouped[cat];
            const CatIcon = getIconForCategory(cat);
            const colors = getCategoryColors(cat);
            return (
              <div key={cat} className="animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`p-1.5 rounded-lg ${darkMode ? 'bg-slate-700' : colors.badge}`}><CatIcon className={`w-4 h-4 ${darkMode ? 'text-slate-200' : colors.text}`} /></span>
                  <h3 className={`font-semibold text-sm ${theme.text}`}>{cat}</h3>
                  <span className={`text-xs ${theme.textMuted}`}>({items.length})</span>
                </div>

                {/* Blocks, not rows — each item is a self-contained square-ish
                    card showing freshness (ring) and amount at a glance. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {items.map(item => {
                    const status = getItemStatus(item.expiry, item.addedDate);
                    const daysLeft = getDaysUntilExpiry(item.expiry, item.addedDate);
                    const freshPct = Math.max(0, Math.min(100, (daysLeft / item.expiry) * 100));
                    const colorSet = statusColors[status];
                    const isStepperOpen = activeStepperId === item.id;
                    const isConfirmingWaste = confirmWasteId === item.id;

                    return (
                      <div key={item.id} className={`card-hover ${theme.card} border rounded-xl p-3 flex flex-col items-center text-center ring-2 ${colorSet.ring}`}>
                        <h4 className={`font-semibold text-sm ${theme.text} truncate w-full mb-1`} title={item.name}>{item.name}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium mb-2 ${colorSet.badge}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>

                        <FreshnessRing percent={freshPct} />

                        <div className="mt-2 mb-1">
                          <p className={`text-sm font-bold ${theme.text}`}>{formatQuantity(item.quantityAmount, item.quantityUnit)} {unitLabel(item.quantityUnit)}</p>
                          <p className={`text-[10px] ${theme.textMuted}`}>{daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}</p>
                        </div>

                        <div className="w-full mt-2">
                          {isStepperOpen ? (
                            <QuantityStepper max={item.quantityAmount} unit={item.quantityUnit} darkMode={darkMode}
                              onConfirm={amt => { onConsume(item.id, amt); setActiveStepperId(null); }} onCancel={() => setActiveStepperId(null)} />
                          ) : isConfirmingWaste ? (
                            <div className="flex flex-col gap-1">
                              <span className={`text-[10px] ${theme.textMuted}`}>Waste all?</span>
                              <div className="flex gap-1">
                                <button onClick={() => { onWaste(item.id); setConfirmWasteId(null); }} className="flex-1 px-2 py-1 rounded-md text-[10px] font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">Confirm</button>
                                <button onClick={() => setConfirmWasteId(null)} className="flex-1 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-600 hover:bg-slate-500 text-white transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1.5">
                              <button onClick={() => setActiveStepperId(item.id)} title="Mark some as used" className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"><Apple className="w-3 h-3" /> Used</button>
                              <button onClick={() => setConfirmWasteId(item.id)} title="Waste what's left" className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 className="w-3 h-3" /> Waste</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && <ProductModal onAdd={onAddProduct} onClose={() => setIsModalOpen(false)} darkMode={darkMode} theme={theme} />}
    </div>
  );
}