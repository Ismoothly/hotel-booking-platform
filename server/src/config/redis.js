/**
 * Redis 连接与版本/缓存 Key 约定
 * Key: hotel:{id}:version -> 当前版本号（数字）
 * Key: hotel:{id}:data   -> 可选，缓存酒店摘要（价格、房型、房态）JSON
 * Key: hotel:{id}:avail:{date} -> 可选，某日房态 Hash roomType -> quantity
 */
require('dotenv').config();

let client = null;

function getRedisUrl() {
  return process.env.REDIS_URL || 'redis://127.0.0.1:6379';
}

async function connectRedis() {
  if (client) return client;
  const Redis = require('ioredis');
  const url = getRedisUrl();
  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
  client.on('error', (err) => console.error('[Redis]', err.message));
  client.on('connect', () => console.log('[Redis] connected'));
  return client;
}

function getClient() {
  return client;
}

async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
    console.log('[Redis] disconnected');
  }
}

module.exports = {
  connectRedis,
  getClient,
  disconnectRedis,
  getRedisUrl,
};
