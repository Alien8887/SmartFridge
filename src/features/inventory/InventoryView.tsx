import React, { useState } from 'react';
import { Package, Clock, PlusCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProductModal } from './ProductModal';
import { InventoryItem, Product } from '../../types';
import { getExpiryWarning, getFreshnessColor } from '../../utils/expiryUtils';
import { getIconForCategory } from '../../utils/categoryUtils';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddProduct: (product: Product) => void;
  darkMode: boolean;
  theme: any;
}

export function InventoryView({ inventory, onAddProduct, darkMode, theme }: InventoryViewProps) {
  const [showAddProduct, setShowAddProduct] = useState(false);

  const handleAddProduct = (product: Product) => {
    onAddProduct(product);
    setShowAddProduct(false);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className={theme.card}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className={`text-lg md:text-xl font-bold ${theme.text} flex items-center gap-2`}>
            <Package className="w-5 md:w-6 h-5 md:h-6" /> Live Inventory ({inventory.length} items)
          </h3>
          <Button
            onClick={() => setShowAddProduct(true)}
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        </div>
        
        <div className="space-y-3">
          {inventory.map(item => {
            const warning = getExpiryWarning(item.expiry);
            const Icon = getIconForCategory(item.category);
            return (
              <div key={item.id} className={`${theme.hover} rounded-xl p-3 md:p-4 border ${darkMode ? 'border-slate-700' : 'border-slate-200'} transition-all`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${warning.color} ${warning.glow} shadow-lg flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${theme.text} truncate`}>{item.name}</div>
                      <div className={`text-xs md:text-sm ${theme.textMuted}`}>{item.category} • {item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs md:text-sm font-bold ${getFreshnessColor(item.freshness, darkMode)}`}>
                      {item.freshness}%
                    </div>
                    <div className={`text-xs ${theme.textMuted} flex items-center gap-1 justify-end mt-1`}>
                      <Clock className="w-3 h-3" />
                      {item.expiry}d
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${warning.color} transition-all duration-500`}
                    style={{ width: `${item.freshness}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <ProductModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onAddProduct={handleAddProduct}
        theme={theme}
      />
    </div>
  );
}