const { redis } = require('./_redis');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function getUser(req) {
  const auth    = (req.headers.authorization || '').slice(7);
  const session = await redis.get(`session:${auth}`);
  return session && Date.now() < session.expiresAt ? session.username : null;
}

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const key = `inventory:${username}`;

    if (req.method === 'GET') {
      const data = await redis.get(key);
      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    if (req.method === 'POST') {
      const { name, category, expiry, quantity } = req.body || {};
      const existing = await redis.get(key);
      const list     = Array.isArray(existing) ? existing : [];
      const newItem  = {
        id:        Date.now(),
        name:      (name || '').trim(),
        category:  category || 'Other',
        expiry:    Number(expiry) || 7,
        quantity:  quantity || '1x',
        freshness: 100,
        addedDate: Date.now(),
      };
      await redis.set(key, [newItem, ...list]);
      return res.status(201).json(newItem);
    }

    if (req.method === 'DELETE') {
      const id       = Number(req.query.id);
      const existing = await redis.get(key);
      const list     = Array.isArray(existing) ? existing : [];
      await redis.set(key, list.filter(i => i.id !== id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('inventory-db error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};