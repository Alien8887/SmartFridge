const { redis } = require('../_redis');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sessionToken = (req.headers.authorization || '').slice(7);
    if (!sessionToken) return res.status(401).json({ error: 'No session token provided' });

    const session = await redis.get(`session:${sessionToken}`);
    if (!session || Date.now() > session.expiresAt) {
      return res.status(401).json({ error: 'Session expired — sign in again' });
    }

    const userKey = `user:${session.username}`;
    const user = await redis.get(userKey);
    if (!user) return res.status(404).json({ error: `Account '${session.username}' not found` });

    let deviceToken = user.deviceToken;
    if (!deviceToken) {
      deviceToken = crypto.randomBytes(24).toString('hex');
      await redis.set(userKey, { ...user, deviceToken });
      await redis.set(`device:${deviceToken}`, session.username);
    }
    return res.status(200).json({ deviceToken });
  } catch (e) {
    console.error('device-token error', e);
    return res.status(500).json({ error: `Server error: ${e.message || 'unknown'}` });
  }
};