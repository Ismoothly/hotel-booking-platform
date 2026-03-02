const Order = require('../models/Order-mongoose');
const Cart = require('../models/Cart-mongoose');
const Hotel = require('../models/Hotel-mongoose');
const { sendInventoryJob } = require('../services/inventoryQueue');

/**
 * 获取我的订单
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    const orders = await Order.find({ userId, ...filters })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('items.hotelId', 'nameZh city');

    const total = await Order.countDocuments({ userId, ...filters });

    res.json({
      code: 200,
      message: '获取订单列表成功',
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取订单列表失败',
      error: error.message
    });
  }
};

/**
 * 获取订单详情
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId, userId })
      .populate('userId', 'name email')
      .populate('items.hotelId');

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    res.json({
      code: 200,
      message: '获取订单详情成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取订单详情失败',
      error: error.message
    });
  }
};

/**
 * 创建订单 (从购物车结账)
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { guestName, guestPhone, guestEmail, notes, paymentMethod = 'alipay' } = req.body;

    console.log(`[订单] 用户 ${userId} 创建订单，客人: ${guestName}`);

    // 验证参数
    if (!guestName || !guestPhone) {
      console.warn(`[订单] 缺少客人信息: guestName=${guestName}, guestPhone=${guestPhone}`);
      return res.status(400).json({
        code: 400,
        message: '客人信息不完整'
      });
    }

    // 获取购物车
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      console.warn(`[订单] 购物车为空或不存在`);
      return res.status(400).json({
        code: 400,
        message: '购物车为空，无法结账'
      });
    }

    console.log(`[订单] 购物车商品数: ${cart.items.length}, 总金额: ${cart.total}`);

    // 严格验证库存（创建订单时提前检查）
    for (const item of cart.items) {
      const hotel = await Hotel.findById(item.hotelId);
      if (!hotel) {
        console.warn(`[订单] 酒店不存在: ${item.hotelId}`);
        return res.status(404).json({
          code: 404,
          message: `酒店 ${item.hotelName} 不存在`
        });
      }

      const room = hotel.rooms.find(r => r.type === item.roomType);
      if (!room) {
        console.warn(`[订单] 房型不存在: ${item.roomType}`);
        return res.status(404).json({
          code: 404,
          message: `房型 ${item.roomType} 不存在`
        });
      }

      // 使用 quantity 字段检查库存
      if (room.quantity < item.quantity) {
        console.warn(`[订单] 库存不足: ${item.roomType}, 需要${item.quantity}间, 可用${room.quantity}间`);
        return res.status(400).json({
          code: 400,
          message: `${item.roomType} 库存不足，仅剩 ${room.quantity} 间`
        });
      }
    }

    let originalTotalPrice = 0;
    for (const item of cart.items) {
      const op = item.originalPrice != null ? item.originalPrice : item.price;
      originalTotalPrice += op * item.quantity * item.nights;
    }
    originalTotalPrice = Math.round(originalTotalPrice * 100) / 100;
    const totalPrice = Math.round(cart.total * 100) / 100;
    let discountAmount = originalTotalPrice - totalPrice;
    if (discountAmount < 0) discountAmount = 0;

    const order = await Order.createOrder(userId, {
      items: cart.items,
      totalPrice: totalPrice,
      originalTotalPrice,
      discountAmount,
      guestName,
      guestPhone,
      guestEmail,
      notes,
      paymentMethod
    });

    console.log(`[订单] ✓ 订单创建成功: ${order.orderId}`);

    // 清空购物车
    await cart.clear();

    res.json({
      code: 200,
      message: '订单创建成功',
      data: order
    });
  } catch (error) {
    console.error(`[订单] 创建订单失败:`, error.message);
    res.status(500).json({
      code: 500,
      message: '创建订单失败',
      error: error.message
    });
  }
};

/**
 * 确认订单
 */
exports.confirmOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: '只能确认待支付订单'
      });
    }

    await order.confirm();

    res.json({
      code: 200,
      message: '订单确认成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '确认订单失败',
      error: error.message
    });
  }
};

/**
 * 模拟支付完成 (实际应连接支付网关)
 * 方案：使用消息队列实现最终一致性
 * 流程：支付 → 标记订单为已支付 → 发送库存扣减消息 → 异步消费扣库存 → 失败自动重试
 */
exports.completePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    console.log(`[支付] 用户 ${userId} 开始支付订单: ${orderId}`);

    // 1️⃣ 验证订单
    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        code: 400,
        message: '订单已支付，请勿重复支付'
      });
    }

    // 2️⃣ 标记订单为已支付（快速响应）
    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    order.updatedAt = new Date();
    await order.save();

    console.log(`[支付] ✓ 订单已标记为支付状态: ${orderId}`);

    // 3️⃣ 发送库存扣减消息到队列（异步处理）
    try {
      await sendInventoryJob(orderId, order.items);
      console.log(`[支付] 📤 已发送库存扣减任务到队列`);
    } catch (error) {
      console.error(`[支付] ⚠️ 发送队列任务失败:`, error.message);
      // 注意：这里不抛出错误，因为订单已经标记为支付，库存扣减稍后会重试
    }

    res.json({
      code: 200,
      message: '支付成功，库存处理中',
      data: order
    });
  } catch (error) {
    console.error(`[支付] 支付失败:`, error.message);
    
    res.status(500).json({
      code: 500,
      message: error.message || '支付失败',
      error: error.message
    });
  }
};

/**
 * 取消订单
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    await order.cancel(reason);

    res.json({
      code: 200,
      message: '订单取消成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '取消订单失败',
      error: error.message
    });
  }
};
