const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');
const { orderLimiter, paymentLimiter } = require('../middleware/rateLimiter');

// 所有订单路由都需要认证
router.use(auth);

/**
 * 获取我的订单列表
 * GET /api/orders
 */
router.get('/', orderController.getMyOrders);

/**
 * 创建订单 (从购物车结账)
 * POST /api/orders
 * 应用订单限流，防止恶意刷单
 */
router.post('/', orderLimiter, orderController.createOrder);

/**
 * 获取订单详情
 * GET /api/orders/:orderId
 */
router.get('/:orderId', orderController.getOrderDetail);

/**
 * 确认订单
 * PUT /api/orders/:orderId/confirm
 */
router.put('/:orderId/confirm', orderController.confirmOrder);

/**
 * 完成支付
 * PUT /api/orders/:orderId/pay
 * 应用支付限流，防止重复支付攻击
 */
router.put('/:orderId/pay', paymentLimiter, orderController.completePayment);

/**
 * 取消订单
 * PUT /api/orders/:orderId/cancel
 */
router.put('/:orderId/cancel', orderController.cancelOrder);

module.exports = router;
