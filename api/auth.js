const { redis } = require('../lib/redis');
const crypto = require('crypto');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
function hashPw(pw) { return crypto.createHash('sha256').update(pw + (process.env.JWT_SECRET || 'fallback')).digest('hex'); }
async function getSession(req) {
  const token = (req.headers.authorization || '').slice(7);
  if (!token) return null;
  const session = await redis.get(`session:${token}`);
  if (!session || Date.now() > session.expiresAt) return null;
  return session;
}

const SEED_SECRET = 'seed_once_then_delete_this_endpoint';
const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' },
  { username: 'guest', password: 'guest', role: 'guest' },
];

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  try {


    if (action === 'admin-users' && req.method === 'GET') {
      const session = await getSession(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const requester = await redis.get(`user:${session.username}`);
      if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

      const keys = await redis.keys('user:*');
      if (!keys || keys.length === 0) return res.status(200).json({ users: [] });
      const values = await redis.mget(...keys);
      const users = keys.map((k, i) => {
        const u = values[i];
        if (!u) return null;
        // Never include passwordHash or deviceToken value — only whether one exists.
        return {
          username: u.username, role: u.role || 'user', createdAt: u.createdAt || null,
          hasDevice: Boolean(u.deviceToken), fridgeModel: u.fridgeModel || '', householdSize: u.householdSize ?? null,
        };
      }).filter(Boolean);
      users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.status(200).json({ users });
    }

    
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      const key = `user:${username.toLowerCase().trim()}`;
      const user = await redis.get(key);
      if (!user || user.passwordHash !== hashPw(password)) return res.status(401).json({ error: 'Invalid username or password' });
      const token = crypto.randomBytes(32).toString('hex');
      await redis.set(`session:${token}`, { username: user.username, expiresAt: Date.now() + 86_400_000 }, { ex: 86400 });
      return res.status(200).json({ success: true, token, username: user.username, role: user.role });
    }

    if (action === 'register' && req.method === 'POST') {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
      const normalised = username.toLowerCase().trim();
      if (!/^[a-z0-9_]{3,20}$/.test(normalised)) return res.status(400).json({ error: 'Username: 3-20 chars, letters/numbers/underscore only' });
      const key = `user:${normalised}`;
      const existing = await redis.get(key);
      if (existing) return res.status(409).json({ error: 'Username already taken' });
      await redis.set(key, { username: normalised, passwordHash: hashPw(password), createdAt: Date.now(), role: 'user' });
      return res.status(201).json({ success: true, message: 'Account created' });
    }

    if (action === 'verify' && req.method === 'GET') {
      const session = await getSession(req);
      if (!session) return res.status(401).json({ valid: false, error: 'Expired or invalid' });
      const user = await redis.get(`user:${session.username}`);
      return res.status(200).json({ valid: true, username: session.username, role: user?.role || 'user' });
    }

    if (action === 'logout' && req.method === 'POST') {
      const authToken = (req.headers.authorization || '').slice(7);
      if (authToken) await redis.del(`session:${authToken}`);
      return res.status(200).json({ success: true });
    }

    if (action === 'seed' && req.method === 'GET') {
      if (req.query.secret !== SEED_SECRET) return res.status(403).json({ error: 'Forbidden' });
      const results = [];
      for (const u of DEFAULT_USERS) {
        const key = `user:${u.username}`;
        const exists = await redis.get(key);
        if (!exists) { await redis.set(key, { username: u.username, passwordHash: hashPw(u.password), createdAt: Date.now(), role: u.role }); results.push(`Created: ${u.username}`); }
        else results.push(`Already exists: ${u.username}`);
      }
      return res.status(200).json({ success: true, results });
    }

    if (action === 'device-token' && req.method === 'GET') {
      const session = await getSession(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
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
    }

    if (action === 'profile' && req.method === 'GET') {
      const session = await getSession(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const user = await redis.get(`user:${session.username}`);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({
        username: user.username, role: user.role || 'user', createdAt: user.createdAt, hasDevice: Boolean(user.deviceToken),
        fridgeModel: user.fridgeModel || '', fridgeCapacityLiters: user.fridgeCapacityLiters ?? null,
        householdSize: user.householdSize ?? null, dietaryPreferences: user.dietaryPreferences || [],
        dailyCalorieGoal: user.dailyCalorieGoal ?? null,
      });
    }

    if (action === 'profile' && req.method === 'POST') {
      const session = await getSession(req);
      if (!session) return res.status(401).json({ error: 'Unauthorized' });
      const userKey = `user:${session.username}`;
      const user = await redis.get(userKey);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { subaction } = req.body || {};

      if (subaction === 'changePassword') {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
        if (user.passwordHash !== hashPw(currentPassword)) return res.status(401).json({ error: 'Current password is incorrect' });
        if (newPassword.length < 4) return res.status(400).json({ error: 'New password must be at least 4 characters' });
        await redis.set(userKey, { ...user, passwordHash: hashPw(newPassword) });
        return res.status(200).json({ success: true });
      }
      if (subaction === 'regenerateDeviceToken') {
        const newToken = crypto.randomBytes(24).toString('hex');
        if (user.deviceToken) await redis.del(`device:${user.deviceToken}`);
        await redis.set(userKey, { ...user, deviceToken: newToken });
        await redis.set(`device:${newToken}`, session.username);
        return res.status(200).json({ deviceToken: newToken });
      }
      if (subaction === 'updateFridgeInfo') {
        const { fridgeModel, fridgeCapacityLiters, householdSize, dietaryPreferences, dailyCalorieGoal } = req.body || {};
        const updated = {
          ...user,
          fridgeModel: typeof fridgeModel === 'string' ? fridgeModel.slice(0, 60) : user.fridgeModel,
          fridgeCapacityLiters: typeof fridgeCapacityLiters === 'number' ? fridgeCapacityLiters : user.fridgeCapacityLiters,
          householdSize: typeof householdSize === 'number' ? householdSize : user.householdSize,
          dietaryPreferences: Array.isArray(dietaryPreferences) ? dietaryPreferences.slice(0, 10) : user.dietaryPreferences,
          dailyCalorieGoal: typeof dailyCalorieGoal === 'number' ? dailyCalorieGoal : user.dailyCalorieGoal,
        };
        await redis.set(userKey, updated);
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: 'Unknown subaction' });
    }

    return res.status(400).json({ error: 'Unknown action or method' });
  } catch (e) {
    console.error('auth error', e);
    return res.status(500).json({ error: `Server error: ${e.message || 'unknown'}` });
  }
};