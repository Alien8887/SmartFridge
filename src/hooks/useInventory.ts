import { useState, useCallback, useEffect, useRef } from 'react';
import { InventoryItem, Product } from '../types';
import { getDaysUntilExpiry } from '../utils/expiryUtils';

const BASE = process.env.REACT_APP_API_URL || '';

function storageKey(username: string) { return `smart-fridge-inventory:${username}`; }

/** Runs on EVERY item from EVERY source (localStorage and server) — this is
 *  what makes a NaN quantity structurally impossible from here on. */
function sanitizeItem(raw: any): InventoryItem {
  const rawAmount = raw?.quantityAmount;
  const validAmount = typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0;
  const amount = validAmount ? rawAmount : (() => {
    const match = String(raw?.quantity ?? '1').match(/^([\d.]+)/);
    const parsed = match ? parseFloat(match[1]) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  })();

  const rawUnit = raw?.quantityUnit;
  const validUnit = typeof rawUnit === 'string' && rawUnit.trim().length > 0;
  const unit = validUnit ? rawUnit : (() => {
    const match = String(raw?.quantity ?? '').match(/[a-zA-Z]+$/);
    return match ? match[0] : 'pcs';
  })();

  return {
    id: typeof raw?.id === 'number' ? raw.id : Date.now(),
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name : 'Unknown item',
    category: typeof raw?.category === 'string' && raw.category ? raw.category : 'Other',
    expiry: typeof raw?.expiry === 'number' && Number.isFinite(raw.expiry) && raw.expiry > 0 ? raw.expiry : 7,
    quantityAmount: amount,
    quantityUnit: unit,
    freshness: typeof raw?.freshness === 'number' && Number.isFinite(raw.freshness) ? raw.freshness : 100,
    addedDate: typeof raw?.addedDate === 'number' && Number.isFinite(raw.addedDate) ? raw.addedDate : Date.now(),
  };
}

function loadFromStorage(username: string): InventoryItem[] {
  if (!username) return [];
  try { const raw = localStorage.getItem(storageKey(username)); if (!raw) return []; return (JSON.parse(raw) as any[]).map(sanitizeItem); }
  catch { return []; }
}
function saveToStorage(username: string, items: InventoryItem[]): void {
  if (!username) return;
  try { localStorage.setItem(storageKey(username), JSON.stringify(items)); } catch { /* ignore */ }
}

async function postServerItem(item: InventoryItem, token: string) {
  try { await fetch(`${BASE}/api/user-data?resource=inventory`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: item.id, name: item.name, category: item.category, expiry: item.expiry, quantityAmount: item.quantityAmount, quantityUnit: item.quantityUnit }) }); } catch { /* ignore */ }
}
async function patchServerQuantity(id: number, quantityAmount: number, token: string) {
  try { await fetch(`${BASE}/api/user-data?resource=inventory`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, quantityAmount }) }); } catch { /* ignore */ }
}
async function deleteServerItem(id: number, token: string) {
  try { await fetch(`${BASE}/api/user-data?resource=inventory&id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); } catch { /* ignore */ }
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
        const r = await fetch(`${BASE}/api/user-data?resource=inventory`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error('fetch failed');
        const raw: any[] = await r.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const sanitized = raw.map(sanitizeItem); // ← server data is now sanitized too
          setInventory(sanitized);
          saveToStorage(username, sanitized);
        } else if (cached.length > 0) {
          for (const item of cached) await postServerItem(item, token);
        }
      } catch { /* offline — keep local cache */ }
      finally { setLoading(false); }
    })();
  }, [username, token]);

  const addProduct = useCallback((product: Product, quantityAmount: number, quantityUnit: string) => {
    persist(prev => {
      const idx = prev.findIndex(i => i.name.toLowerCase() === product.name.toLowerCase() && i.category === product.category && i.quantityUnit === quantityUnit && getDaysUntilExpiry(i.expiry, i.addedDate) > 0);
      if (idx !== -1) {
        const merged = { ...prev[idx], quantityAmount: prev[idx].quantityAmount + quantityAmount };
        if (token) patchServerQuantity(merged.id, merged.quantityAmount, token);
        const next = [...prev]; next[idx] = merged; return next;
      }
      const newItem: InventoryItem = { id: Date.now(), name: product.name, category: product.category, expiry: product.defaultExpiry, quantityAmount, quantityUnit, addedDate: Date.now(), freshness: 100 };
      if (token) postServerItem(newItem, token);
      return [newItem, ...prev];
    });
  }, [persist, token]);

  const consumeItem = useCallback((id: number, amountUsed: number) => {
    persist(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const remaining = Math.max(0, prev[idx].quantityAmount - amountUsed);
      if (remaining <= 0) { if (token) deleteServerItem(id, token); return prev.filter(i => i.id !== id); }
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

  /** Safe reset — wipes this user's inventory locally and server-side. */
  const resetInventory = useCallback(async () => {
    setInventory([]);
    saveToStorage(username, []);
    if (token) { try { await fetch(`${BASE}/api/user-data?resource=reset`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ target: 'inventory' }) }); } catch { /* local reset already applied */ } }
  }, [username, token]);

  return { inventory, loading, addProduct, consumeItem, wasteItem, removeExpiredItems, resetInventory };
}