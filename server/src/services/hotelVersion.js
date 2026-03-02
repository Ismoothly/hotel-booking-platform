/**
 * 酒店版本号与 Redis 缓存
 * - 版本号：每次价格/房态变更时递增，前端携带版本号下单，后端校验
 * - 缓存：可选将酒店价格、房态写入 Redis 加速查询
 */
const { getClient } = require('../config/redis');

const VERSION_KEY = (id) => `hotel:${id}:version`;
const DATA_KEY = (id) => `hotel:${id}:data`;
const AVAIL_KEY = (id, date) => `hotel:${id}:avail:${date}`;

/**
 * 获取酒店当前版本号（从 Redis），不存在则返回 1
 */
async function getVersion(hotelId) {
  const redis = getClient();
  if (!redis) return 1;
  const v = await redis.get(VERSION_KEY(String(hotelId)));
  return v ? parseInt(v, 10) : 1;
}

/**
 * 递增酒店版本号并返回新版本
 */
async function incVersion(hotelId) {
  const redis = getClient();
  if (!redis) return 1;
  const key = VERSION_KEY(String(hotelId));
  const next = await redis.incr(key);
  return next;
}

/**
 * 批量获取多个酒店的版本号
 */
async function getVersions(hotelIds) {
  const redis = getClient();
  if (!redis || !hotelIds || hotelIds.length === 0) {
    return hotelIds.reduce((acc, id) => ({ ...acc, [String(id)]: 1 }), {});
  }
  const keys = hotelIds.map((id) => VERSION_KEY(String(id)));
  const values = await redis.mget(keys);
  const result = {};
  hotelIds.forEach((id, i) => {
    const v = values[i];
    result[String(id)] = v ? parseInt(v, 10) : 1;
  });
  return result;
}

/**
 * 设置酒店缓存数据（价格、房型、房态摘要），可选
 */
async function setCachedHotel(hotelId, data, ttlSeconds = 300) {
  const redis = getClient();
  if (!redis) return;
  const key = DATA_KEY(String(hotelId));
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
}

/**
 * 获取酒店缓存数据
 */
async function getCachedHotel(hotelId) {
  const redis = getClient();
  if (!redis) return null;
  const raw = await redis.get(DATA_KEY(String(hotelId)));
  return raw ? JSON.parse(raw) : null;
}

/**
 * 设置某酒店某日期的房态 Hash（roomType -> quantity）
 */
async function setAvailability(hotelId, date, roomTypeToQuantity) {
  const redis = getClient();
  if (!redis) return;
  const key = AVAIL_KEY(String(hotelId), date);
  await redis.hmset(key, roomTypeToQuantity);
  await redis.expire(key, 86400 * 2); // 2 天
}

/**
 * 获取某酒店某日期的房态
 */
async function getAvailability(hotelId, date) {
  const redis = getClient();
  if (!redis) return null;
  const key = AVAIL_KEY(String(hotelId), date);
  const obj = await redis.hgetall(key);
  if (!obj || Object.keys(obj).length === 0) return null;
  const result = {};
  for (const [k, v] of Object.entries(obj)) result[k] = parseInt(v, 10);
  return result;
}

module.exports = {
  getVersion,
  incVersion,
  getVersions,
  setCachedHotel,
  getCachedHotel,
  setAvailability,
  getAvailability,
};
