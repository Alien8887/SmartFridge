const { redis }  = require('../_redis');
const crypto     = require('crypto');

const SEED_SECRET = 'seed_once_then_delete_this_endpoint';

function hashPw(pw) {
  return crypto
    .createHash('sha256')
    .update(pw + (process.env.JWT_SECRET || 'fallback'))
    .digest('hex');
}

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user',  password: 'user123',  role: 'user'  },
  { username: 'guest', password: 'guest',    role: 'user'  },
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.query.secret !== SEED_SECRET)
    return res.status(403).json({ error: 'Forbidden' });

  const results = [];
  for (const u of DEFAULT_USERS) {
    const key    = `user:${u.username}`;
    const exists = await redis.get(key);
    if (!exists) {
      await redis.set(key, {
        username:     u.username,
        passwordHash: hashPw(u.password),
        createdAt:    Date.now(),
        role:         u.role,
      });
      results.push(`Created: ${u.username}`);
    } else {
      results.push(`Already exists: ${u.username}`);
    }
  }

  return res.status(200).json({ success: true, results });
};