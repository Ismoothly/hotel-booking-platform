const mongoose = require("mongoose");

/**
 * 订单项 Schema
 */
const orderItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    hotelName: {
      type: String,
      required: true,
    },
    roomType: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
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
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

/**
 * 订单 Schema 定义
 */
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "用户ID是必需的"],
    index: true,
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: [true, "总价是必需的"],
    min: [0, "总价不能为负数"],
  },
  originalTotalPrice: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "confirmed", "paid", "cancelled"],
      message: "订单状态只能是: pending, confirmed, paid, cancelled",
    },
    default: "pending",
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ["alipay", "wechat", "card"],
      message: "支付方式只能是: alipay, wechat, card",
    },
    default: "alipay",
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ["unpaid", "paid", "failed"],
      message: "支付状态只能是: unpaid, paid, failed",
    },
    default: "unpaid",
  },
  guestName: {
    type: String,
    required: [true, "客人姓名是必需的"],
  },
  guestPhone: {
    type: String,
    required: [true, "客人电话是必需的"],
  },
  guestEmail: {
    type: String,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  cancelReason: {
    type: String,
  },
  cancelledAt: {
    type: Date,
  },
  confirmedAt: {
    type: Date,
  },
  paidAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * 生成订单ID (格式: ORD-TIMESTAMP-RANDOM)
 */
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

/**
 * 获取订单列表
 */
orderSchema.statics.getOrders = async function (userId, filters = {}) {
  const query = { userId };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("userId", "name email")
    .populate("items.hotelId", "name city");
};

/**
 * 确认订单
 */
orderSchema.methods.confirm = function () {
  this.status = "confirmed";
  this.confirmedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 标记为已支付
 */
orderSchema.methods.markAsPaid = function () {
  this.status = "paid";
  this.paymentStatus = "paid";
  this.paidAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 取消订单
 */
orderSchema.methods.cancel = function (reason = "") {
  if (this.status === "paid" || this.status === "confirmed") {
    throw new Error("已确认或已支付的订单无法取消");
  }
  this.status = "cancelled";
  this.cancelReason = reason;
  this.cancelledAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

/**
 * 创建订单
 */
orderSchema.statics.createOrder = async function (userId, orderData) {
  const {
    items,
    totalPrice,
    originalTotalPrice,
    discountAmount,
    guestName,
    guestPhone,
    guestEmail,
    notes,
    paymentMethod,
  } = orderData;

  const order = new this({
    userId,
    items,
    totalPrice,
    originalTotalPrice: originalTotalPrice != null ? originalTotalPrice : 0,
    discountAmount: discountAmount != null ? discountAmount : 0,
    guestName,
    guestPhone,
    guestEmail,
    notes,
    paymentMethod,
    status: "pending",
    paymentStatus: "unpaid",
  });

  return order.save();
};

// 创建索引
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ status: 1 });

// 创建模型
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
