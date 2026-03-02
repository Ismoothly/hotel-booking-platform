const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { auth } = require('../middleware/auth');
const { agentLimiter } = require('../middleware/rateLimiter');

// Agent MVP：只读建议，要求登录
router.use(auth);

/**
 * Agent 问答接口（MVP）
 * POST /api/agent/chat
 */
router.post('/chat', agentLimiter, agentController.chat);

module.exports = router;
