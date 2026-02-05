const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// 注册
router.post('/register', authController.register);

// 登录
router.post('/login', authController.login);

// 刷新 access token
router.post('/refresh', authController.refresh);

// 退出登录
router.post('/logout', authController.logout);

// 获取当前用户信息（需要认证）
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
