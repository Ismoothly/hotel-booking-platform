const express = require('express');
const router = express.Router();
const { getQueueStats } = require('../services/inventoryQueue');

/**
 * 获取库存队列状态
 * GET /api/queue/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({
      code: 200,
      message: '队列状态查询成功',
      data: {
        queue: 'inventory-deduction',
        ...stats,
        description: {
          waiting: '等待处理的任务数',
          active: '当前正在处理的任务数',
          completed: '已完成的任务数',
          failed: '失败的任务数'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取队列状态失败',
      error: error.message
    });
  }
});

module.exports = router;
