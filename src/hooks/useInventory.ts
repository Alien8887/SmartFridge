import { useState, useEffect } from 'react';
import { InventoryItem, Product } from '../types';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('inventory');
      if (raw) {
        const parsed: InventoryItem[] = JSON.parse(raw);
        // Back-compat: add addedDate if missing
        const fixed = parsed.map(item => ({
          ...item,
          addedDate: item.addedDate ?? Date.now()
        }));
        setInventory(fixed);
      }
    } catch {
      console.log('No stored inventory');
    }
  }, []);

  const save = (updated: InventoryItem[]) => {
    setInventory(updated);
    try { localStorage.setItem('inventory', JSON.stringify(updated)); } catch {}
  };

  const addProduct = (product: Product, quantity: string = '1x') => {
    const newProduct: InventoryItem = {
      id:        Date.now(),
      name:      product.name,
      category:  product.category,
      expiry:    product.defaultExpiry,
      quantity,
      freshness: 100,
      addedDate: Date.now(),
    };
    save([...inventory, newProduct]);
  };

  const removeProduct = (id: number) => {
    save(inventory.filter(item => item.id !== id));
  };

  const updateProduct = (id: number, changes: Partial<InventoryItem>) => {
    save(inventory.map(item => item.id === id ? { ...item, ...changes } : item));
  };

  return { inventory, addProduct, removeProduct, updateProduct };
}