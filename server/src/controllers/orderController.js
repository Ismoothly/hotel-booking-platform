const Order = require('../models/Order-mongoose');
const Cart = require('../models/Cart-mongoose');
const Hotel = require('../models/Hotel-mongoose');
const hotelVersion = require('../services/hotelVersion');
const { notifyHotelUpdate } = require('../services/notifyHotelUpdate');

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

    // 版本校验：若购物车项带有 version，需与当前酒店版本一致
    for (const item of cart.items) {
      const hid = item.hotelId.toString();
      const currentVersion = await hotelVersion.getVersion(hid);
      const itemVersion = item.version != null ? Number(item.version) : null;
      if (itemVersion != null && itemVersion !== currentVersion) {
        return res.status(409).json({
          code: 409,
          message: '价格或房态已变更，请刷新后重试',
          latestVersion: currentVersion,
        });
      }
    }

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
 * 使用 MongoDB 事务确保原子性，防止超卖
 */
exports.completePayment = async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    console.log(`[支付] 用户 ${userId} 开始支付订单: ${orderId}`);

    const order = await Order.findOne({ orderId, userId }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    if (order.paymentStatus === 'paid') {
      await session.abortTransaction();
      return res.status(400).json({
        code: 400,
        message: '订单已支付，请勿重复支付'
      });
    }

    // 事务中扣减库存，使用乐观锁防止并发超卖
    for (const item of order.items) {
      console.log(`[支付] 扣减库存: 酒店ID=${item.hotelId}, 房型=${item.roomType}, 数量=${item.quantity}`);

      // 使用原子操作扣减库存
      const hotel = await Hotel.findById(item.hotelId).session(session);
      
      if (!hotel) {
        throw new Error(`酒店 ${item.hotelName} 不存在`);
      }

      const room = hotel.rooms.find(r => r.type === item.roomType);
      if (!room) {
        throw new Error(`房型 ${item.roomType} 不存在`);
      }

      // 检查库存（quantity 字段）
      if (room.quantity < item.quantity) {
        throw new Error(`${item.roomType} 库存不足，仅剩 ${room.quantity} 间`);
      }

      // 使用原子操作扣减库存
      const updateResult = await Hotel.updateOne(
        {
          _id: item.hotelId,
          'rooms.type': item.roomType,
          'rooms.quantity': { $gte: item.quantity } // 确保库存充足
        },
        {
          $inc: { 'rooms.$.quantity': -item.quantity }
        },
        { session }
      );

      // 检查是否成功更新（乐观锁）
      if (updateResult.modifiedCount === 0) {
        throw new Error(`${item.roomType} 库存不足或已被其他用户预订`);
      }

      console.log(`[支付] ✓ 库存扣减成功: ${item.roomType}`);
    }

    // 标记订单为已支付
    await order.markAsPaid();
    await order.save({ session });

    console.log(`[支付] ✓ 订单 ${orderId} 支付成功`);

    // 提交事务
    await session.commitTransaction();

    // 支付成功后递增酒店版本并推送，以便列表/详情/购物车实时更新房态
    for (const item of order.items) {
      const hid = item.hotelId.toString();
      const newVersion = await hotelVersion.incVersion(hid);
      notifyHotelUpdate(hid, newVersion);
    }

    res.json({
      code: 200,
      message: '支付成功',
      data: order
    });
  } catch (error) {
    // 回滚事务
    await session.abortTransaction();
    console.error(`[支付] 支付失败:`, error.message);
    
    res.status(500).json({
      code: 500,
      message: error.message || '支付失败',
      error: error.message
    });
  } finally {
    session.endSession();
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
