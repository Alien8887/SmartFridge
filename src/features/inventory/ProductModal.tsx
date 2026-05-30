import React from 'react';
import { X, Droplets, Beef, Apple } from 'lucide-react';
import { Product } from '../../types';
import { availableProducts } from '../../data/productsCatalog';

export interface ProductModalProps {
  onAdd:    (product: Product, quantity: string) => void;
  onClose:  () => void;
  darkMode: boolean;
  theme:    any;
}

function getIconForCategory(category: string) {
  if (category === 'Dairy' || category === 'Beverages') return Droplets;
  if (category === 'Meat') return Beef;
  return Apple;
}

export function ProductModal({ onAdd, onClose, darkMode, theme }: ProductModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${theme.card} border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${theme.text}`}>Add Product</h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.hover}`} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableProducts.map((product, idx) => {
            const Icon = getIconForCategory(product.category);
            return (
              <button
                key={idx}
                onClick={() => onAdd(product, '1x')}
                className={`${theme.hover} border ${darkMode ? 'border-slate-700' : 'border-slate-200'} rounded-xl p-4 text-left transition-all hover:shadow-lg active:scale-95`}
              >
                <Icon className={`w-8 h-8 ${theme.accent} mb-2`} />
                <div className={`font-semibold text-sm ${theme.text}`}>{product.name}</div>
                <div className={`text-xs ${theme.textMuted}`}>{product.category}</div>
                <div className={`text-xs ${theme.textMuted} mt-1`}>
                  Exp: {product.defaultExpiry}d
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}