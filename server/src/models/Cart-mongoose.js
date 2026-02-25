const mongoose = require("mongoose");

/**
 * 购物车项 Schema
 */
const cartItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "酒店ID是必需的"],
    },
    hotelName: {
      type: String,
      required: true,
    },
    roomType: {
      type: String,
      required: [true, "房间类型是必需的"],
    },
    price: {
      type: Number,
      required: [true, "房间价格是必需的"],
      min: [0, "价格不能为负数"],
    },
    originalPrice: {
      type: Number,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "数量最少为1"],
    },
    checkInDate: {
      type: Date,
      required: [true, "入住日期是必需的"],
    },
    checkOutDate: {
      type: Date,
      required: [true, "离店日期是必需的"],
    },
    nights: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

/**
 * 购物车 Schema 定义
 */
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "用户ID是必需的"],
    index: true,
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0,
  },
  itemCount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 计算购物车总价和项数
 */
cartSchema.methods.calculateTotal = function () {
  this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.itemCount = this.items.length;
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 添加商品到购物车
 */
cartSchema.statics.addItem = async function (userId, itemData) {
  const {
    hotelId,
    hotelName,
    roomType,
    price,
    originalPrice,
    discountPercent,
    quantity,
    checkInDate,
    checkOutDate,
    nights,
  } = itemData;

  let cart = await this.findOne({ userId });

  if (!cart) {
    cart = new this({ userId, items: [] });
  }

  // 检查是否已存在相同的酒店和房型
  const existingItem = cart.items.find(
    (item) =>
      item.hotelId.toString() === hotelId.toString() &&
      item.roomType === roomType &&
      item.checkInDate.getTime() === new Date(checkInDate).getTime() &&
      item.checkOutDate.getTime() === new Date(checkOutDate).getTime(),
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.subtotal =
      existingItem.price * existingItem.quantity * existingItem.nights;
  } else {
    const subtotal = price * quantity * nights;
    cart.items.push({
      hotelId,
      hotelName,
      roomType,
      price,
      originalPrice: originalPrice != null ? originalPrice : price,
      discountPercent: discountPercent != null ? discountPercent : 0,
      quantity,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      nights,
      subtotal,
    });
  }

  await cart.calculateTotal();
  return cart;
};

/**
 * 更新购物车项
 */
cartSchema.statics.updateItem = async function (userId, itemIndex, quantity) {
  const cart = await this.findOne({ userId });

  if (!cart || !cart.items[itemIndex]) {
    throw new Error("购物车项不存在");
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const item = cart.items[itemIndex];
    item.quantity = quantity;
    item.subtotal = item.price * quantity * item.nights;
  }

  await cart.calculateTotal();
  return cart;
};

/**
 * 删除购物车项
 */
cartSchema.statics.removeItem = async function (userId, itemIndex) {
  const cart = await this.findOne({ userId });

  if (!cart || !cart.items[itemIndex]) {
    throw new Error("购物车项不存在");
  }

  cart.items.splice(itemIndex, 1);
  await cart.calculateTotal();
  return cart;
};

/**
 * 清空购物车
 */
cartSchema.methods.clear = function () {
  this.items = [];
  this.total = 0;
  this.itemCount = 0;
  this.updatedAt = new Date();
  return this.save();
};

// 创建索引
cartSchema.index({ userId: 1 });

// 创建模型
const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
