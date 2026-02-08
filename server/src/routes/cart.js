const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

// 所有购物车路由都需要认证
router.use(auth);

/**
 * 获取购物车
 * GET /api/cart
 */
router.get('/', cartController.getCart);

/**
 * 添加商品到购物车
 * POST /api/cart
 */
router.post('/', cartController.addToCart);

/**
 * 更新购物车项
 * PUT /api/cart/item
 */
router.put('/item', cartController.updateCartItem);

/**
 * 删除购物车项
 * DELETE /api/cart/item
 */
router.delete('/item', cartController.removeCartItem);

/**
 * 清空购物车
 * DELETE /api/cart
 */
router.delete('/', cartController.clearCart);

module.exports = router;
