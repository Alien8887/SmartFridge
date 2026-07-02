const { redis } = require('./_redis');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
async function getUser(req) {
  const auth = (req.headers.authorization || '').slice(7);
  const session = await redis.get(`session:${auth}`);
  return session && Date.now() < session.expiresAt ? session.username : null;
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function emptyWeek() { return DAYS.map(day => ({ day, dairy: 0, meat: 0, vegetables: 0, fruits: 0 })); }

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });
    const key = `consumption:${username}`;

    if (req.method === 'GET') {
      const data = (await redis.get(key)) || { week: emptyWeek(), totalConsumed: 0, totalWasted: 0, itemCounts: {} };
      const topItems = Object.entries(data.itemCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
      return res.status(200).json({ ...data, topItems });
    }

    if (req.method === 'POST') {
      const { name, category, action, amount } = req.body || {};
      if (!action) return res.status(400).json({ error: 'Missing action' });
      const amt = Math.max(1, Number(amount) || 1);
      const data = (await redis.get(key)) || { week: emptyWeek(), totalConsumed: 0, totalWasted: 0, itemCounts: {} };
      if (!data.itemCounts) data.itemCounts = {};

      if (action === 'waste') {
        data.totalWasted = (data.totalWasted || 0) + amt; // waste is amount-weighted — a 15-unit waste counts as 15
      } else {
        data.totalConsumed = (data.totalConsumed || 0) + amt;
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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('consumption-db error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};