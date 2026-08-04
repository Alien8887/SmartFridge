const { redis } = require('../lib/redis');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
async function getUser(req) { const auth = (req.headers.authorization || '').slice(7); const session = await redis.get(`session:${auth}`); return session && Date.now() < session.expiresAt ? session.username : null; }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function emptyWeek() { return DAYS.map(day => ({ day, dairy: 0, meat: 0, vegetables: 0, fruits: 0 })); }

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = req.query.resource;

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    if (resource === 'inventory') {
      const key = `inventory:${username}`;
      if (req.method === 'GET') { const data = await redis.get(key); return res.status(200).json(Array.isArray(data) ? data : []); }
      if (req.method === 'POST') {
        const { id, name, category, expiry, quantityAmount, quantityUnit } = req.body || {};
        const existing = await redis.get(key);
        const list = Array.isArray(existing) ? existing : [];
        const newItem = { id: typeof id === 'number' ? id : Date.now(), name: (name || '').trim(), category: category || 'Other', expiry: Number(expiry) || 7, quantityAmount: Number(quantityAmount) || 1, quantityUnit: quantityUnit || 'pcs', freshness: 100, addedDate: Date.now() };
        await redis.set(key, [newItem, ...list]);
        return res.status(201).json(newItem);
      }
      if (req.method === 'PATCH') {
        const { id, quantityAmount } = req.body || {};
        if (typeof id !== 'number' || typeof quantityAmount !== 'number') return res.status(400).json({ error: 'id and quantityAmount are required' });
        const existing = await redis.get(key);
        const list = Array.isArray(existing) ? existing : [];
        const idx = list.findIndex(i => i.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Item not found' });
        list[idx] = { ...list[idx], quantityAmount };
        await redis.set(key, list);
        return res.status(200).json(list[idx]);
      }
      if (req.method === 'DELETE') {
        const id = Number(req.query.id);
        const existing = await redis.get(key);
        const list = Array.isArray(existing) ? existing : [];
        await redis.set(key, list.filter(i => i.id !== id));
        return res.status(200).json({ success: true });
      }
    }

    // ── NEW (issue 4): batch inventory add — ONE read-modify-write for
    // the whole batch. "Add all" in Shopping List previously fired N
    // independent concurrent POSTs, each doing its own read-modify-write
    // on the same list — concurrent requests raced each other, and
    // whichever finished last silently overwrote the others' additions.
    if (resource === 'inventory-batch' && req.method === 'POST') {
      const { items } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items array is required' });
      const key = `inventory:${username}`;
      const existing = await redis.get(key);
      const list = Array.isArray(existing) ? existing : [];
      const newItems = items.map((it, i) => ({
        id: typeof it.id === 'number' ? it.id : Date.now() * 1000 + i,
        name: (it.name || '').trim(), category: it.category || 'Other',
        expiry: Number(it.expiry) || 7, quantityAmount: Number(it.quantityAmount) || 1,
        quantityUnit: it.quantityUnit || 'pcs', freshness: 100, addedDate: Date.now(),
      }));
      await redis.set(key, [...newItems, ...list]);
      return res.status(201).json({ success: true, items: newItems });
    }

    if (resource === 'reset' && req.method === 'POST') {
      const { target } = req.body || {};
      if (target === 'inventory') await redis.del(`inventory:${username}`);
      else if (target === 'consumption') await redis.del(`consumption:${username}`);
      else if (target === 'sensors') await redis.del(`sensors:${username}`);
      else if (target === 'all') await Promise.all([redis.del(`inventory:${username}`), redis.del(`consumption:${username}`), redis.del(`sensors:${username}`)]);
      else return res.status(400).json({ error: 'Unknown reset target' });
      return res.status(200).json({ success: true });
    }

    if (resource === 'consumption') {
      const key = `consumption:${username}`;
      if (req.method === 'GET') {
        const requestedWeekKey = req.query.weekKey || null;
        let data = (await redis.get(key)) || { week: emptyWeek(), totalConsumed: 0, totalWasted: 0, itemCounts: {}, weekKey: requestedWeekKey };
        if (requestedWeekKey && data.weekKey !== requestedWeekKey) {
          data = { ...data, week: emptyWeek(), weekKey: requestedWeekKey };
          await redis.set(key, data);
        }
        const topItems = Object.entries(data.itemCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
        return res.status(200).json({ ...data, topItems });
      }
      if (req.method === 'POST') {
        const { name, category, action, amount, weekKey } = req.body || {};
        if (!action) return res.status(400).json({ error: 'Missing action' });
        const rawAmt = Number(amount);
        const amt = Number.isFinite(rawAmt) && rawAmt > 0 ? rawAmt : 1;
        let data = (await redis.get(key)) || { week: emptyWeek(), totalConsumed: 0, totalWasted: 0, itemCounts: {}, weekKey: weekKey || null };
        if (!data.itemCounts) data.itemCounts = {};
        if (weekKey && data.weekKey !== weekKey) { data.week = emptyWeek(); data.weekKey = weekKey; }
        if (action === 'waste') {
          data.totalWasted = +(((data.totalWasted || 0) + amt).toFixed(3));
        } else {
          data.totalConsumed = +(((data.totalConsumed || 0) + amt).toFixed(3));
          const todayName = DAYS[new Date().getDay()];
          const row = data.week.find(r => r.day === todayName);
          const k = (category || '').toLowerCase();
          if (row && k in row) row[k] += 1;
          if (name) data.itemCounts[name.trim()] = (data.itemCounts[name.trim()] || 0) + 1;
        }
        await redis.set(key, data);
        const topItems = Object.entries(data.itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => ({ name: n, count: c }));
        return res.status(200).json({ success: true, topItems });
      }
    }

    if (resource === 'preferences') {
      const key = `preferences:${username}`;
      if (req.method === 'GET') return res.status(200).json((await redis.get(key)) || { ratings: {} });
      if (req.method === 'POST') {
        const { action, recipeId, stars } = req.body || {};
        if (action !== 'rate' || !recipeId) return res.status(400).json({ error: 'Invalid request' });
        const data = (await redis.get(key)) || { ratings: {} };
        data.ratings[recipeId] = Math.max(1, Math.min(5, Number(stars) || 1));
        await redis.set(key, data);
        return res.status(200).json({ success: true });
      }
    }

    if (resource === 'calendar') {
      const key = `calendar:${username}`;
      if (req.method === 'GET') { const data = await redis.get(key); return res.status(200).json(data && typeof data === 'object' ? data : {}); }
      if (req.method === 'POST') {
        const { date, meal, recipeId } = req.body || {};
        if (!date || !['breakfast', 'lunch', 'dinner'].includes(meal)) return res.status(400).json({ error: 'Invalid date or meal' });
        const existing = await redis.get(key);
        const data = existing && typeof existing === 'object' ? existing : {};
        const day = data[date] || { breakfast: null, lunch: null, dinner: null };
        day[meal] = recipeId || null;
        data[date] = day;
        await redis.set(key, data);
        return res.status(200).json({ success: true });
      }
    }

    // ── NEW (issue 2): batch calendar update — ONE read-modify-write for
    // a whole set of slot changes. Fill Week and Clear Week now call this
    // instead of looping 21 individual POSTs, which is the actual fix for
    // "cleared next week and old suggestions came back" — each individual
    // POST did its own read-modify-write on the SAME document; concurrent
    // requests raced, and whichever finished last silently reverted every
    // other request's change back to a stale pre-batch snapshot.
    if (resource === 'calendar-batch' && req.method === 'POST') {
      const { updates } = req.body || {};
      if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ error: 'updates array is required' });
      const key = `calendar:${username}`;
      const existing = await redis.get(key);
      const data = existing && typeof existing === 'object' ? existing : {};
      for (const u of updates) {
        if (!u || !u.date || !['breakfast', 'lunch', 'dinner'].includes(u.meal)) continue;
        const day = data[u.date] || { breakfast: null, lunch: null, dinner: null };
        day[u.meal] = u.recipeId || null;
        data[u.date] = day;
      }
      await redis.set(key, data);
      return res.status(200).json({ success: true, applied: updates.length });
    }

    return res.status(400).json({ error: 'Unknown resource or method' });
  } catch (e) {
    console.error('user-data error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};