import { useState, useCallback, useEffect, useRef } from 'react';
import { InventoryItem, Product } from '../types';
import { getDaysUntilExpiry } from '../utils/expiryUtils';
import { roundTo } from '../utils/numberUtils';

const BASE = process.env.REACT_APP_API_URL || '';

let idCounter = 0;
function generateId(): number {
  idCounter = (idCounter + 1) % 1000;
  return Date.now() * 1000 + idCounter;
}

function storageKey(username: string) { return `smart-fridge-inventory:${username}`; }

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
    id: typeof raw?.id === 'number' && Number.isFinite(raw.id) ? raw.id : generateId(),
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name : 'Unknown item',
    category: typeof raw?.category === 'string' && raw.category ? raw.category : 'Other',
    expiry: typeof raw?.expiry === 'number' && Number.isFinite(raw.expiry) && raw.expiry > 0 ? raw.expiry : 7,
    quantityAmount: roundTo(amount, 3),
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
async function postServerItemsBatch(items: InventoryItem[], token: string) {
  try { await fetch(`${BASE}/api/user-data?resource=inventory-batch`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items: items.map(i => ({ id: i.id, name: i.name, category: i.category, expiry: i.expiry, quantityAmount: i.quantityAmount, quantityUnit: i.quantityUnit })) }) }); } catch { /* ignore */ }
}

export function useInventory(token: string, username: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Distinguishes "brand-new account with genuinely nothing yet" from "the
  // request actually failed" — both used to look IDENTICAL on screen
  // because every catch block was silent.
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedForUser = useRef<string | null>(null);

  const persist = useCallback((updater: (prev: InventoryItem[]) => InventoryItem[]) => {
    setInventory(prev => { const next = updater(prev); saveToStorage(username, next); return next; });
  }, [username]);

  useEffect(() => {
    if (!username) { setInventory([]); setLoading(false); setLoadError(null); return; }
    if (loadedForUser.current === username) return;
    loadedForUser.current = username;
    setInventory([]);
    setLoading(true);
    setLoadError(null);

    const cached = loadFromStorage(username);
    if (cached.length) setInventory(cached);

    if (!token) { setLoading(false); return; }

    (async () => {
      try {
        const r = await fetch(`${BASE}/api/user-data?resource=inventory`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        const raw: any[] = await r.json();
        if (Array.isArray(raw) && raw.length > 0) {
          const sanitized = raw.map(sanitizeItem);
          setInventory(sanitized);
          saveToStorage(username, sanitized);
        } else if (cached.length > 0) {
          for (const item of cached) await postServerItem(item, token);
        }
        // else: genuinely empty for a new account — not an error, loadError stays null
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not reach the server');
        // keep whatever local cache was already shown optimistically above
      } finally {
        setLoading(false);
      }
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
        const merged = { ...prev[idx], quantityAmount: roundTo(prev[idx].quantityAmount + quantityAmount, 3) };
        if (token) patchServerQuantity(merged.id, merged.quantityAmount, token);
        const next = [...prev]; next[idx] = merged; return next;
      }
      const newItem: InventoryItem = { id: generateId(), name: product.name, category: product.category, expiry: product.defaultExpiry, quantityAmount: roundTo(quantityAmount, 3), quantityUnit, addedDate: Date.now(), freshness: 100 };
      if (token) postServerItem(newItem, token);
      return [newItem, ...prev];
    });
  }, [persist, token]);

  /** Adds many products atomically — one batch server request instead of
   *  N concurrent independent ones racing each other. */
  const addProducts = useCallback((items: { product: Product; amount: number; unit: string }[]) => {
    if (items.length === 0) return;
    persist(prev => {
      let next = [...prev];
      const toSendToServer: InventoryItem[] = [];
      for (const { product, amount, unit } of items) {
        const idx = next.findIndex(i =>
          i.name.toLowerCase() === product.name.toLowerCase() &&
          i.category === product.category &&
          i.quantityUnit === unit &&
          getDaysUntilExpiry(i.expiry, i.addedDate) > 0
        );
        if (idx !== -1) {
          const merged = { ...next[idx], quantityAmount: roundTo(next[idx].quantityAmount + amount, 3) };
          next[idx] = merged;
          if (token) patchServerQuantity(merged.id, merged.quantityAmount, token);
        } else {
          const newItem: InventoryItem = { id: generateId(), name: product.name, category: product.category, expiry: product.defaultExpiry, quantityAmount: roundTo(amount, 3), quantityUnit: unit, addedDate: Date.now(), freshness: 100 };
          next = [newItem, ...next];
          toSendToServer.push(newItem);
        }
      }
      if (token && toSendToServer.length > 0) postServerItemsBatch(toSendToServer, token);
      return next;
    });
  }, [persist, token]);

  const consumeItem = useCallback((id: number, amountUsed: number) => {
    persist(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const remaining = roundTo(Math.max(0, prev[idx].quantityAmount - amountUsed), 3);
      if (remaining <= 0) { if (token) deleteServerItem(id, token); return prev.filter(i => i.id !== id); }
      if (token) patchServerQuantity(id, remaining, token);
      const next = [...prev]; next[idx] = { ...prev[idx], quantityAmount: remaining }; return next;
    });
  }, [persist, token]);

  const wasteItem = useCallback((id: number, amountWasted: number) => {
    persist(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const remaining = roundTo(Math.max(0, prev[idx].quantityAmount - amountWasted), 3);
      if (remaining <= 0) { if (token) deleteServerItem(id, token); return prev.filter(i => i.id !== id); }
      if (token) patchServerQuantity(id, remaining, token);
      const next = [...prev]; next[idx] = { ...prev[idx], quantityAmount: remaining }; return next;
    });
  }, [persist, token]);

  const removeExpiredItems = useCallback(() => {
    persist(prev => prev.filter(item => getDaysUntilExpiry(item.expiry, item.addedDate) > 0));
  }, [persist]);

  const resetInventory = useCallback(async () => {
    setInventory([]);
    saveToStorage(username, []);
    if (token) { try { await fetch(`${BASE}/api/user-data?resource=reset`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ target: 'inventory' }) }); } catch { /* local reset already applied */ } }
  }, [username, token]);

  return { inventory, loading, loadError, addProduct, addProducts, consumeItem, wasteItem, removeExpiredItems, resetInventory };
}