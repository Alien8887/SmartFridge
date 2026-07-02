const { redis } = require('./_redis');

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
async function getUser(req) { const auth = (req.headers.authorization || '').slice(7); const session = await redis.get(`session:${auth}`); return session && Date.now() < session.expiresAt ? session.username : null; }

const GEMINI_MODEL = 'gemini-3.5-flash'; // free-tier eligible Flash model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ available: false, message: 'Add GEMINI_API_KEY to enable AI recommendations' });

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const { temperature, humidity, inventory = [], doorOpenCount = 0, predictions } = req.body || {};
    const invSummary = inventory.slice(0, 8).map(i => {
      const d = Math.max(0, i.expiry - Math.floor((Date.now() - (i.addedDate || Date.now())) / 86400000));
      return `${i.name} (${d}d left)`;
    }).join(', ') || 'empty';

    const prompt = `Smart fridge AI — current status:
Temperature: ${Number(temperature || 0).toFixed(1)}°C | Humidity: ${Math.round(Number(humidity || 0))}%
Door openings: ${doorOpenCount}
ML forecast 6h: ${predictions?.forecast?.in6Hours ?? 'N/A'}°C (trend: ${predictions?.forecast?.trend ?? 'N/A'})
Food safety score: ${predictions?.safetyScore ?? 'N/A'}/100 (grade: ${predictions?.safetyGrade ?? 'N/A'})
Inventory: ${invSummary}

Respond ONLY with valid JSON (no markdown, no text outside the JSON):
{"recommendations":[{"priority":"high|medium|low","action":"...","reason":"...","impact":"..."}],"overallAssessment":"...","urgentAction":null}
Limit to 3 recommendations, each action under 12 words.`;

    const r = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!r.ok) { const body = await r.text().catch(() => ''); throw new Error(`Gemini ${r.status}: ${body.slice(0, 200)}`); }

    const d = await r.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed;
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
    catch { parsed = { recommendations: [], overallAssessment: text.slice(0, 200), urgentAction: null }; }

    return res.status(200).json({ available: true, ...parsed });
  } catch (e) {
    console.error('smart-advice (gemini) error', e);
    return res.status(500).json({ error: 'AI service unavailable', available: false });
  }
};