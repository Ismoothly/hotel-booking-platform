/**
 * 参考实现：酒店路由的 MongoDB 版本
 * 
 * 此文件展示了如何将内存数据库路由转换为 MongoDB Mongoose 版本
 * 复制相关代码到你的 src/routes/hotels.js 中
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 导入 Mongoose 模型
const Hotel = require('../models/Hotel-mongoose');

// 导入认证中间件（假设已存在）
// const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /api/hotels
 * 获取酒店列表（支持过滤、搜索、分页）
 */
router.get('/', async (req, res) => {
  try {
    const {
      city,
      starRating,
      minPrice,
      maxPrice,
      keyword,
      sortBy = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // 构建查询条件
    const filters = { status: 'published' };

    if (city) {
      filters.city = city;
    }

    if (starRating) {
      filters.starRating = parseInt(starRating);
    }

    // 关键字搜索（使用文本索引）
    if (keyword) {
      filters.$text = { $search: keyword };
    }

    // 执行查询
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const hotels = await Hotel.find(filters)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // 获取总数用于分页
    const total = await Hotel.countDocuments(filters);

    res.json({
      success: true,
      data: hotels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('获取酒店列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取酒店列表失败'
    });
  }
});

/**
 * GET /api/hotels/:id
 * 获取单个酒店详情
 */
router.get('/:id', async (req, res) => {
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
  } catch (err) {
    console.error('获取酒店详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取酒店详情失败'
    });
  }
});

/**
 * POST /api/hotels
 * 创建新酒店（需要认证）
 */
router.post('/', async (req, res) => {
  try {
    const { nameCn, nameEn, address, city, starRating, rooms, ...otherData } = req.body;

    // 假设从认证中间件获取用户信息
    // const merchantId = req.user._id;
    const merchantId = req.header('X-Merchant-Id'); // 临时方案用于测试

    // 验证必需字段
    if (!nameCn || !nameEn || !address || !city || !starRating || !rooms || !rooms.length) {
      return res.status(400).json({
        success: false,
        message: '缺少必需字段'
      });
    }

    // 验证 merchantId 格式
    if (!mongooseObjects.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: '商户ID格式无效'
      });
    }

    // 创建酒店文档
    const hotel = new Hotel({
      nameCn,
      nameEn,
      address,
      city,
      starRating: parseInt(starRating),
      rooms,
      merchantId: new mongoose.Types.ObjectId(merchantId),
      ...otherData
    });

    // 保存到数据库
    await hotel.save();

    res.status(201).json({
      success: true,
      data: hotel,
      message: '酒店创建成功'
    });
  } catch (err) {
    console.error('创建酒店失败:', err);

    // 处理 Mongoose 验证错误
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: '创建酒店失败'
    });
  }
});

/**
 * PUT /api/hotels/:id
 * 更新酒店信息（需要认证和授权）
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    // 获取现有酒店
    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    // 检查权限（仅商户自己或管理员可以修改）
    // const userId = req.user._id;
    // if (hotel.merchantId.toString() !== userId.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: '没有权限修改此酒店'
    //   });
    // }

    // 更新字段
    Object.assign(hotel, req.body);

    // 保存更新
    await hotel.save();

    res.json({
      success: true,
      data: hotel,
      message: '酒店更新成功'
    });
  } catch (err) {
    console.error('更新酒店失败:', err);

    // 处理 Mongoose 验证错误
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: '更新酒店失败'
    });
  }
});

/**
 * DELETE /api/hotels/:id
 * 删除酒店（需要认证和授权）
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    const hotel = await Hotel.findByIdAndDelete(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    res.json({
      success: true,
      message: '酒店删除成功'
    });
  } catch (err) {
    console.error('删除酒店失败:', err);
    res.status(500).json({
      success: false,
      message: '删除酒店失败'
    });
  }
});

/**
 * GET /api/hotels/search/by-city
 * 按城市搜索酒店（带统计）
 */
router.get('/search/by-city', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: '城市参数不能为空'
      });
    }

    const hotels = await Hotel.aggregate([
      { $match: { city, status: 'published' } },
      { $sort: { averageRating: -1 } },
      {
        $project: {
          nameCn: 1,
          starRating: 1,
          averageRating: 1,
          price: { $min: '$rooms.price' },
          _id: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: hotels,
      count: hotels.length
    });
  } catch (err) {
    console.error('城市搜索失败:', err);
    res.status(500).json({
      success: false,
      message: '城市搜索失败'
    });
  }
});

/**
 * GET /api/hotels/popular
 * 获取热门酒店（按评分排序）
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const hotels = await Hotel.find({ status: 'published' })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(parseInt(limit))
      .select('nameCn city starRating averageRating totalReviews');

    res.json({
      success: true,
      data: hotels
    });
  } catch (err) {
    console.error('获取热门酒店失败:', err);
    res.status(500).json({
      success: false,
      message: '获取热门酒店失败'
    });
  }
});

/**
 * POST /api/hotels/:id/review-status
 * 更新酒店审核状态（管理员操作）
 */
router.post('/:id/review-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewStatus, reviewMessage } = req.body;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '酒店ID格式无效'
      });
    }

    // 验证审核状态值
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核状态'
      });
    }

    // 更新审核信息
    const hotel = await Hotel.findByIdAndUpdate(
      id,
      {
        reviewStatus,
        reviewMessage: reviewMessage || '',
        // reviewerId: req.user._id, // 假设有用户信息
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: '酒店不存在'
      });
    }

    res.json({
      success: true,
      data: hotel,
      message: '审核状态更新成功'
    });
  } catch (err) {
    console.error('更新审核状态失败:', err);
    res.status(500).json({
      success: false,
      message: '更新审核状态失败'
    });
  }
});

/**
 * 统计查询示例：获取商户的酒店统计
 */
router.get('/stats/by-merchant/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;

    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: '商户ID格式无效'
      });
    }

    const stats = await Hotel.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(merchantId) } },
      {
        $group: {
          _id: '$merchantId',
          totalHotels: { $sum: 1 },
          publishedHotels: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          totalBookings: { $sum: '$bookingCount' },
          averageRating: { $avg: '$averageRating' },
          avgReviewsPerHotel: { $avg: '$totalReviews' }
        }
      }
    ]);

    if (!stats.length) {
      return res.status(404).json({
        success: false,
        message: '商户不存在或没有酒店'
      });
    }

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (err) {
    console.error('获取商户统计失败:', err);
    res.status(500).json({
      success: false,
      message: '获取商户统计失败'
    });
  }
});

module.exports = router;
