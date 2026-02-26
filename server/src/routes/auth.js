const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginLimiter, apiLimiter } = require('../middleware/rateLimiter');

// 注册（应用API限流）
router.post('/register', apiLimiter, authController.register);

// 登录（应用登录限流，防暴力破解）
router.post('/login', loginLimiter, authController.login);

// 刷新 access token
router.post('/refresh', authController.refresh);

// 退出登录
router.post('/logout', authController.logout);

// 获取当前用户信息（需要认证）
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
