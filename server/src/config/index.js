require('dotenv').config();

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'your-secret-key';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

if (jwtAccessSecret === jwtRefreshSecret) {
  // Using identical secrets for access and refresh tokens weakens security.
  // Consider setting distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values.
  console.warn('Security warning: JWT access and refresh secrets are identical.');
}

// CORS origins - 允许开发环境来自任何地方的请求
const getCorsOrigins = () => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',');
  }
  
  // 开发环境允许所有来源，生产环境需要明确指定
  if (process.env.NODE_ENV === 'production') {
    return ['http://localhost:3000', 'http://localhost:3001'];
  }
  
  // 开发环境允许所有来源（用于真机测试）
  return '*';
};

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || null,
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  corsOrigins: getCorsOrigins()
};
