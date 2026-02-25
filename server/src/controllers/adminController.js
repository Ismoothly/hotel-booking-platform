const Hotel = require('../models/Hotel-mongoose');
const mongoose = require('mongoose');

/**
 * 获取所有酒店（包括未发布的）- 支持分页
 */
exports.getAllHotels = async (req, res) => {
  try {
    const { status, reviewStatus, merchantId, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (reviewStatus) query.reviewStatus = reviewStatus;
    if (merchantId) {
      if (!mongoose.Types.ObjectId.isValid(merchantId)) {
        return res.status(400).json({
          success: false,
          message: '商户ID格式无效'
        });
      }
      query.merchantId = merchantId;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [hotels, total] = await Promise.all([
      Hotel.find(query)
        .populate('merchantId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Hotel.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: hotels,
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('获取酒店列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取酒店列表失败'
    });
  }
};

/**
 * 获取待审核的酒店列表 - 支持分页
 */
exports.getPendingHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [hotels, total] = await Promise.all([
      Hotel.find({ reviewStatus: 'pending' })
        .populate('merchantId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Hotel.countDocuments({ reviewStatus: 'pending' })
    ]);

    res.json({
      success: true,
      data: hotels,
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('获取待审核酒店列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取待审核酒店列表失败'
    });
  }
};

/**
 * 审核通过
 */
exports.approveHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    hotel.reviewStatus = 'approved';
    hotel.reviewMessage = '审核通过';
    hotel.reviewedAt = new Date();
    await hotel.save();

    res.json({
      success: true,
      message: '审核通过',
      data: hotel
    });
  } catch (error) {
    console.error('审核失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '审核失败'
    });
  }
};

/**
 * 审核拒绝
 */
exports.rejectHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '请提供拒绝原因'
      });
    }

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    hotel.reviewStatus = 'rejected';
    hotel.reviewMessage = reason;
    hotel.reviewedAt = new Date();
    await hotel.save();

    res.json({
      success: true,
      message: '已拒绝',
      data: hotel
    });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '操作失败'
    });
  }
};

/**
 * 发布酒店
 */
exports.publishHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    if (hotel.reviewStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: '只有审核通过的酒店才能发布'
      });
    }

    hotel.status = 'published';
    await hotel.save();

    res.json({
      success: true,
      message: '酒店已发布',
      data: hotel
    });
  } catch (error) {
    console.error('发布失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '发布失败'
    });
  }
};

/**
 * 下线酒店
 */
exports.unpublishHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    hotel.status = 'unpublished';
    // 下线后需重新审核方可再次上线
    hotel.reviewStatus = 'pending';
    hotel.reviewMessage = '';
    hotel.reviewedAt = null;
    hotel.reviewerId = null;
    await hotel.save();

    res.json({
      success: true,
      message: '酒店已下线，再次上线需重新审核',
      data: hotel
    });
  } catch (error) {
    console.error('下线失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '下线失败'
    });
  }
};

/**
 * 恢复已下线的酒店
 */
exports.restoreHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    if (hotel.status !== 'unpublished') {
      return res.status(400).json({
        success: false,
        message: '只能恢复已下线的酒店'
      });
    }

    hotel.status = 'published';
    await hotel.save();

    res.json({
      success: true,
      message: '酒店已恢复',
      data: hotel
    });
  } catch (error) {
    console.error('恢复失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '恢复失败'
    });
  }
};
