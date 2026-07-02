import { useState, useCallback, useEffect, useRef } from 'react';
import { InventoryItem, Product } from '../types';
import { getDaysUntilExpiry } from '../utils/expiryUtils';

const BASE = process.env.REACT_APP_API_URL || '';

function storageKey(username: string) { return `smart-fridge-inventory:${username}`; }

function loadFromStorage(username: string): InventoryItem[] {
  if (!username) return [];
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (!raw) return [];
    const items = JSON.parse(raw) as any[];
    return items.map(i => {
      if (typeof i.quantityAmount === 'number') return i as InventoryItem;
      const match = String(i.quantity ?? '1').match(/^([\d.]+)\s*([a-zA-Z]*)/);
      return {
        ...i,
        quantityAmount: match ? parseFloat(match[1]) || 1 : 1,
        quantityUnit: match && match[2] ? match[2] : 'pcs',
      } as InventoryItem;
    });
  } catch { return []; }
}
function saveToStorage(username: string, items: InventoryItem[]): void {
  if (!username) return;
  try { localStorage.setItem(storageKey(username), JSON.stringify(items)); } catch { /* ignore */ }
}

async function postServerItem(item: InventoryItem, token: string) {
  try {
    await fetch(`${BASE}/api/inventory-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: item.id, name: item.name, category: item.category, expiry: item.expiry, quantityAmount: item.quantityAmount, quantityUnit: item.quantityUnit }),
    });
  } catch { /* ignore */ }
}
async function patchServerQuantity(id: number, quantityAmount: number, token: string) {
  try {
    await fetch(`${BASE}/api/inventory-db`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, quantityAmount }),
    });
  } catch { /* ignore */ }
}
async function deleteServerItem(id: number, token: string) {
  try { await fetch(`${BASE}/api/inventory-db?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignore */ }
}

export function useInventory(token: string, username: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedForUser = useRef<string | null>(null);

  const persist = useCallback((updater: (prev: InventoryItem[]) => InventoryItem[]) => {
    setInventory(prev => { const next = updater(prev); saveToStorage(username, next); return next; });
  }, [username]);

  useEffect(() => {
    if (!username) { setInventory([]); setLoading(false); return; }
    if (loadedForUser.current === username) return;
    loadedForUser.current = username;
    setInventory([]);
    setLoading(true);

    const cached = loadFromStorage(username);
    if (cached.length) setInventory(cached);

    if (!token) { setLoading(false); return; }

    (async () => {
      try {
        const r = await fetch(`${BASE}/api/inventory-db`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error('fetch failed');
        const serverData: InventoryItem[] = await r.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          setInventory(serverData);
          saveToStorage(username, serverData);
        } else if (cached.length > 0) {
          for (const item of cached) await postServerItem(item, token);
        }
      } catch { /* offline — keep local cache */ }
      finally { setLoading(false); }
    })();
  }, [username, token]);

  const addProduct = useCallback((product: Product, quantityAmount: number, quantityUnit: string) => {
    persist(prev => {
      const idx = prev.findIndex(i =>
        i.name.toLowerCase() === product.name.toLowerCase() &&
        i.category === product.category &&
        i.quantityUnit === quantityUnit &&
        getDaysUntilExpiry(i.expiry, i.addedDate) > 0
      );
      if (idx !== -1) {
        const merged = { ...prev[idx], quantityAmount: prev[idx].quantityAmount + quantityAmount };
        if (token) patchServerQuantity(merged.id, merged.quantityAmount, token);
        const next = [...prev]; next[idx] = merged; return next;
      }
      const newItem: InventoryItem = {
        id: Date.now(), name: product.name, category: product.category,
        expiry: product.defaultExpiry, quantityAmount, quantityUnit,
        addedDate: Date.now(), freshness: 100,
      };
      if (token) postServerItem(newItem, token);
      return [newItem, ...prev];
    });
  }, [persist, token]);

  /** Reduces quantityAmount by amountUsed; removes the item entirely once it hits 0.
   *  Named `consumeItem`, not `useItem` — ESLint's react-hooks rule treats ANY
   *  identifier matching /^use[A-Z]/ as a Hook by naming convention alone,
   *  regardless of what it actually does, which broke the build. */
  const consumeItem = useCallback((id: number, amountUsed: number) => {
    persist(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const remaining = Math.max(0, prev[idx].quantityAmount - amountUsed);
      if (remaining <= 0) {
        if (token) deleteServerItem(id, token);
        return prev.filter(i => i.id !== id);
      }
      if (token) patchServerQuantity(id, remaining, token);
      const next = [...prev]; next[idx] = { ...prev[idx], quantityAmount: remaining }; return next;
    });
  }, [persist, token]);

  const wasteItem = useCallback((id: number) => {
    persist(prev => { if (token) deleteServerItem(id, token); return prev.filter(i => i.id !== id); });
  }, [persist, token]);

  const removeExpiredItems = useCallback(() => {
    persist(prev => prev.filter(item => getDaysUntilExpiry(item.expiry, item.addedDate) > 0));
  }, [persist]);

  return { inventory, loading, addProduct, consumeItem, wasteItem, removeExpiredItems };
}