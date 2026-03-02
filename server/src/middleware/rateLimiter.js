const rateLimit = require('express-rate-limit');

const ipKeyGenerator = rateLimit.ipKeyGenerator || ((ip) => ip);

/**
 * 通用 API 限流器
 * 防止暴力请求
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true, // 返回 RateLimit-* headers
  legacyHeaders: false, // 禁用 X-RateLimit-* headers
});

/**
 * 登录限流器
 * 防止暴力破解密码
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5次登录尝试
  message: {
    code: 429,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 订单创建限流器
 * 防止恶意刷单
 */
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每个IP每分钟最多5个订单
  message: {
    code: 429,
    message: '操作过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 针对已认证用户使用userId作为key
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return ipKeyGenerator(req.ip);
  }
});

/**
 * 支付限流器
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 3, // 每分钟最多3次支付请求
  message: {
    code: 429,
    message: '支付请求过于频繁，请稍后再试'
  },
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return ipKeyGenerator(req.ip);
  }
});

/**
 * Agent 问答限流器
 * 防止 AI 接口被滥用
 */
const agentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每个用户每分钟最多20次
  message: {
    code: 429,
    message: 'Agent 请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return ipKeyGenerator(req.ip);
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  orderLimiter,
  paymentLimiter,
  agentLimiter
};
