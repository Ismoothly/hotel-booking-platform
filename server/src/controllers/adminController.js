const HotelModel = require('../models/Hotel');

/**
 * 获取所有酒店（包括未发布的）
 */
exports.getAllHotels = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      reviewStatus: req.query.reviewStatus,
      merchantId: req.query.merchantId
    };

    const hotels = await HotelModel.findAll(filters);

    res.json({
      success: true,
      data: hotels,
      total: hotels.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取酒店列表失败'
    });
  }
};

/**
 * 获取待审核的酒店列表
 */
exports.getPendingHotels = async (req, res) => {
  try {
    const hotels = await HotelModel.findAll({ 
      reviewStatus: 'pending' 
    });

    res.json({
      success: true,
      data: hotels,
      total: hotels.length
    });
  } catch (error) {
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
    const hotel = await HotelModel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    const updatedHotel = await HotelModel.updateReviewStatus(
      req.params.id, 
      'approved', 
      '审核通过'
    );

    res.json({
      success: true,
      message: '审核通过',
      data: updatedHotel
    });
  } catch (error) {
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
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '请提供拒绝原因'
      });
    }

    const hotel = await HotelModel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    const updatedHotel = await HotelModel.updateReviewStatus(
      req.params.id, 
      'rejected', 
      reason
    );

    res.json({
      success: true,
      message: '已拒绝',
      data: updatedHotel
    });
  } catch (error) {
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
    const hotel = await HotelModel.findById(req.params.id);

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

    const updatedHotel = await HotelModel.updateStatus(req.params.id, 'published');

    res.json({
      success: true,
      message: '酒店已发布',
      data: updatedHotel
    });
  } catch (error) {
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
    const hotel = await HotelModel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    const updatedHotel = await HotelModel.updateStatus(req.params.id, 'unpublished');

    res.json({
      success: true,
      message: '酒店已下线',
      data: updatedHotel
    });
  } catch (error) {
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
    const hotel = await HotelModel.findById(req.params.id);

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

    const updatedHotel = await HotelModel.updateStatus(req.params.id, 'published');

    res.json({
      success: true,
      message: '酒店已恢复',
      data: updatedHotel
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '恢复失败'
    });
  }
};
