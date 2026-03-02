const Cart = require('../models/Cart-mongoose');
const Hotel = require('../models/Hotel-mongoose');
const hotelVersion = require('../services/hotelVersion');

/**
 * 获取购物车
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId }).populate('items.hotelId');

    if (!cart) {
      cart = new Cart({ userId, items: [], total: 0, itemCount: 0 });
    }

    res.json({
      code: 200,
      message: '获取购物车成功',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取购物车失败',
      error: error.message
    });
  }
};

/**
 * 添加商品到购物车
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hotelId, roomType, checkInDate, checkOutDate, quantity = 1, version: clientVersion } = req.body;

    console.log('🛒 [CART] 接收到添加购物车请求:', {
      userId,
      hotelId,
      roomType,
      checkInDate,
      checkOutDate,
      quantity
    });

    // 验证参数
    if (!hotelId || !roomType || !checkInDate || !checkOutDate) {
      console.warn('⚠️ [CART] 参数缺失:', { hotelId, roomType, checkInDate, checkOutDate });
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 获取酒店信息
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      console.warn('⚠️ [CART] 酒店不存在:', hotelId);
      return res.status(404).json({
        code: 404,
        message: '酒店不存在'
      });
    }

    console.log('✓ [CART] 找到酒店:', hotel.nameCn);

    // 找到房型
    const room = hotel.rooms.find(r => r.type === roomType);
    if (!room) {
      console.warn('⚠️ [CART] 房型不存在:', roomType);
      return res.status(404).json({
        code: 404,
        message: '房型不存在'
      });
    }

    console.log('✓ [CART] 找到房型:', roomType);

    const currentVersion = await hotelVersion.getVersion(hotelId.toString());
    if (clientVersion != null && Number(clientVersion) !== Number(currentVersion)) {
      return res.status(409).json({
        code: 409,
        message: '价格或房态已变更，请刷新后重试',
        latestVersion: currentVersion,
        hotel: null,
      });
    }

    // 计算夜数
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      console.warn('⚠️ [CART] 日期无效：入住日期必须早于离店日期');
      return res.status(400).json({
        code: 400,
        message: '入住日期必须早于离店日期'
      });
    }

    console.log('✓ [CART] 计算夜数:', nights);

    const now = Date.now();
    let activePercent = 0;
    if (Array.isArray(hotel.discounts) && hotel.discounts.length > 0) {
      for (const d of hotel.discounts) {
        const p = typeof d.percentage === 'number' ? d.percentage : 0;
        const fromOk = !d.validFrom || new Date(d.validFrom).getTime() <= now;
        const toOk = !d.validTo || new Date(d.validTo).getTime() >= now;
        if (fromOk && toOk) {
          if (p > activePercent) activePercent = p;
        }
      }
    }
    if (activePercent < 0) activePercent = 0;
    if (activePercent > 100) activePercent = 100;
    const discountedPrice = Math.round(room.price * (1 - activePercent / 100) * 100) / 100;

    const cart = await Cart.addItem(userId, {
      hotelId,
      hotelName: hotel.nameCn,
      roomType,
      price: discountedPrice,
      originalPrice: room.price,
      discountPercent: activePercent,
      quantity,
      checkInDate,
      checkOutDate,
      nights,
      version: currentVersion,
    });

    console.log('✅ [CART] 成功添加到购物车，共', cart.items.length, '项');

    res.json({
      code: 200,
      message: '添加到购物车成功',
      data: cart
    });
  } catch (error) {
    console.error('❌ [CART] 添加购物车异常:', error.message);
    res.status(500).json({
      code: 500,
      message: '添加到购物车失败',
      error: error.message
    });
  }
};

/**
 * 更新购物车项
 */
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemIndex, quantity } = req.body;

    if (itemIndex === undefined || quantity === undefined) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    const cart = await Cart.updateItem(userId, itemIndex, quantity);

    res.json({
      code: 200,
      message: '更新购物车成功',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '更新购物车失败',
      error: error.message
    });
  }
};

/**
 * 删除购物车项
 */
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemIndex } = req.body;

    if (itemIndex === undefined) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    const cart = await Cart.removeItem(userId, itemIndex);

    res.json({
      code: 200,
      message: '删除购物车项成功',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除购物车项失败',
      error: error.message
    });
  }
};

/**
 * 清空购物车
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        code: 404,
        message: '购物车不存在'
      });
    }

    await cart.clear();

    res.json({
      code: 200,
      message: '清空购物车成功',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '清空购物车失败',
      error: error.message
    });
  }
};
