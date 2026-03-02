const Queue = require('bull');
const Order = require('../models/Order-mongoose');
const Hotel = require('../models/Hotel-mongoose');

// 创建库存扣减队列
const inventoryQueue = new Queue('inventory-deduction', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  settings: {
    maxStalledCount: 3,        // 最多重试3次
    stalledInterval: 5000,      // 5秒检查一次
    maxRetriesPerJob: 3,        // 每个任务最多重试3次
    retryProcessDelay: 5000,    // 重试延迟5秒
    lockDuration: 30000         // 任务锁定30秒
  }
});

/**
 * 消费者：处理库存扣减
 */
inventoryQueue.process(async (job) => {
  const { orderId, items } = job.data;
  
  console.log(`[队列] 开始处理库存扣减: ${orderId}, 进度: ${job.progress()}%`);

  try {
    // 获取订单
    const order = await Order.findOne({ orderId });
    if (!order) {
      throw new Error(`订单不存在: ${orderId}`);
    }

    if (order.paymentStatus === 'paid' && order.status === 'paid') {
      console.log(`[队列] ⚠️ 订单已处理过: ${orderId}，跳过库存扣减`);
      return { status: 'already_processed' };
    }

    // 扣减库存
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      job.progress((i / items.length) * 100);

      console.log(`[队列] 扣减库存: 酒店=${item.hotelId}, 房型=${item.roomType}, 数量=${item.quantity}`);

      const updateResult = await Hotel.updateOne(
        {
          _id: item.hotelId,
          'rooms.type': item.roomType,
          'rooms.quantity': { $gte: item.quantity }
        },
        {
          $inc: { 'rooms.$.quantity': -item.quantity }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error(`${item.roomType} 库存不足，无法扣减`);
      }

      console.log(`[队列] ✓ 库存扣减成功: ${item.roomType}`);
    }

    // 更新订单状态
    order.status = 'paid';
    await order.save();

    console.log(`[队列] ✓ 订单 ${orderId} 库存扣减完成`);
    return { status: 'success', orderId };
  } catch (error) {
    console.error(`[队列] ❌ 处理失败 (${orderId}):`, error.message);
    
    // 失败了，将在 stalledInterval 后重试
    // 最多重试 maxRetriesPerJob 次
    throw error;
  }
});

/**
 * 队列事件监听
 */
inventoryQueue.on('completed', (job) => {
  console.log(`[队列] ✓ 任务完成: ${job.id}, 订单: ${job.data.orderId}`);
});

inventoryQueue.on('failed', (job, error) => {
  console.error(`[队列] ✗ 任务失败: ${job.id}, 订单: ${job.data.orderId}, 原因: ${error.message}`);
});

inventoryQueue.on('error', (error) => {
  console.error(`[队列] 队列错误:`, error.message);
});

/**
 * 发送库存扣减消息到队列
 * @param {string} orderId - 订单ID
 * @param {array} items - 订单项目
 */
async function sendInventoryJob(orderId, items) {
  try {
    const job = await inventoryQueue.add(
      { orderId, items },
      {
        priority: 10,              // 优先级
        attempts: 3,               // 重试次数
        backoff: {
          type: 'exponential',
          delay: 2000              // 指数退避：2s, 4s, 8s...
        },
        removeOnComplete: true,    // 完成后删除任务
        removeOnFail: false        // 失败后保留，用于调试
      }
    );

    console.log(`[队列] 📤 已发送库存扣减任务: ${orderId}, 任务ID: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`[队列] 发送任务失败:`, error.message);
    throw error;
  }
}

/**
 * 获取队列状态
 */
async function getQueueStats() {
  const counts = await inventoryQueue.getJobCounts();
  const waiting = await inventoryQueue.getWaitingCount();
  const active = await inventoryQueue.getActiveCount();
  const completed = await inventoryQueue.getCompletedCount();
  const failed = await inventoryQueue.getFailedCount();

  return {
    waiting,
    active,
    completed,
    failed
  };
}

module.exports = {
  inventoryQueue,
  sendInventoryJob,
  getQueueStats
};
