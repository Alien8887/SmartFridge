const { redis } = require('./_redis');

async function getUser(req) {
  const auth    = (req.headers.authorization || '').slice(7);
  const session = await redis.get(`session:${auth}`);
  return session && Date.now() < session.expiresAt ? session.username : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(503).json({
      available: false,
      message: 'Add ANTHROPIC_API_KEY to Vercel env vars to enable AI advice',
    });

  try {
    const username = await getUser(req);
    if (!username) return res.status(401).json({ error: 'Unauthorized' });

    const { temperature, humidity, inventory = [], doorOpenCount = 0, predictions } = req.body || {};

    const invSummary = inventory.slice(0, 8).map(i => {
      const d = Math.max(0, i.expiry - Math.floor((Date.now() - (i.addedDate || Date.now())) / 86_400_000));
      return `${i.name} (${d}d left)`;
    }).join(', ') || 'empty';

    const prompt = `Smart fridge AI — current status:
Temperature: ${Number(temperature || 0).toFixed(1)}°C | Humidity: ${Math.round(Number(humidity || 0))}%
Door openings: ${doorOpenCount}
ML forecast 6h: ${predictions?.forecast?.in6Hours ?? 'N/A'}°C (trend: ${predictions?.forecast?.trend ?? 'N/A'})
Food safety score: ${predictions?.safetyScore ?? 'N/A'}/100 (grade: ${predictions?.safetyGrade ?? 'N/A'})
Inventory: ${invSummary}

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{"recommendations":[{"priority":"high|medium|low","action":"...","reason":"...","impact":"..."}],"overallAssessment":"...","urgentAction":null}
Limit to 3 recommendations, each action under 12 words.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) throw new Error(`Anthropic returned ${r.status}`);
    const d    = await r.json();
    const text = d.content?.[0]?.text || '{}';

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { recommendations: [], overallAssessment: text.slice(0, 200), urgentAction: null };
    }

    return res.status(200).json({ available: true, ...parsed });
  } catch (e) {
    console.error('smart-advice error', e);
    return res.status(500).json({ error: 'AI service unavailable', available: false });
  }
};