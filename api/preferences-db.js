const { redis } = require('./_redis');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
async function getUser(req) { const auth = (req.headers.authorization || '').slice(7); const session = await redis.get(`session:${auth}`); return session && Date.now() < session.expiresAt ? session.username : null; }

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });
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
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { console.error('preferences-db error', e); return res.status(500).json({ error: 'Server error' }); }
};