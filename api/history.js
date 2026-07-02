const { redis } = require('../lib/redis');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
const RANGE_MS = { '1H': 3_600_000, '24H': 86_400_000, '7D': 604_800_000 };
async function getUser(req) { const auth = (req.headers.authorization || '').slice(7); if (!auth) return null; const session = await redis.get(`session:${auth}`); return session && Date.now() < session.expiresAt ? session.username : null; }

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { type, points } = req.body || {};
      if (!type || !Array.isArray(points) || points.length === 0) return res.status(400).json({ error: 'Missing type or points' });
      const byDate = {};
      for (const p of points) {
        const date = new Date(p.timestamp || Date.now()).toISOString().slice(0, 10);
        (byDate[date] = byDate[date] || []).push({ time: p.time, value: Number(p.value), timestamp: Number(p.timestamp || Date.now()) });
      }
      for (const [date, pts] of Object.entries(byDate)) {
        const key = `hist:${type}:${username}:${date}`;
        const existing = await redis.get(key);
        const prev = Array.isArray(existing) ? existing : [];
        const merged = [...prev, ...pts].sort((a, b) => a.timestamp - b.timestamp).slice(-3000);
        await redis.set(key, merged, { ex: 35 * 86400 });
      }
      return res.status(200).json({ success: true, stored: points.length });
    }

    if (req.method === 'GET') {
      const { type, range = '24H' } = req.query;
      if (!type) return res.status(400).json({ error: 'Missing type' });
      const ms = RANGE_MS[range] || RANGE_MS['24H'];
      const now = Date.now();
      const days = Math.ceil(ms / 86400000) + 1;
      const dates = Array.from({ length: days }, (_, i) => new Date(now - i * 86400000).toISOString().slice(0, 10));
      const allPts = [];
      for (const date of dates) { const raw = await redis.get(`hist:${type}:${username}:${date}`); if (Array.isArray(raw)) allPts.push(...raw); }
      const cutoff = now - ms;
      let filtered = allPts.filter(p => p.timestamp >= cutoff).sort((a, b) => a.timestamp - b.timestamp);
      if (filtered.length > 300) { const step = Math.floor(filtered.length / 300); filtered = filtered.filter((_, i) => i % step === 0); }
      return res.status(200).json({ data: filtered, total: allPts.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('history error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};