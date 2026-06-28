const { Redis } = require('@upstash/redis');

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN env vars');
}

const redis = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = { redis };