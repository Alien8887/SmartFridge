const { redis } = require('../_redis');
const crypto    = require('crypto');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function hashPw(pw) {
  return crypto
    .createHash('sha256')
    .update(pw + (process.env.JWT_SECRET || 'fallback'))
    .digest('hex');
}

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const key  = `user:${username.toLowerCase().trim()}`;
    const user = await redis.get(key);
    if (!user || user.passwordHash !== hashPw(password))
      return res.status(401).json({ error: 'Invalid username or password' });

    const token = crypto.randomBytes(32).toString('hex');
    await redis.set(
      `session:${token}`,
      { username: user.username, expiresAt: Date.now() + 86_400_000 },
      { ex: 86400 }
    );

    return res.status(200).json({
      success:  true,
      token,
      username: user.username,
      role:     user.role,
    });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};