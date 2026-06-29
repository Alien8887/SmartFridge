const { redis } = require('./_redis');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function getUser(req) {
  const auth    = (req.headers.authorization || '').slice(7);
  const session = await redis.get(`session:${auth}`);
  return session && Date.now() < session.expiresAt ? session.username : null;
}

// ── Algorithm 1: EWMA ────────────────────────────────────────────────────
function ewma(values, alpha = 0.3) {
  if (!values.length) return null;
  return values.reduce((avg, v, i) => i === 0 ? v : alpha * v + (1 - alpha) * avg);
}

// ── Algorithm 2: OLS Linear Regression ──────────────────────────────────
function linReg(values) {
  const n = values.length;
  if (n < 3) return { slope: 0, intercept: values[n - 1] || 0, r2: 0 };
  const xBar = (n - 1) / 2;
  const yBar = values.reduce((s, v) => s + v, 0) / n;
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xBar) * (values[i] - yBar);
    ssXX += (i - xBar) ** 2;
    ssYY += (values[i] - yBar) ** 2;
  }
  const slope     = ssXX ? ssXY / ssXX : 0;
  const intercept = yBar - slope * xBar;
  const r2        = ssXX && ssYY ? ssXY ** 2 / (ssXX * ssYY) : 0;
  return { slope, intercept, r2 };
}

// ── Algorithm 3: Z-Score Anomaly Detection ───────────────────────────────
function zScore(values) {
  if (values.length < 5) return { isAnomaly: false, z: 0, mean: values[0] || 0, stdDev: 0 };
  const mean   = values.reduce((s, v) => s + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const latest = values[values.length - 1];
  const z      = stdDev > 0 ? Math.abs(latest - mean) / stdDev : 0;
  return { isAnomaly: z > 2.5, z: +z.toFixed(2), mean: +mean.toFixed(2), stdDev: +stdDev.toFixed(2) };
}

// ── Algorithm 4: Q10 Food Spoilage Model ────────────────────────────────
function q10Spoilage(items, T) {
  const Q10 = 2.0, Tref = 4;
  const rr  = Math.pow(Q10, (T - Tref) / 10);
  return items.map(item => {
    const elapsed  = Math.floor((Date.now() - (item.addedDate || Date.now())) / 86_400_000);
    const nominal  = Math.max(0, item.expiry - elapsed);
    const adjusted = nominal / rr;
    const risk     = Math.max(0, Math.min(100, 100 * (1 - adjusted / Math.max(1, item.expiry))));
    return {
      id:               item.id,
      name:             item.name,
      category:         item.category,
      nominalDaysLeft:  nominal,
      adjustedDaysLeft: +adjusted.toFixed(1),
      spoilageRisk:     +risk.toFixed(1),
      speedup:          +rr.toFixed(2),
      priority:         risk > 70 ? 'urgent' : risk > 40 ? 'soon' : 'ok',
    };
  }).sort((a, b) => b.spoilageRisk - a.spoilageRisk);
}

// ── Algorithm 5: Food Safety Composite Score ─────────────────────────────
function foodSafety(T, H) {
  const penalty = Math.sqrt(5 * (T - 3) ** 2 + 0.5 * (H - 55) ** 2);
  return +Math.max(0, Math.min(100, 100 - penalty)).toFixed(1);
}

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const { temperature, humidity, inventory = [] } = req.body || {};
    const T = Number(temperature) || 4;
    const H = Number(humidity)    || 55;

    // Load last 2 days of temperature history
    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

    // ── fixed: await each get individually, then guard against null ──
    const [raw1, raw2] = await Promise.all([
      redis.get(`hist:temp:${username}:${yesterday}`),
      redis.get(`hist:temp:${username}:${today}`),
    ]);
    const d1 = Array.isArray(raw1) ? raw1 : [];
    const d2 = Array.isArray(raw2) ? raw2 : [];

    const histValues = [...d1, ...d2].slice(-60).map(p => p.value);
    if (!histValues.length) histValues.push(T);

    const reg      = linReg(histValues);
    const anomaly  = zScore(histValues);
    const smoothed = ewma(histValues);

    const stepsAhead  = 30 * 6;
    const rawPred     = reg.intercept + reg.slope * (histValues.length + stepsAhead);
    const predicted6h = +Math.max(-10, Math.min(30, rawPred)).toFixed(1);
    const trend       = Math.abs(reg.slope) < 0.005 ? 'stable' : reg.slope > 0 ? 'rising' : 'falling';
    const confidence  = Math.min(95, Math.round(reg.r2 * 100));

    const spoilage    = q10Spoilage(inventory, T);
    const safetyScore = foodSafety(T, H);
    const safetyGrade = safetyScore >= 85 ? 'A' : safetyScore >= 70 ? 'B' : safetyScore >= 55 ? 'C' : 'D';

    const insights = [];
    if (trend === 'rising')  insights.push(`🌡️ Temp rising ${(reg.slope * 60).toFixed(2)}°C/h — monitor compressor.`);
    if (trend === 'falling') insights.push('❄️ Temperature falling — efficient cooling detected.');
    if (anomaly.isAnomaly)   insights.push(`⚠️ Anomaly: current reading is ${anomaly.z}σ from normal (μ=${anomaly.mean}°C). Check door seal.`);
    if (predicted6h > 8)     insights.push(`🔮 ML forecast: temperature may reach ${predicted6h}°C in 6h — food at risk.`);
    if (T > 4) {
      const mult = +(Math.pow(2, (T - 4) / 10)).toFixed(2);
      insights.push(`📊 Q10 model: at ${T}°C food spoils ${mult}× faster than at 4°C.`);
    }
    const urgent = spoilage.filter(s => s.priority === 'urgent');
    if (urgent.length)  insights.push(`🚨 ${urgent.length} item(s) at >70% spoilage risk: ${urgent.map(s => s.name).join(', ')}.`);
    if (H > 75)         insights.push('💧 High humidity — mould risk for produce.');
    if (safetyScore < 65) insights.push(`⚗️ Food safety score ${safetyScore}/100 — conditions below optimal.`);
    if (!insights.length) insights.push('✅ All conditions optimal — fridge running perfectly.');

    return res.status(200).json({
      currentTemp:  +T.toFixed(1),
      smoothedTemp: smoothed !== null ? +smoothed.toFixed(1) : +T.toFixed(1),
      forecast: { in6Hours: predicted6h, trend, confidence, willExceedSafe: predicted6h > 8, willFreeze: predicted6h < 0 },
      anomaly: {
        isAnomaly:   anomaly.isAnomaly,
        zScore:      anomaly.z,
        mean:        anomaly.mean,
        stdDev:      anomaly.stdDev,
        description: anomaly.isAnomaly
          ? `Current reading is ${anomaly.z}σ from baseline — investigate`
          : `Within normal range (μ=${anomaly.mean}°C, σ=${anomaly.stdDev}°C)`,
      },
      safetyScore, safetyGrade,
      spoilageRisks: spoilage.slice(0, 8),
      insights,
      modelInfo: {
        algorithms: [
          'EWMA (α=0.3)',
          'OLS Linear Regression',
          'Z-Score (threshold 2.5σ)',
          'Q10 Model (Q10=2.0, Tref=4°C)',
          'Food Safety Composite Score',
        ],
        dataPoints: histValues.length,
        rSquared:   +reg.r2.toFixed(3),
      },
    });
  } catch (e) {
    console.error('predict error', e);
    return res.status(500).json({ error: 'Server error' });
  }
};