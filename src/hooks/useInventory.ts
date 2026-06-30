import { useState, useCallback, useEffect, useRef } from 'react';
import { InventoryItem, Product } from '../types';
import { calculateFreshness, getDaysUntilExpiry } from '../utils/expiryUtils';

const BASE = process.env.REACT_APP_API_URL || '';
const STORAGE_KEY = 'smart-fridge-inventory';

function loadFromStorage(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultInventory();
    const items = JSON.parse(raw) as InventoryItem[];
    return items.map(item => ({ ...item, freshness: calculateFreshness(item.expiry, item.addedDate) }));
  } catch { return getDefaultInventory(); }
}
function saveToStorage(items: InventoryItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}
function getDefaultInventory(): InventoryItem[] {
  const now = Date.now(); const day = 86_400_000;
  return [
    { id: 1, name: 'Fresh Milk',     category: 'Dairy',      expiry: 5,  quantity: '1L',   addedDate: now - day,     freshness: 80  },
    { id: 2, name: 'Chicken Breast', category: 'Meat',       expiry: 3,  quantity: '500g', addedDate: now - day,     freshness: 66  },
    { id: 3, name: 'Broccoli',       category: 'Vegetables', expiry: 5,  quantity: '1x',   addedDate: now - 2 * day, freshness: 60  },
    { id: 4, name: 'Greek Yogurt',   category: 'Dairy',      expiry: 7,  quantity: '200g', addedDate: now,           freshness: 100 },
    { id: 5, name: 'Apples',         category: 'Fruits',     expiry: 14, quantity: '6x',   addedDate: now - 3 * day, freshness: 79  },
  ];
}

export function useInventory(token: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromStorage());
  const [loading, setLoading] = useState(true);
  const migratedRef = useRef(false);

  const persist = useCallback((updater: (prev: InventoryItem[]) => InventoryItem[]) => {
    setInventory(prev => { const next = updater(prev); saveToStorage(next); return next; });
  }, []);

  // Re-fires correctly on login because `token` is a real dependency value.
  // If the account already has server data, that becomes the source of truth.
  // If it's empty (brand-new account), the current local items are pushed up
  // once so nothing from a prior offline session is lost.
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    if (migratedRef.current) return;
    migratedRef.current = true;

    (async () => {
      try {
        const r = await fetch(`${BASE}/api/inventory-db`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error('fetch failed');
        const serverData: InventoryItem[] = await r.json();

        if (Array.isArray(serverData) && serverData.length > 0) {
          const withFreshness = serverData.map(i => ({ ...i, freshness: calculateFreshness(i.expiry, i.addedDate) }));
          setInventory(withFreshness);
          saveToStorage(withFreshness);
        } else {
          const local = loadFromStorage();
          for (const item of local) {
            await fetch(`${BASE}/api/inventory-db`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ id: item.id, name: item.name, category: item.category, expiry: item.expiry, quantity: item.quantity }),
            });
          }
        }
      } catch { /* offline — keep local cache */ }
      finally { setLoading(false); }
    })();
  }, [token]);

  const addProduct = useCallback((product: Product, quantity = '1x'): InventoryItem => {
    const newItem: InventoryItem = {
      id: Date.now(), name: product.name, category: product.category,
      expiry: product.defaultExpiry, quantity, addedDate: Date.now(), freshness: 100,
    };
    persist(prev => [newItem, ...prev]);
    if (token) {
      fetch(`${BASE}/api/inventory-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: newItem.id, name: newItem.name, category: newItem.category, expiry: newItem.expiry, quantity: newItem.quantity }),
      }).catch(() => {});
    }
    return newItem;
  }, [persist, token]);

  const removeProduct = useCallback((itemId: number) => {
    persist(prev => prev.filter(item => item.id !== itemId));
    if (token) {
      fetch(`${BASE}/api/inventory-db?id=${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  }, [persist, token]);

  const removeExpiredItems = useCallback(() => {
    persist(prev => prev.filter(item => getDaysUntilExpiry(item.expiry, item.addedDate) > 0));
  }, [persist]);

  return { inventory, loading, addProduct, removeProduct, removeExpiredItems };
}