const { redis } = require('../_redis');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer '))
      return res.status(401).json({ valid: false, error: 'No token' });

    const token   = auth.slice(7);
    const session = await redis.get(`session:${token}`);

    if (!session || Date.now() > session.expiresAt) {
      if (session) await redis.del(`session:${token}`);
      return res.status(401).json({ valid: false, error: 'Expired or invalid' });
    }

    const user = await redis.get(`user:${session.username}`);
    return res.status(200).json({
      valid:    true,
      username: session.username,
      role:     user?.role || 'user',
    });
  } catch (e) {
    console.error('verify error', e);
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
};