const mongoose = require('mongoose');

/**
 * 房间类型 Schema
 */
const roomSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, '房间类型是必需的'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, '房间价格是必需的'],
    min: [0, '价格不能为负数']
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: [0, '房间数量不能为负数']
  },
  _id: false
}, { _id: false });

/**
 * 折扣 Schema
 */
const discountSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  validFrom: {
    type: Date
  },
  validTo: {
    type: Date
  },
  _id: false
}, { _id: false });

/**
 * 酒店 Schema 定义
 */
const hotelSchema = new mongoose.Schema({
  nameCn: {
    type: String,
    required: [true, '酒店中文名称是必需的'],
    trim: true,
    index: true
  },
  nameEn: {
    type: String,
    required: [true, '酒店英文名称是必需的'],
    trim: true,
    index: true
  },
  address: {
    type: String,
    required: [true, '酒店地址是必需的'],
    trim: true,
    index: true
  },
  city: {
    type: String,
    required: [true, '城市是必需的'],
    trim: true,
    index: true
  },
  starRating: {
    type: Number,
    required: [true, '星级是必需的'],
    enum: {
      values: [1, 2, 3, 4, 5],
      message: '星级必须在1-5之间'
    },
    index: true
  },
  openingDate: {
    type: Date,
    required: [true, '开业日期是必需的']
  },
  images: {
    type: [String],
    default: []
  },
  rooms: {
    type: [roomSchema],
    required: [true, '房间信息是必需的'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: '至少需要一种房间类型'
    }
  },
  facilities: {
    type: [String],
    default: []
  },
  nearbyAttractions: {
    type: [String],
    default: []
  },
  transportation: {
    type: String,
    trim: true
  },
  nearbyShopping: {
    type: [String],
    default: []
  },
  discounts: {
    type: [discountSchema],
    default: []
  },
  description: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true
  },
  // 状态管理
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending', 'approved', 'published', 'unpublished'],
      message: '状态值无效'
    },
    default: 'draft',
    index: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '商户ID是必需的'],
    index: true
  },
  reviewStatus: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: '审核状态值无效'
    },
    default: 'pending',
    index: true
  },
  reviewMessage: {
    type: String,
    default: '',
    trim: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  // 统计数据
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'hotels'
});

/**
 * 创建文本索引用于搜索
 */
hotelSchema.index({
  nameCn: 'text',
  nameEn: 'text',
  address: 'text',
  description: 'text'
});

/**
 * 创建复合索引用于查询优化
 */
hotelSchema.index({ merchantId: 1, status: 1 });
hotelSchema.index({ city: 1, starRating: 1, status: 1 });
hotelSchema.index({ status: 1, reviewStatus: 1 });

/**
 * 在保存前触发的钩子
 */
hotelSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * 获取最低价格的实例方法
 */
hotelSchema.methods.getMinPrice = function() {
  if (!this.rooms || this.rooms.length === 0) {
    return 0;
  }
  return Math.min(...this.rooms.map(room => room.price));
};

/**
 * 获取最高价格的实例方法
 */
hotelSchema.methods.getMaxPrice = function() {
  if (!this.rooms || this.rooms.length === 0) {
    return 0;
  }
  return Math.max(...this.rooms.map(room => room.price));
};

/**
 * 添加优评的静态查询方法
 */
hotelSchema.statics.findByMerchant = function(merchantId) {
  return this.find({ merchantId });
};

/**
 * 查询待审核酒店
 */
hotelSchema.statics.findPendingReview = function() {
  return this.find({ reviewStatus: 'pending' }).sort({ createdAt: -1 });
};

/**
 * 查询已发布的酒店
 */
hotelSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isActive: true });
};

/**
 * 创建或更新酒店时更新时间戳
 */
hotelSchema.pre('findByIdAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 创建模型
const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = Hotel;
