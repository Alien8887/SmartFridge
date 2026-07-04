const { redis } = require('../lib/redis');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
const CONFIDENCE_MS = 30000;
const AI_GOAL_TTL_MS = 1_800_000;
const AI_MARGIN = 0.3;
const BASE_ENERGY_PER_OPEN = 0.008;
const ENERGY_PER_SECOND_OPEN = 0.0006;

async function resolveUser(token) {
  if (!token) return null;
  const session = await redis.get(`session:${token}`);
  if (session && Date.now() < session.expiresAt) return session.username;
  return await redis.get(`device:${token}`);
}

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = (req.headers.authorization || '').slice(7);
  const username = await resolveUser(token);
  if (!username) return res.status(401).json({ error: 'Unauthorized — invalid or missing token' });

  const key = `sensors:${username}`;

  if (req.method === 'POST') {
    const { temperature, humidity, weight, doorOpen, servoAngle, targetTemp, dhtOK, hxOK, rssi, uptimeSec } = req.body || {};
    const prev = (await redis.get(key)) || { doorOpenCount: 0, energyLost: 0, doorOpen: false, targetTemp: 4, doorOpenedAt: null };

    const isOpen = typeof doorOpen === 'boolean' ? doorOpen : prev.doorOpen;
    let doorOpenedAt = prev.doorOpenedAt ?? null;
    let lastOpenDurationSec = prev.lastOpenDurationSec ?? null;

    if (!prev.doorOpen && isOpen) { prev.doorOpenCount = (prev.doorOpenCount || 0) + 1; doorOpenedAt = Date.now(); }
    else if (prev.doorOpen && !isOpen && doorOpenedAt) {
      const durationSec = Math.max(0, Math.round((Date.now() - doorOpenedAt) / 1000));
      const eventEnergy = BASE_ENERGY_PER_OPEN + ENERGY_PER_SECOND_OPEN * durationSec;
      prev.energyLost = +(((prev.energyLost || 0) + eventEnergy).toFixed(4));
      lastOpenDurationSec = durationSec;
      doorOpenedAt = null;
    }

    const hasRealTelemetry = typeof temperature === 'number' && Number.isFinite(temperature);

    const data = {
      temperature: hasRealTelemetry && temperature !== -999 ? temperature : (prev.temperature ?? null),
      humidity: typeof humidity === 'number' && humidity !== -999 ? humidity : (prev.humidity ?? null),
      weight: typeof weight === 'number' && weight !== -999 ? weight : (prev.weight ?? 0),
      doorOpen: isOpen, doorOpenedAt, lastOpenDurationSec,
      servoAngle: typeof servoAngle === 'number' ? servoAngle : (prev.servoAngle ?? 90),
      targetTemp: typeof targetTemp === 'number' ? Math.max(0, Math.min(10, targetTemp)) : (prev.targetTemp ?? 4),
      doorOpenCount: prev.doorOpenCount ?? 0,
      energyLost: prev.energyLost ?? 0,
      dhtOK: typeof dhtOK === 'boolean' ? dhtOK : (prev.dhtOK ?? null),
      hxOK: typeof hxOK === 'boolean' ? hxOK : (prev.hxOK ?? null),
      rssi: typeof rssi === 'number' ? rssi : (prev.rssi ?? null),
      uptimeSec: typeof uptimeSec === 'number' ? uptimeSec : (prev.uptimeSec ?? null),
      lastSeen: hasRealTelemetry ? Date.now() : (typeof prev.lastSeen === 'number' ? prev.lastSeen : null),
    };
    await redis.set(key, data);
    return res.status(200).json({ success: true, targetTemp: data.targetTemp });
  }

  if (req.method === 'GET') {
    // Explicit complete shape even for an account that's never connected a
    // device — a missing energyLost field previously let the frontend keep
    // whatever OTHER account's total it had last displayed.
    const data = (await redis.get(key)) || { targetTemp: 4, energyLost: 0, doorOpenCount: 0 };
    const lastSeenNum = typeof data.lastSeen === 'number' && Number.isFinite(data.lastSeen) ? data.lastSeen : 0;
    const connected = lastSeenNum > 0 && (Date.now() - lastSeenNum) < CONFIDENCE_MS;

    const aiGoal = await redis.get(`ai-goal:${username}`);
    let goalTemp = data.targetTemp ?? 4;
    let aiAdjusted = false;
    let aiReason = null;
    if (aiGoal && Date.now() - aiGoal.computedAt < AI_GOAL_TTL_MS && aiGoal.recommendedTemp < goalTemp - AI_MARGIN) { goalTemp = aiGoal.recommendedTemp; aiAdjusted = true; aiReason = aiGoal.reason; }

    return res.status(200).json({
      ...data,
      energyLost: data.energyLost ?? 0,
      doorOpenCount: data.doorOpenCount ?? 0,
      goalTemp: +goalTemp.toFixed(1), aiAdjusted, aiReason, connected,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};