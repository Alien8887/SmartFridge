const { redis } = require('../lib/redis');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
async function getUser(req) { const auth = (req.headers.authorization || '').slice(7); const session = await redis.get(`session:${auth}`); return session && Date.now() < session.expiresAt ? session.username : null; }

function ewma(values, alpha = 0.3) { if (!values.length) return null; return values.reduce((avg, v, i) => i === 0 ? v : alpha * v + (1 - alpha) * avg); }
function linReg(values) {
  const n = values.length;
  if (n < 3) return { slope: 0, intercept: values[n - 1] || 0, r2: 0 };
  const xBar = (n - 1) / 2;
  const yBar = values.reduce((s, v) => s + v, 0) / n;
  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) { ssXY += (i - xBar) * (values[i] - yBar); ssXX += (i - xBar) ** 2; ssYY += (values[i] - yBar) ** 2; }
  const slope = ssXX ? ssXY / ssXX : 0;
  const intercept = yBar - slope * xBar;
  const r2 = ssXX && ssYY ? ssXY ** 2 / (ssXX * ssYY) : 0;
  return { slope, intercept, r2 };
}
function zScore(values) {
  if (values.length < 5) return { isAnomaly: false, z: 0, mean: values[0] || 0, stdDev: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
  const latest = values[values.length - 1];
  const z = stdDev > 0 ? Math.abs(latest - mean) / stdDev : 0;
  return { isAnomaly: z > 2.5, z: +z.toFixed(2), mean: +mean.toFixed(2), stdDev: +stdDev.toFixed(2) };
}
function q10Spoilage(items, T) {
  const Q10 = 2.0, Tref = 4;
  const rr = Math.pow(Q10, (T - Tref) / 10);
  return items.map(item => {
    const elapsed = Math.floor((Date.now() - (item.addedDate || Date.now())) / 86_400_000);
    const nominal = Math.max(0, item.expiry - elapsed);
    const adjusted = nominal / rr;
    const risk = Math.max(0, Math.min(100, 100 * (1 - adjusted / Math.max(1, item.expiry))));
    return { id: item.id, name: item.name, category: item.category, nominalDaysLeft: nominal, adjustedDaysLeft: +adjusted.toFixed(1), spoilageRisk: +risk.toFixed(1), speedup: +rr.toFixed(2), priority: risk > 70 ? 'urgent' : risk > 40 ? 'soon' : 'ok' };
  }).sort((a, b) => b.spoilageRisk - a.spoilageRisk);
}
function foodSafety(T, H) { const penalty = Math.sqrt(5 * (T - 3) ** 2 + 0.5 * (H - 55) ** 2); return +Math.max(0, Math.min(100, 100 - penalty)).toFixed(1); }

const GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action;

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    if (action === 'predict') {
      const { temperature, humidity, inventory = [] } = req.body || {};
      const T = Number(temperature) || 4;
      const H = Number(humidity) || 55;

      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const [raw1, raw2] = await Promise.all([redis.get(`hist:temp:${username}:${yesterday}`), redis.get(`hist:temp:${username}:${today}`)]);
      const d1 = Array.isArray(raw1) ? raw1 : [];
      const d2 = Array.isArray(raw2) ? raw2 : [];
      const histValues = [...d1, ...d2].slice(-60).map(p => p.value);
      if (!histValues.length) histValues.push(T);

      const reg = linReg(histValues);
      const anomaly = zScore(histValues);
      const smoothed = ewma(histValues);

      const stepsAhead = 30 * 6;
      const rawPred = reg.intercept + reg.slope * (histValues.length + stepsAhead);
      const predicted6h = +Math.max(-10, Math.min(30, rawPred)).toFixed(1);
      const trend = Math.abs(reg.slope) < 0.005 ? 'stable' : reg.slope > 0 ? 'rising' : 'falling';
      const confidence = Math.min(95, Math.round(reg.r2 * 100));

      const spoilage = q10Spoilage(inventory, T);
      const safetyScore = foodSafety(T, H);
      const safetyGrade = safetyScore >= 85 ? 'A' : safetyScore >= 70 ? 'B' : safetyScore >= 55 ? 'C' : 'D';

      const insights = [];
      if (trend === 'rising') insights.push(`🌡️ Temp rising ${(reg.slope * 60).toFixed(2)}°C/h — monitor compressor.`);
      if (trend === 'falling') insights.push('❄️ Temperature falling — efficient cooling detected.');
      if (anomaly.isAnomaly) insights.push(`⚠️ Anomaly: current reading is ${anomaly.z}σ from normal (μ=${anomaly.mean}°C).`);
      if (predicted6h > 8) insights.push(`🔮 ML forecast: temperature may reach ${predicted6h}°C in 6h.`);
      if (T > 4) { const mult = +(Math.pow(2, (T - 4) / 10)).toFixed(2); insights.push(`📊 Q10 model: at ${T}°C food spoils ${mult}× faster than at 4°C.`); }
      const urgent = spoilage.filter(s => s.priority === 'urgent');
      if (urgent.length) insights.push(`🚨 ${urgent.length} item(s) at >70% spoilage risk: ${urgent.map(s => s.name).join(', ')}.`);
      if (H > 75) insights.push('💧 High humidity — mould risk for produce.');
      if (safetyScore < 65) insights.push(`⚗️ Food safety score ${safetyScore}/100 — below optimal.`);
      if (!insights.length) insights.push('✅ All conditions optimal — fridge running perfectly.');

      let goalRecommendation = { shouldOverride: false, recommendedTemp: T, reason: '' };
      const worst = spoilage[0];
      if (worst && worst.priority === 'urgent' && worst.spoilageRisk > 70) {
        goalRecommendation = { shouldOverride: true, recommendedTemp: +Math.max(0, T - 2).toFixed(1), reason: `${worst.name} at ${worst.spoilageRisk}% spoilage risk — lowering target to slow decay` };
      } else if (safetyScore < 50) {
        goalRecommendation = { shouldOverride: true, recommendedTemp: +Math.max(0, T - 1).toFixed(1), reason: `Food safety score ${safetyScore}/100 — lowering target as a precaution` };
      }
      if (goalRecommendation.shouldOverride) await redis.set(`ai-goal:${username}`, { recommendedTemp: goalRecommendation.recommendedTemp, reason: goalRecommendation.reason, computedAt: Date.now() }, { ex: 1800 });
      else await redis.del(`ai-goal:${username}`);

      return res.status(200).json({
        currentTemp: +T.toFixed(1), smoothedTemp: smoothed !== null ? +smoothed.toFixed(1) : +T.toFixed(1),
        forecast: { in6Hours: predicted6h, trend, confidence, willExceedSafe: predicted6h > 8, willFreeze: predicted6h < 0 },
        anomaly: { isAnomaly: anomaly.isAnomaly, zScore: anomaly.z, mean: anomaly.mean, stdDev: anomaly.stdDev, description: anomaly.isAnomaly ? `Current reading is ${anomaly.z}σ from baseline — investigate` : `Within normal range (μ=${anomaly.mean}°C, σ=${anomaly.stdDev}°C)` },
        safetyScore, safetyGrade, spoilageRisks: spoilage.slice(0, 8), insights, goalRecommendation,
        modelInfo: { algorithms: ['EWMA (α=0.3)', 'OLS Linear Regression', 'Z-Score (threshold 2.5σ)', 'Q10 Model (Q10=2.0, Tref=4°C)', 'Food Safety Composite Score'], dataPoints: histValues.length, rSquared: +reg.r2.toFixed(3) },
      });
    }


    if (action === 'chat') {
      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ reply: 'Chat needs GEMINI_API_KEY configured on the server.', action: null });

      const { history = [], context = {} } = req.body || {};
      const VALID_MODES = ['normal', 'party', 'ramadan', 'diet', 'travel'];
      const invSummary = (context.inventory || []).slice(0, 10).map(i => i.name).join(', ') || 'empty';

      const systemPrompt = `You are the Smart Fridge assistant embedded in a kitchen app. Be concise — 2-3 sentences unless asked for a list.
Current state: Temperature ${context.temperature ?? '?'}°C, Humidity ${context.humidity ?? '?'}%, current mode "${context.currentMode ?? 'normal'}".
Available modes: ${VALID_MODES.join(', ')}.
Inventory: ${invSummary}.

If — and only if — the user clearly asks to change the fridge's mode, include an action. Otherwise action must be null. Never invent any other action type.
Respond ONLY with JSON, no markdown: {"reply":"...","action": null | {"type":"setMode","mode":"<one of: ${VALID_MODES.join('|')}>"}}`;

      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: '{"reply":"Hi! I can see your fridge — ask me anything, or ask me to switch modes.","action":null}' }] },
        ...history.slice(-10).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
      ];

      const r = await fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents }) });
      if (!r.ok) { const body = await r.text().catch(() => ''); throw new Error(`Gemini ${r.status}: ${body.slice(0, 200)}`); }
      const d = await r.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      let parsed;
      try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { parsed = { reply: text.slice(0, 300), action: null }; }

      let action = null;
      if (parsed.action && parsed.action.type === 'setMode' && VALID_MODES.includes(parsed.action.mode)) action = { type: 'setMode', mode: parsed.action.mode };

      return res.status(200).json({ reply: parsed.reply || "I'm not sure how to answer that.", action });
    }


    if (action === 'advice') {
      if (!process.env.GEMINI_API_KEY) return res.status(503).json({ available: false, message: 'Add GEMINI_API_KEY to enable AI recommendations' });

      const { temperature, humidity, inventory = [], doorOpenCount = 0, predictions } = req.body || {};
      const invSummary = inventory.slice(0, 8).map(i => { const d = Math.max(0, i.expiry - Math.floor((Date.now() - (i.addedDate || Date.now())) / 86400000)); return `${i.name} (${d}d left)`; }).join(', ') || 'empty';

      const prompt = `Smart fridge AI — current status:
Temperature: ${Number(temperature || 0).toFixed(1)}°C | Humidity: ${Math.round(Number(humidity || 0))}%
Door openings: ${doorOpenCount}
ML forecast 6h: ${predictions?.forecast?.in6Hours ?? 'N/A'}°C (trend: ${predictions?.forecast?.trend ?? 'N/A'})
Food safety score: ${predictions?.safetyScore ?? 'N/A'}/100 (grade: ${predictions?.safetyGrade ?? 'N/A'})
Inventory: ${invSummary}

Respond ONLY with valid JSON (no markdown, no text outside the JSON):
{"recommendations":[{"priority":"high|medium|low","action":"...","reason":"...","impact":"..."}],"overallAssessment":"...","urgentAction":null}
Limit to 3 recommendations, each action under 12 words.`;

      const r = await fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      if (!r.ok) { const body = await r.text().catch(() => ''); throw new Error(`Gemini ${r.status}: ${body.slice(0, 200)}`); }
      const d = await r.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed;
      try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch { parsed = { recommendations: [], overallAssessment: text.slice(0, 200), urgentAction: null }; }
      return res.status(200).json({ available: true, ...parsed });
    }

    return res.status(400).json({ error: 'Unknown action — use ?action=predict or ?action=advice' });
  } catch (e) {
    console.error('ai.js error', e);
    return res.status(500).json({ error: 'AI service unavailable', available: false });
  }
};