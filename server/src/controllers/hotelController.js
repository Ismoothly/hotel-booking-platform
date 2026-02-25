const Hotel = require("../models/Hotel-mongoose");
const mongoose = require("mongoose");

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
      limit = 10,
    } = req.query;

    // sortBy 需要特殊处理，避免空字符串
    const sortBy =
      req.query.sortBy && req.query.sortBy.trim() !== ""
        ? req.query.sortBy
        : "-createdAt";

    // 构建查询条件
    const query = { status: "published" };

    if (city) {
      // 支持模糊匹配：天津可以匹配"天津"或"天津市"
      query.city = new RegExp(`^${city}`, "i");
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

    const now = Date.now();
    const transformed = hotels.map((h) => {
      const o = h.toObject();
      let p = 0;
      if (Array.isArray(o.discounts)) {
        for (const d of o.discounts) {
          const v = typeof d.percentage === "number" ? d.percentage : 0;
          const fromOk = !d.validFrom || new Date(d.validFrom).getTime() <= now;
          const toOk = !d.validTo || new Date(d.validTo).getTime() >= now;
          if (fromOk && toOk && v > p) p = v;
        }
      }
      if (p < 0) p = 0;
      if (p > 100) p = 100;
      o.activeDiscountPercent = p;
      if (Array.isArray(o.rooms)) {
        o.rooms = o.rooms.map((r) => {
          const ep = Math.round(r.price * (1 - p / 100) * 100) / 100;
          return { ...r, effectivePrice: ep };
        });
      }
      return o;
    });

    res.json({
      success: true,
      data: transformed,
      total,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("获取酒店列表失败:", error);
    res.status(500).json({
      success: false,
      message: error.message || "获取酒店列表失败",
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
        message: "酒店ID格式无效",
      });
    }

    const hotel = await Hotel.findById(id).populate(
      "merchantId",
      "username email",
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "酒店不存在",
      });
    }

    const now = Date.now();
    const o = hotel.toObject();
    let p = 0;
    if (Array.isArray(o.discounts)) {
      for (const d of o.discounts) {
        const v = typeof d.percentage === "number" ? d.percentage : 0;
        const fromOk = !d.validFrom || new Date(d.validFrom).getTime() <= now;
        const toOk = !d.validTo || new Date(d.validTo).getTime() >= now;
        if (fromOk && toOk && v > p) p = v;
      }
    }
    if (p < 0) p = 0;
    if (p > 100) p = 100;
    o.activeDiscountPercent = p;
    if (Array.isArray(o.rooms)) {
      o.rooms = o.rooms.map((r) => {
        const ep = Math.round(r.price * (1 - p / 100) * 100) / 100;
        return { ...r, effectivePrice: ep };
      });
    }

    res.json({
      success: true,
      data: o,
    });
  } catch (error) {
    console.error("获取酒店详情失败:", error);
    res.status(500).json({
      success: false,
      message: error.message || "获取酒店详情失败",
    });
  }
};

/**
 * 创建酒店（商户）
 */
exports.createHotel = async (req, res) => {
  try {
    const {
      nameCn,
      nameEn,
      address,
      city,
      starRating,
      openingDate,
      rooms,
      ...otherData
    } = req.body;

    // 验证必填字段
    if (
      !nameCn ||
      !nameEn ||
      !address ||
      !city ||
      !starRating ||
      !openingDate ||
      !rooms ||
      !rooms.length
    ) {
      return res.status(400).json({
        success: false,
        message: "缺少必填字段",
      });
    }

    // 验证房型数据
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "至少需要一个房型",
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
      ...otherData,
    });

    await hotel.save();

    res.status(201).json({
      success: true,
      message: "酒店创建成功，等待管理员审核",
      data: hotel,
    });
  } catch (error) {
    console.error("创建酒店失败:", error);

    // 处理 Mongoose 验证错误
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: messages,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "创建酒店失败",
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
        message: "酒店ID格式无效",
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "酒店不存在",
      });
    }

    // 验证权限：只能更新自己的酒店
    if (
      hotel.merchantId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "无权限更新此酒店",
      });
    }

    // 更新字段
    Object.assign(hotel, req.body);
    // 商家更新信息后需重新审核，发布状态改为草稿；管理员更新不改变审核与发布状态
    if (req.user.role === "merchant") {
      hotel.reviewStatus = "pending";
      hotel.reviewMessage = "";
      hotel.reviewedAt = null;
      hotel.reviewerId = null;
      hotel.status = "draft";
    }
    await hotel.save();

    res.json({
      success: true,
      message: "酒店更新成功",
      data: hotel,
    });
  } catch (error) {
    console.error("更新酒店失败:", error);

    // 处理 Mongoose 验证错误
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: messages,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || "更新酒店失败",
    });
  }
};

