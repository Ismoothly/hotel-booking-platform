const HotelModel = require('../models/Hotel');

/**
 * 获取酒店列表
 */
exports.getHotels = async (req, res) => {
  try {
    const filters = {
      city: req.query.city,
      starRating: req.query.starRating,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      keyword: req.query.keyword,
      sortBy: req.query.sortBy,
      status: 'published' // 只返回已发布的酒店
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
 * 获取酒店详情
 */
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await HotelModel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    res.json({
      success: true,
      data: hotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取酒店详情失败'
    });
  }
};

/**
 * 创建酒店（商户）
 */
exports.createHotel = async (req, res) => {
  try {
    const hotelData = req.body;

    // 验证必填字段
    const requiredFields = ['nameCn', 'nameEn', 'address', 'starRating', 'openingDate', 'rooms'];
    const missingFields = requiredFields.filter(field => !hotelData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    // 验证房型数据
    if (!Array.isArray(hotelData.rooms) || hotelData.rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要一个房型'
      });
    }

    const hotel = await HotelModel.create(hotelData, req.user.id);

    res.status(201).json({
      success: true,
      message: '酒店创建成功',
      data: hotel
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '创建酒店失败'
    });
  }
};

/**
 * 更新酒店（商户）
 */
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await HotelModel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    // 验证权限：只能更新自己的酒店
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限更新此酒店'
      });
    }

    const updatedHotel = await HotelModel.update(req.params.id, req.body);

    res.json({
      success: true,
      message: '酒店更新成功',
      data: updatedHotel
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '更新酒店失败'
    });
  }
};

/**
 * 删除酒店（商户）
 */
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await HotelModel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    // 验证权限：只能删除自己的酒店
    if (hotel.merchantId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此酒店'
      });
    }

    await HotelModel.delete(req.params.id);

    res.json({
      success: true,
      message: '酒店删除成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '删除酒店失败'
    });
  }
};

/**
 * 获取商户的酒店列表
 */
exports.getMerchantHotels = async (req, res) => {
  try {
    const hotels = await HotelModel.findAll({ 
      merchantId: req.user.id 
    });

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
