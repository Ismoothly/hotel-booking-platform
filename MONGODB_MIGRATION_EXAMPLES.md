/**
 * 迁移示例：从内存数据库到 MongoDB
 * 
 * 本文件展示了如何更新现有的控制器代码以使用 Mongoose 模型
 */

// ============================================
// 示例 1: 用户认证控制器迁移
// ============================================

// 旧代码 (内存数据库)
/*
const UserModel = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    const user = await UserModel.create({
      username,
      password,
      email,
      role
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
*/

// 新代码 (MongoDB)
const User = require('../models/User-mongoose');

exports.register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    
    // Mongoose 自动处理密码加密
    const user = await User.createUser({
      username,
      password,
      email,
      role
    });
    
    // 返回用户信息（不包含敏感字段）
    res.json({ 
      success: true, 
      data: user.toJSON() 
    });
  } catch (err) {
    // 处理特定的 MongoDB 错误
    if (err.message.includes('已存在')) {
      return res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '注册失败' 
    });
  }
};

// ============================================
// 示例 2: 登录控制器迁移
// ============================================

// 旧代码
/*
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findByUsername(username);
  
  if (!user || !await UserModel.comparePassword(password, user.password)) {
    return res.status(401).json({ 
      success: false, 
      message: '用户名或密码错误' 
    });
  }
};
*/

// 新代码
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查询用户并包含密码字段用于比对
    const user = await User.findByUsername(username).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 使用 Mongoose 方法比对密码
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    res.json({ 
      success: true, 
      data: user.toJSON() 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: '登录失败' 
    });
  }
};

// ============================================
// 示例 3: 酒店管理控制器迁移
// ============================================

const Hotel = require('../models/Hotel-mongoose');
const mongoose = require('mongoose');

// 创建酒店
exports.createHotel = async (req, res) => {
  try {
    const { nameCn, nameEn, address, city, starRating, rooms, ...otherData } = req.body;
    const merchantId = req.user.id; // 从认证中间件获取
    
    // 验证 merchantId 是否为有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({ 
        success: false, 
        message: '商户ID格式无效' 
      });
    }
    
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
    
    await hotel.save();
    
    res.status(201).json({ 
      success: true, 
      data: hotel 
    });
  } catch (err) {
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
};

// 查询酒店（带过滤和搜索）
exports.getHotels = async (req, res) => {
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
    const query = { status: 'published' };
    
    if (city) {
      query.city = city;
    }
    
    if (starRating) {
      query.starRating = parseInt(starRating);
    }
    
    // 价格范围过滤（使用房间价格）
    if (minPrice || maxPrice) {
      query.$expr = { $and: [] };
      
      if (minPrice) {
        query.$expr.$and.push({
          $gte: [{ $min: '$rooms.price' }, parseFloat(minPrice)]
        });
      }
      
      if (maxPrice) {
        query.$expr.$and.push({
          $lte: [{ $min: '$rooms.price' }, parseFloat(maxPrice)]
        });
      }
    }
    
    // 关键字搜索（使用文本索引）
    if (keyword) {
      query.$text = { $search: keyword };
    }
    
    // 执行查询
    const hotels = await Hotel.find(query)
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // 获取总数
    const total = await Hotel.countDocuments(query);
    
    res.json({ 
      success: true,
      data: hotels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: '查询失败' 
    });
  }
};

// 获取单个酒店
exports.getHotelById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID 格式无效' 
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
    res.status(500).json({ 
      success: false, 
      message: '查询失败' 
    });
  }
};

// 更新酒店
exports.updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID 格式无效' 
      });
    }
    
    // 使用 findByIdAndUpdate 自动触发 pre 钩子更新 updatedAt
    const hotel = await Hotel.findByIdAndUpdate(
      id,
      { $set: req.body },
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
      data: hotel 
    });
  } catch (err) {
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
      message: '更新失败' 
    });
  }
};

// 删除酒店
exports.deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证 ObjectId 格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID 格式无效' 
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
      message: '删除成功' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: '删除失败' 
    });
  }
};

// ============================================
// 示例 4: 批量操作和聚合查询
// ============================================

// 获取热门酒店（按评分排序）
exports.getPopularHotels = async (req, res) => {
  try {
    const hotels = await Hotel.aggregate([
      { $match: { status: 'published' } },
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: 10 },
      {
        $project: {
          nameCn: 1,
          starRating: 1,
          averageRating: 1,
          totalReviews: 1,
          minPrice: { $min: '$rooms.price' }
        }
      }
    ]);
    
    res.json({ 
      success: true, 
      data: hotels 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: '查询失败' 
    });
  }
};

// 获取商户统计信息
exports.getMerchantStats = async (req, res) => {
  try {
    const merchantId = req.user.id;
    
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
          averageRating: { $avg: '$averageRating' }
        }
      }
    ]);
    
    res.json({ 
      success: true, 
      data: stats[0] || {} 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: '查询失败' 
    });
  }
};

// ============================================
// 核心差异总结
// ============================================

/*
1. **ID 管理**
   - 旧：手动生成 UUID（require('uuid').v4()）
   - 新：MongoDB 自动生成 ObjectId
   
2. **查询操作**
   - 旧：数组遍历和过滤
   - 新：MongoDB 查询语句（$match, $gte, $lte 等）
   
3. **密码管理**
   - 旧：手动调用 bcrypt.hash/compare
   - 新：Mongoose pre-save 钩子自动处理
   
4. **错误处理**
   - 旧：自定义错误
   - 新：Mongoose ValidationError, CastError 等
   
5. **数据关联**
   - 旧：手动拼接数据
   - 新：使用 populate() 自动关联
   
6. **批量操作**
   - 旧：循环替换
   - 新：使用聚合管道（aggregate）
*/
