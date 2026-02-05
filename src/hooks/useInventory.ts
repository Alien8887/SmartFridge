import { useState, useEffect } from 'react';
import { InventoryItem, Product } from '../types';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 1, name: 'Fresh Milk', category: 'Dairy', expiry: 2, quantity: '1L', freshness: 85 },
    { id: 2, name: 'Greek Yogurt', category: 'Dairy', expiry: 5, quantity: '500g', freshness: 92 },
    { id: 3, name: 'Chicken Breast', category: 'Meat', expiry: 1, quantity: '800g', freshness: 70 },
    { id: 4, name: 'Broccoli', category: 'Vegetables', expiry: 3, quantity: '400g', freshness: 88 },
    { id: 5, name: 'Strawberries', category: 'Fruits', expiry: 2, quantity: '300g', freshness: 78 },
    { id: 6, name: 'Cheese Block', category: 'Dairy', expiry: 14, quantity: '250g', freshness: 95 },
    { id: 7, name: 'Orange Juice', category: 'Beverages', expiry: 4, quantity: '1L', freshness: 90 },
    { id: 8, name: 'Eggs', category: 'Dairy', expiry: 7, quantity: '12pcs', freshness: 94 },
    { id: 9, name: 'Carrots', category: 'Vegetables', expiry: 8, quantity: '500g', freshness: 96 },
    { id: 10, name: 'Bananas', category: 'Fruits', expiry: 3, quantity: '6pcs', freshness: 82 },
    { id: 11, name: 'Spinach', category: 'Vegetables', expiry: 2, quantity: '200g', freshness: 75 },
    { id: 12, name: 'Ground Beef', category: 'Meat', expiry: 1, quantity: '500g', freshness: 68 }
  ]);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = () => {
    try {
      const inventoryData = localStorage.getItem('inventory');
      if (inventoryData) {
        setInventory(JSON.parse(inventoryData));
      }
    } catch (error) {
      console.log('No stored inventory');
    }
  };

  const addProduct = (product: Product) => {
    const newProduct: InventoryItem = {
      id: Date.now(),
      name: product.name,
      category: product.category,
      expiry: product.defaultExpiry,
      quantity: '1x',
      freshness: 100
    };
    const updatedInventory = [...inventory, newProduct];
    setInventory(updatedInventory);
    try {
      localStorage.setItem('inventory', JSON.stringify(updatedInventory));
    } catch (error) {
      console.error('Failed to save inventory');
    }
  };

  return { inventory, addProduct };
}