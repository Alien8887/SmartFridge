const { redis } = require('../_redis');
const crypto = require('crypto');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
function hashPw(pw) { return crypto.createHash('sha256').update(pw + (process.env.JWT_SECRET || 'fallback')).digest('hex'); }
async function getSession(req) { const token = (req.headers.authorization || '').slice(7); const session = await redis.get(`session:${token}`); if (!session || Date.now() > session.expiresAt) return null; return session; }

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    const userKey = `user:${session.username}`;
    const user = await redis.get(userKey);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.method === 'GET') {
      return res.status(200).json({ username: user.username, role: user.role || 'user', createdAt: user.createdAt, hasDevice: Boolean(user.deviceToken) });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};
      if (action === 'changePassword') {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
        if (user.passwordHash !== hashPw(currentPassword)) return res.status(401).json({ error: 'Current password is incorrect' });
        if (newPassword.length < 4) return res.status(400).json({ error: 'New password must be at least 4 characters' });
        await redis.set(userKey, { ...user, passwordHash: hashPw(newPassword) });
        return res.status(200).json({ success: true });
      }
      if (action === 'regenerateDeviceToken') {
        const newToken = crypto.randomBytes(24).toString('hex');
        if (user.deviceToken) await redis.del(`device:${user.deviceToken}`);
        await redis.set(userKey, { ...user, deviceToken: newToken });
        await redis.set(`device:${newToken}`, session.username);
        return res.status(200).json({ deviceToken: newToken });
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('profile error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};