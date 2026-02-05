require('dotenv').config();

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'your-secret-key';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

if (jwtAccessSecret === jwtRefreshSecret) {
  // Using identical secrets for access and refresh tokens weakens security.
  // Consider setting distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values.
  console.warn('Security warning: JWT access and refresh secrets are identical.');
}

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001']
};