/**
 * 仅更新酒店房型价格（不触发重新审核）
 */
exports.updateHotelRoomPrices = async (req, res) => {
  try {
    const { id } = req.params;
    const { rooms: roomsPayload } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "酒店ID格式无效",
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "酒店不存在",
      });
    }

    if (
      hotel.merchantId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "无权限更新此酒店",
      });
    }

    if (!Array.isArray(roomsPayload) || roomsPayload.length === 0) {
      return res.status(400).json({
        success: false,
        message: "请提供房型价格数据",
      });
    }

    for (const item of roomsPayload) {
      const room = hotel.rooms.find((r) => r.type === item.type);
      if (room && typeof item.price === "number" && item.price >= 0) {
        room.price = item.price;
      }
    }

    await hotel.save();

    const { broadcastHotelPriceUpdate } = require("../sse");
    broadcastHotelPriceUpdate(hotel._id.toString());

    res.json({
      success: true,
      message: "房型价格已更新",
      data: hotel,
    });
  } catch (error) {
    console.error("更新房型价格失败:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: messages,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || "更新房型价格失败",
    });
  }
};

exports.updateHotelDiscounts = async (req, res) => {
  try {
    const { id } = req.params;
    const { discounts } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "酒店ID格式无效",
      });
    }

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "酒店不存在",
      });
    }

    if (
      hotel.merchantId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "无权限更新此酒店",
      });
    }

    if (!Array.isArray(discounts)) {
      return res.status(400).json({
        success: false,
        message: "请提供折扣数据",
      });
    }

    const normalized = [];
    for (const d of discounts) {
      const percentage = typeof d.percentage === "number" ? d.percentage : 0;
      const p = Math.max(0, Math.min(100, percentage));
      const item = {
        type: d.type || "general",
        description: d.description || "",
        percentage: p,
      };
      if (d.validFrom) item.validFrom = new Date(d.validFrom);
      if (d.validTo) item.validTo = new Date(d.validTo);
      if (
        item.validFrom &&
        item.validTo &&
        item.validFrom.getTime() > item.validTo.getTime()
      ) {
        return res.status(400).json({
          success: false,
          message: "有效期起始不能晚于结束",
        });
      }
      normalized.push(item);
    }

    hotel.discounts = normalized;
    await hotel.save();

    const { broadcastHotelPriceUpdate } = require("../sse");
    broadcastHotelPriceUpdate(hotel._id.toString());

    res.json({
      success: true,
      message: "折扣已更新",
      data: hotel,
    });
  } catch (error) {
    console.error("更新折扣失败:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: messages,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || "更新折扣失败",
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
        message: "酒店ID格式无效",
      });
    }

    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "酒店不存在",
      });
    }

    // 验证权限：只能删除自己的酒店
    if (
      hotel.merchantId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "无权限删除此酒店",
      });
    }

    await Hotel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "酒店删除成功",
    });
  } catch (error) {
    console.error("删除酒店失败:", error);
    res.status(400).json({
      success: false,
      message: error.message || "删除酒店失败",
    });
  }
};

/**
 * 获取商户的酒店列表
 */
/**
 * 获取商户的酒店列表 - 支持分页与筛选
 */
exports.getMerchantHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10, city, reviewStatus, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const query = { merchantId: req.user.id };

    if (city && String(city).trim()) {
      const cityStr = String(city).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.city = new RegExp(`^${cityStr}`);
    }
    if (reviewStatus) query.reviewStatus = reviewStatus;
    if (status) query.status = status;

    const [hotels, total] = await Promise.all([
      Hotel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
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
    console.error("获取商户酒店列表失败:", error);
    res.status(500).json({
      success: false,
      message: error.message || "获取酒店列表失败",
    });
  }
};
