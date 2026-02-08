const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * 用户 Schema 定义
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [3, '用户名长度至少为3个字符'],
    maxlength: [30, '用户名长度不能超过30个字符'],
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码长度至少为6个字符'],
    select: false // 默认不返回密码字段
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请提供有效的邮箱地址'],
    index: true
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'merchant', 'customer'],
      message: '角色只能是：admin（管理员），merchant（商户），customer（客户）'
    },
    default: 'customer',
    lowercase: true
  },
  refreshTokens: {
    type: [String],
    default: [],
    select: false // 默认不返回refresh tokens
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date,
    default: null
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
  collection: 'users'
});

/**
 * 在保存前哈希密码
 */
userSchema.pre('save', async function(next) {
  // 只在密码被修改时进行哈希
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * 在更新前哈希密码（用于 findByIdAndUpdate 等操作）
 */
userSchema.pre('findByIdAndUpdate', async function(next) {
  if (this._update.password) {
    try {
      const hashedPassword = await bcrypt.hash(this._update.password, 10);
      this._update.password = hashedPassword;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

/**
 * 比对密码的实例方法
 */
userSchema.methods.comparePassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

/**
 * 获取用户公开信息（不返回敏感字段）
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.__v;
  return user;
};

/**
 * 添加 Refresh Token
 */
userSchema.methods.addRefreshToken = function(token) {
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  this.refreshTokens.push(token);
  return this.save();
};

/**
 * 替换 Refresh Token
 */
userSchema.methods.replaceRefreshToken = function(oldToken, newToken) {
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  this.refreshTokens = this.refreshTokens.filter(t => t !== oldToken);
  this.refreshTokens.push(newToken);
  return this.save();
};

/**
 * 删除 Refresh Token
 */
userSchema.methods.removeRefreshToken = function(token) {
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  this.refreshTokens = this.refreshTokens.filter(t => t !== token);
  return this.save();
};

/**
 * 查询用户（不返回密码的静态方法）
 */
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

/**
 * 创建用户的静态方法
 */
userSchema.statics.createUser = async function(userData) {
  // 检查用户名或邮箱是否已存在
  const existingUser = await this.findOne({
    $or: [
      { username: userData.username.toLowerCase() },
      { email: userData.email.toLowerCase() }
    ]
  });

  if (existingUser) {
    if (existingUser.username === userData.username.toLowerCase()) {
      throw new Error('用户名已存在');
    } else {
      throw new Error('邮箱已被注册');
    }
  }

  // 创建新用户
  const user = new this({
    username: userData.username.toLowerCase(),
    password: userData.password,
    email: userData.email.toLowerCase(),
    role: userData.role || 'customer'
  });

  return await user.save();
};

// 创建索引
userSchema.index({ username: 1, email: 1 });
userSchema.index({ role: 1, isActive: 1 });

// 创建模型
const User = mongoose.model('User', userSchema);

module.exports = User;
