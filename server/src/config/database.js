const mongoose = require("mongoose");
const config = require("./index");

/**
 * MongoDB 连接配置
 */
const dbConfig = {
  development: {
    url:
      process.env.MONGODB_URI || "mongodb://localhost:27017/hotel-booking-dev",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority",
    },
  },
  production: {
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/hotel-booking",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    },
  },
  test: {
    url:
      process.env.MONGODB_TEST_URI ||
      "mongodb://localhost:27017/hotel-booking-test",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority",
    },
  },
};

/**
 * 初始化 MongoDB 连接
 */
async function connectDB() {
  try {
    const env = config.env || "development";
    const connectionConfig = dbConfig[env];

    if (!connectionConfig) {
      throw new Error(`未配置 ${env} 环境的数据库连接`);
    }

    console.log(`正在连接 MongoDB (${env})...`);
    console.log(
      `数据库 URI: ${connectionConfig.url.replace(/\/\/.*:.*@/, "//***:***@")}`,
    );

    await mongoose.connect(connectionConfig.url, connectionConfig.options);

    console.log("✓ MongoDB 连接成功");

    // 连接事件监听
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB 连接错误:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB 连接已断开");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✓ MongoDB 重新连接成功");
    });

    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB 连接失败:", err.message);
    throw err;
  }
}

/**
 * 断开 MongoDB 连接
 */
async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✓ MongoDB 连接已断开");
  } catch (err) {
    console.error("断开连接失败:", err);
    throw err;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  dbConfig,
  mongoose,
};
