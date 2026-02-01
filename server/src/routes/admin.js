const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

// 所有管理员路由都需要管理员权限
router.use(auth, authorize('admin'));

// 获取所有酒店（包括未发布的）
router.get('/hotels', adminController.getAllHotels);

// 获取待审核的酒店
router.get('/hotels/pending', adminController.getPendingHotels);

// 审核通过
router.put('/hotels/:id/approve', adminController.approveHotel);

// 审核拒绝
router.put('/hotels/:id/reject', adminController.rejectHotel);

// 发布酒店
router.put('/hotels/:id/publish', adminController.publishHotel);

// 下线酒店
router.put('/hotels/:id/unpublish', adminController.unpublishHotel);

// 恢复已下线的酒店
router.put('/hotels/:id/restore', adminController.restoreHotel);

module.exports = router;
