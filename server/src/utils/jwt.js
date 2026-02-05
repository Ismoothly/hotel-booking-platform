const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成 Access Token
 */
exports.generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpire
  });
};

/**
 * 生成 Refresh Token
 */
exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire
  });
};

/**
 * 验证 Access Token
 */
exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtAccessSecret);
  } catch (error) {
    throw new Error('Access Token无效或已过期');
  }
};

/**
 * 验证 Refresh Token
 */
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    throw new Error('Refresh Token无效或已过期');
  }
};
