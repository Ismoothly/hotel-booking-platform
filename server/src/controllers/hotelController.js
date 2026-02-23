const Hotel = require('../models/Hotel-mongoose');
const mongoose = require('mongoose');

/**
 * 获取酒店列表
 */
exports.getHotels = async (req, res) => {
  try {
    const {
      city,
      starRating,
      minPrice,
      maxPrice,
      keyword,
      facilities,
      page = 1,
      limit = 10
    } = req.query;

    // sortBy 需要特殊处理，避免空字符串
    const sortBy = req.query.sortBy && req.query.sortBy.trim() !== '' 
      ? req.query.sortBy 
      : '-createdAt';

    // 构建查询条件
    const query = { status: 'published' };

    if (city) {
      // 支持模糊匹配：天津可以匹配"天津"或"天津市"
      query.city = new RegExp(`^${city}`, 'i');
    }

    if (starRating) {
      query.starRating = parseInt(starRating);
    }

    // 关键字搜索（使用文本索引）
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // 设施筛选
    if (facilities) {
      query.facilities = { $in: [facilities] };
    }

    // 执行查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const hotels = await Hotel.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // 获取总数
    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: hotels,
      total,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
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
 * 获取酒店详情
 */
exports.getHotelById = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findById(id).populate('merchantId', 'username email');

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
    console.error('获取酒店详情失败:', error);
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
    const { nameCn, nameEn, address, city, starRating, openingDate, rooms, ...otherData } = req.body;

    // 验证必填字段
    if (!nameCn || !nameEn || !address || !city || !starRating || !openingDate || !rooms || !rooms.length) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    // 验证房型数据
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要一个房型'
      });
    }

    // 创建酒店文档
    const hotel = new Hotel({
      nameCn,
      nameEn,
      address,
      city,
      starRating: parseInt(starRating),
      openingDate,
      rooms,
      merchantId: req.user.id,
      ...otherData
    });

    await hotel.save();

    res.status(201).json({
      success: true,
      message: '酒店创建成功，等待管理员审核',
      data: hotel
    });
  } catch (error) {
    console.error('创建酒店失败:', error);

    // 处理 Mongoose 验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: messages
      });
    }

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

    // 验证权限：只能更新自己的酒店
    if (hotel.merchantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限更新此酒店'
      });
    }

    // 更新字段
    Object.assign(hotel, req.body);
    // 商家更新信息后需重新审核，发布状态改为草稿；管理员更新不改变审核与发布状态
    if (req.user.role === 'merchant') {
      hotel.reviewStatus = 'pending';
      hotel.reviewMessage = '';
      hotel.reviewedAt = null;
      hotel.reviewerId = null;
      hotel.status = 'draft';
    }
    await hotel.save();

    res.json({
      success: true,
      message: '酒店更新成功',
      data: hotel
    });
  } catch (error) {
    console.error('更新酒店失败:', error);

    // 处理 Mongoose 验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: messages
      });
    }

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

    // 验证权限：只能删除自己的酒店
    if (hotel.merchantId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限删除此酒店'
      });
    }

    await Hotel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '酒店删除成功'
    });
  } catch (error) {
    console.error('删除酒店失败:', error);
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
    const hotels = await Hotel.find({ 
      merchantId: req.user.id 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: hotels,
      total: hotels.length
    });
  } catch (error) {
    console.error('获取商户酒店列表失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取酒店列表失败'
    });
  }
};
