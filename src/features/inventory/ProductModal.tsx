import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Product } from '../../types';
import { availableProducts } from '../../data/productsCatalog';
import { getIconForCategory } from '../../utils/categoryUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  theme: any;
}

export function ProductModal({ isOpen, onClose, onAddProduct, theme }: ProductModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Product to Inventory" theme={theme}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableProducts.map((product, idx) => {
          const Icon = getIconForCategory(product.category);
          return (
            <button
              key={idx}
              onClick={() => onAddProduct(product)}
              className={`${theme.hover} border ${theme.card.includes('slate-800') ? 'border-slate-700' : 'border-slate-200'} rounded-xl p-4 text-left transition-all hover:shadow-lg`}
            >
              <Icon className={`w-8 h-8 ${theme.accent} mb-2`} />
              <div className={`font-semibold ${theme.text}`}>{product.name}</div>
              <div className={`text-xs ${theme.textMuted}`}>{product.category}</div>
              <div className={`text-xs ${theme.textMuted} mt-1`}>Expires in {product.defaultExpiry} days</div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}