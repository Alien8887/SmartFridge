const { redis } = require('../_redis');
const crypto    = require('crypto');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
    if (password.length < 4)
      return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const normalised = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(normalised))
      return res.status(400).json({
        error: 'Username: 3–20 chars, letters/numbers/underscore only',
      });

    const key      = `user:${normalised}`;
    const existing = await redis.get(key);
    if (existing)
      return res.status(409).json({ error: 'Username already taken' });

    await redis.set(key, {
      username:     normalised,
      passwordHash: hashPw(password),
      createdAt:    Date.now(),
      role:         'user',
    });

    return res.status(201).json({ success: true, message: 'Account created' });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};