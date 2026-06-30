import React, { useMemo, useState } from 'react';
import { Plus, Search, Filter, Clock, AlertTriangle, CheckCircle, Package, Trash2, Apple, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProductModal } from './ProductModal';
import { InventoryItem, Product, Theme } from '../../types';
import { groupByCategory, getIconForCategory, getCategoryColors, getAvailableCategories } from '../../utils/categoryUtils';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddProduct: (product: Product, quantity: string) => void;
  onConsume: (id: number, category: string) => void;
  onWaste: (id: number, category: string) => void;
  loading: boolean;
  readOnly?: boolean;
  darkMode: boolean;
  theme: Theme;
}

type SortBy = 'expiry' | 'name';
type FilterStatus = 'all' | 'expired' | 'expiring' | 'fresh';

function getDays(item: InventoryItem): number {
  if (!item.addedDate) return item.expiry;
  const elapsed = Math.floor((Date.now() - item.addedDate) / 86_400_000);
  return Math.max(0, item.expiry - elapsed);
}
function getStatus(item: InventoryItem): 'expired' | 'expiring' | 'fresh' {
  const d = getDays(item);
  if (d <= 0) return 'expired';
  if (d <= 3) return 'expiring';
  return 'fresh';
}

const statusColors = {
  fresh:    { border: 'border-l-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400' },
  expiring: { border: 'border-l-yellow-500',  badge: 'bg-yellow-500/20  text-yellow-400'  },
  expired:  { border: 'border-l-red-500',     badge: 'bg-red-500/20     text-red-400'     },
} as const;

function FreshnessBar({ pct, darkMode }: { pct: number; darkMode: boolean }) {
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return <div className={`w-full h-1 rounded-full mt-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}><div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} /></div>;
}

export function InventoryView({ inventory, onAddProduct, onConsume, onWaste, loading, readOnly = false, darkMode, theme }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('expiry');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return inventory
      .filter(item => {
        const q = searchTerm.toLowerCase();
        const matchSearch = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        if (filterStatus === 'all') return matchSearch;
        return matchSearch && getStatus(item) === filterStatus;
      })
      .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : getDays(a) - getDays(b));
  }, [inventory, searchTerm, filterStatus, sortBy]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);
  const categoryOrder = useMemo(() => getAvailableCategories().filter(c => grouped[c]?.length), [grouped]);

  const stats = {
    total: inventory.length,
    fresh: inventory.filter(i => getStatus(i) === 'fresh').length,
    expiring: inventory.filter(i => getStatus(i) === 'expiring').length,
    expired: inventory.filter(i => getStatus(i) === 'expired').length,
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>Inventory</h2>
        {!readOnly && <Button onClick={() => setIsModalOpen(true)} variant="primary"><Plus className="w-4 h-4" /> Add product</Button>}
      </div>

      {readOnly && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${darkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          <Lock className="w-4 h-4 flex-shrink-0" /> Guest accounts are read-only — sign in with a full account to add or remove items.
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
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className={`px-3 py-2 rounded-lg text-sm border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
              <option value="expiry">Sort: expiry</option>
              <option value="name">Sort: name</option>
            </select>
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
        <Card className={theme.card}>
          <div className="text-center py-12">
            <Package className={`w-10 h-10 ${theme.textMuted} mx-auto mb-3`} />
            <p className={`font-medium ${theme.text}`}>No items found</p>
            <p className={`text-sm ${theme.textMuted} mt-1`}>{searchTerm ? 'Try adjusting your search' : 'Add your first product'}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {categoryOrder.map(cat => {
            const items = grouped[cat];
            const CatIcon = getIconForCategory(cat);
            const colors = getCategoryColors(cat);
            return (
              <div key={cat} className="animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1.5 rounded-lg ${darkMode ? 'bg-slate-700' : colors.badge}`}><CatIcon className={`w-4 h-4 ${darkMode ? 'text-slate-200' : colors.text}`} /></span>
                  <h3 className={`font-semibold text-sm ${theme.text}`}>{cat}</h3>
                  <span className={`text-xs ${theme.textMuted}`}>({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map(item => {
                    const status = getStatus(item);
                    const daysLeft = getDays(item);
                    const colorSet = statusColors[status];
                    const freshPct = item.freshness ?? Math.max(0, Math.min(100, (daysLeft / item.expiry) * 100));
                    return (
                      <div key={item.id} className={`card-hover ${theme.card} border border-l-4 ${colorSet.border} rounded-xl p-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className={`font-semibold ${theme.text} truncate`}>{item.name}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorSet.badge}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div><span className={theme.textMuted}>Qty</span><p className={`font-medium ${theme.text}`}>{item.quantity}</p></div>
                              <div><span className={theme.textMuted}>Expires</span><p className={`font-medium ${status === 'fresh' ? 'text-emerald-400' : status === 'expiring' ? 'text-yellow-400' : 'text-red-400'}`}>{daysLeft > 0 ? `${daysLeft}d` : 'Expired'}</p></div>
                            </div>
                            <div className="mt-1"><span className={`text-xs ${theme.textMuted}`}>Freshness</span><FreshnessBar pct={freshPct} darkMode={darkMode} /></div>
                          </div>

                          {!readOnly && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => onConsume(item.id, item.category)} title="Mark as consumed" className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                                <Apple className="w-3.5 h-3.5" /> Used
                              </button>
                              <button onClick={() => onWaste(item.id, item.category)} title="Mark as wasted" className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Waste
                              </button>
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

      {isModalOpen && !readOnly && <ProductModal onAdd={onAddProduct} onClose={() => setIsModalOpen(false)} darkMode={darkMode} theme={theme} />}
    </div>
  );
}