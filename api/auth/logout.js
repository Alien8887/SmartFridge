const { redis } = require('../_redis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) await redis.del(`session:${auth.slice(7)}`);
  } catch { /* always succeed */ }

  return res.status(200).json({ success: true });
};