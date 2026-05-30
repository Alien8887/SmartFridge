import { useState, useEffect } from 'react';
import { InventoryItem, Product } from '../types';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const inventoryData = localStorage.getItem('inventory');
    if (inventoryData) {
      setInventory(JSON.parse(inventoryData));
    }
  }, []);

  const addProduct = (product: Product) => {
    const newProduct: InventoryItem = {
      id: Date.now(),
      name: product.name,
      category: product.category,
      expiry: product.defaultExpiry,
      quantity: '1x',
      freshness: 100
    };
    const updated = [...inventory, newProduct];
    setInventory(updated);
    localStorage.setItem('inventory', JSON.stringify(updated));
  };

  const removeProduct = (id: number) => {
    const updated = inventory.filter(item => item.id !== id);
    setInventory(updated);
    localStorage.setItem('inventory', JSON.stringify(updated));
  };

  return { inventory, addProduct, removeProduct };
}
