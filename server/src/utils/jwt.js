const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成JWT Token
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};

/**
 * 验证JWT Token
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw new Error('Token无效或已过期');
  }
};
