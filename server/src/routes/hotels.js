const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { auth, authorize } = require('../middleware/auth');

// 公开路由 - 无需认证
router.get('/', hotelController.getHotels);
router.get('/:id', hotelController.getHotelById);

// 商户路由 - 需要商户或管理员权限
router.use(auth); // 以下所有路由都需要认证

// 获取商户自己的酒店列表
router.get('/merchant/my-hotels', authorize('merchant', 'admin'), hotelController.getMerchantHotels);

// 创建酒店
router.post('/', authorize('merchant', 'admin'), hotelController.createHotel);

// 更新酒店
router.put('/:id', authorize('merchant', 'admin'), hotelController.updateHotel);

// 删除酒店
router.delete('/:id', authorize('merchant', 'admin'), hotelController.deleteHotel);

module.exports = router;
