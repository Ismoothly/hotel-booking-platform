const agentService = require('../services/agentService');

/**
 * Agent 问答（只读建议模式）
 * POST /api/agent/chat
 */
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        code: 400,
        message: 'message 不能为空'
      });
    }

    const result = await agentService.chat({
      message: message.trim(),
      user: req.user
    });

    res.json({
      code: 200,
      message: 'Agent 回复成功',
      data: {
        reply: result.reply,
        mode: result.mode,
        tool: result.tool,
        safeMode: true
      }
    });
  } catch (error) {
    console.error('[Agent] chat error:', error.message);
    res.status(500).json({
      code: 500,
      message: 'Agent 服务异常',
      error: error.message
    });
  }
};
