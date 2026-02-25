const Order = require('../models/Order-mongoose');
const Cart = require('../models/Cart-mongoose');
const Hotel = require('../models/Hotel-mongoose');

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

    // 验证库存 (可选，这里假设库存充足)
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
      if (!room || room.available < item.quantity) {
        console.warn(`[订单] 库存不足: ${item.roomType}, 需要${item.quantity}间, 可用${room ? room.available : 0}间`);
        return res.status(400).json({
          code: 400,
          message: `${item.roomType} 房型库存不足，仅剩 ${room ? room.available : 0} 间`
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
 */
exports.completePayment = async (req, res) => {
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

    // 这里应该验证支付结果，现在仅演示
    await order.markAsPaid();

    // 更新酒店库存 (模拟)
    for (const item of order.items) {
      await Hotel.findByIdAndUpdate(
        item.hotelId,
        { $inc: { 'rooms.$[elem].available': -item.quantity } },
        { arrayFilters: [{ 'elem.type': item.roomType }] }
      );
    }

    res.json({
      code: 200,
      message: '支付成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '支付失败',
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
