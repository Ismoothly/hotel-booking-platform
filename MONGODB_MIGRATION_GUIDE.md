# MongoDB 集成指南

## 概述

本指南说明如何将酒店预订平台从内存数据库迁移到 MongoDB。

## 内容结构

- [快速开始](#快速开始)
- [安装与配置](#安装与配置)
- [数据迁移](#数据迁移)
- [代码更新](#代码更新)
- [API 变更](#api-变更)
- [故障排除](#故障排除)

---

## 快速开始

### 1. 安装 MongoDB

#### Windows 本地安装
```bash
# 方式一：使用 Chocolatey
choco install mongodb-community

# 方式二：手动下载安装
# 访问 https://www.mongodb.com/try/download/community 下载 Windows 安装程序
```

#### 使用 Docker（推荐）
```bash
# 拉取 MongoDB 镜像
docker pull mongo:latest

# 运行 MongoDB 容器
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 验证连接
docker exec -it mongodb mongosh
```
docker exec -it mongodb mongosh -u admin -p admin123  --authenticationDatabase admin   
### 2. 安装依赖

```bash
cd server
npm install
```

### 3. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，配置 MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/hotel-booking-dev
```

### 4. 启动服务器

```bash
# 开发环境（带自动重启）
npm run dev

# 生产环境
npm start
```

---

## 安装与配置

### MongoDB 连接字符串格式

**本地连接：**
```
mongodb://localhost:27017/hotel-booking-dev
```

**远程连接（MongoDB Atlas）：**
```
mongodb+srv://username:password@cluster.mongodb.net/hotel-booking?retryWrites=true&w=majority
```

### 配置选项

在 \`src/config/database.js\` 中定义了三个环境的配置：

- **development**：开发环境，数据库名为 \`hotel-booking-dev\`
- **production**：生产环境，包含连接池配置
- **test**：测试环境，使用独立的测试库

```javascript
// 自定义配置示例
const customConfig = {
  url: 'mongodb+srv://user:password@cluster.mongodb.net/database',
  options: {
    maxPoolSize: 20,
    minPoolSize: 5,
    socketTimeoutMS: 45000
  }
};
```

---

## 数据迁移

### 从内存数据库迁移到 MongoDB

#### 选项 1：自动迁移脚本（创建种子数据）

```bash
# 创建 seed.js 文件
node scripts/seed.js
```

#### 选项 2：手动导入数据

使用 MongoDB Compass 或 mongoimport 工具导入旧数据：

```bash
# 使用 mongoimport 导入 JSON 文件
mongoimport --db hotel-booking-dev --collection hotels --file hotels.json
mongoimport --db hotel-booking-dev --collection users --file users.json
```

#### 选项 3：逐步迁移

在迁移过程中，保持内存数据库作为备份，逐步将应用指向 MongoDB。

---

## 代码更新

### 模型更新

已为您创建了两个 Mongoose 模型：

#### 1. User 模型 (`src/models/User-mongoose.js`)

**关键特性：**
- 密码自动加密（保存前自动哈希）
- 支持 refresh token 管理
- 内置比对密码方法
- 用户搜索方法（按用户名、邮箱）

**使用示例：**
```javascript
const User = require('./models/User-mongoose');

// 创建用户
const user = await User.createUser({
  username: 'john_doe',
  password: 'password123',
  email: 'john@example.com',
  role: 'merchant'
});

// 登录验证
const user = await User.findByUsername('john_doe');
const isPasswordValid = await user.comparePassword('password123');

// 管理 Refresh Token
await user.addRefreshToken(token);
await user.replaceRefreshToken(oldToken, newToken);
```

#### 2. Hotel 模型 (`src/models/Hotel-mongoose.js`)

**关键特性：**
- 支持嵌入式房间和折扣信息
- 自动计算最低/最高价格
- 支持文本搜索（中文、英文、地址）
- 完整的状态和审核管理
- 复合索引优化查询性能

**使用示例：**
```javascript
const Hotel = require('./models/Hotel-mongoose');

// 创建酒店
const hotel = new Hotel({
  nameCn: '上海豪华酒店',
  nameEn: 'Shanghai Luxury Hotel',
  address: '上海市浦东新区',
  city: '上海',
  starRating: 5,
  openingDate: new Date('2020-01-15'),
  merchantId: userId,
  rooms: [
    { type: '豪华大床房', price: 888, description: '35平米' }
  ]
});
await hotel.save();

// 查询已发布酒店
const hotels = await Hotel.findPublished();

// 按城市和星级查询
const filtered = await Hotel.find({
  city: '上海',
  starRating: { $gte: 4 },
  status: 'published'
});

// 获取最低价格
const minPrice = hotel.getMinPrice();
```

### 路由和控制器更新

**控制器迁移检查清单：**

```javascript
// 旧代码（内存数据库）
const user = await UserModel.findById(id);

// 新代码（MongoDB）
const user = await User.findById(id);

// 关键差异：
// 1. 使用 MongoDB ObjectId 代替字符串 ID
// 2. 异步操作已原生支持（无需额外包装）
// 3. 查询返回 Mongoose 文档对象（支持额外方法）
```

---

## API 变更

### ID 格式变更

| 项目 | 内存数据库 | MongoDB |
|------|----------|--------|
| ID 类型 | String (UUID) | ObjectId |
| 查询示例 | `User.findById('uuid-string')` | `User.findById(objectId)` |
| 创建时 | 需要手动生成 UUID | MongoDB 自动生成 |

### 错误处理

```javascript
// Mongoose 验证错误处理
try {
  const hotel = new Hotel(data);
  await hotel.save();
} catch (err) {
  if (err.name === 'ValidationError') {
    // 处理验证错误
    const messages = Object.values(err.errors).map(e => e.message);
    res.status(400).json({ errors: messages });
  } else if (err.code === 11000) {
    // 处理唯一性约束错误（重复）
    res.status(400).json({ message: '数据已存在' });
  } else {
    throw err;
  }
}
```

---

## 性能优化

### 索引策略

已在模型中创建以下索引：

**User 模型：**
```javascript
- username (唯一)
- email (唯一)
- role + isActive (复合)
```

**Hotel 模型：**
```javascript
- nameCn, nameEn, address, description (文本索引 - 搜索)
- merchantId + status (复合 - 商户查询)
- city + starRating + status (复合 - 列表查询)
- status + reviewStatus (复合 - 审核查询)
```

### 查询优化示例

```javascript
// ❌ 不好：全表扫描
const hotels = await Hotel.find({ status: 'published' });

// ✅ 好：使用索引
const hotels = await Hotel.find({ 
  status: 'published', 
  city: '上海' 
}).select('nameCn starRating rooms').limit(20);

// ✅ 更好：使用聚合管道
const results = await Hotel.aggregate([
  { $match: { status: 'published', city: '上海' } },
  { $sort: { starRating: -1 } },
  { $limit: 20 }
]);
```

---

## 故障排除

### 常见问题

#### 1. 无法连接到 MongoDB

```
错误: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**解决方案：**
```bash
# 检查 MongoDB 是否运行
mongosh  # 如果已安装本地

# 或者启动 Docker 容器
docker start mongodb

# 检查连接字符串
# .env 中的 MONGODB_URI 是否正确
```

#### 2. ObjectId 格式错误

```
错误: Cast to ObjectId failed for value "invalid-id"
```

**解决方案：**
```javascript
// 验证 ObjectId 格式
const mongoose = require('mongoose');
const isValidId = mongoose.Types.ObjectId.isValid(id);

if (!isValidId) {
  return res.status(400).json({ message: 'ID 格式无效' });
}
```

#### 3. 唯一性约束冲突

```
错误: E11000 duplicate key error
```

**解决方案：**
```javascript
// 创建前检查
const existing = await User.findOne({ email: data.email });
if (existing) {
  throw new Error('邮箱已被注册');
}
```

#### 4. 模型找不到

```
错误: Cannot find module './User-mongoose'
```

**解决方案：**
- 确保文件路径正确
- 确保 require 路径使用了正确的文件名
- 检查大小写是否匹配

---

## 迁移步骤总结

1. ✅ 安装 MongoDB（本地或 Docker）
2. ✅ 安装 Mongoose 依赖（已在 package.json 中添加）
3. ✅ 配置 .env 文件（使用提供的 .env.example）
4. ✅ 替换模型文件（使用 User-mongoose.js 和 Hotel-mongoose.js）
5. ✅ 更新路由和控制器（将导入改为新模型）
6. ✅ 迁移现有数据（使用种子脚本或手动导入）
7. ✅ 更新测试用例（适配 MongoDB ObjectId）
8. ✅ 部署到生产环境

---

## 下一步

### 推荐的功能扩展

1. **数据导出**：实现 MongoDB 数据导出功能
2. **备份策略**：配置 MongoDB 定期备份
3. **监控告警**：集成 MongoDB 监控工具
4. **缓存层**：添加 Redis 缓存提升性能
5. **日志系统**：集成 ELK Stack 日志管理

### 相关资源

- [MongoDB 官方文档](https://docs.mongodb.com/)
- [Mongoose 官方文档](https://mongoosejs.com/)
- [MongoDB 最佳实践](https://docs.mongodb.com/manual/administration/best-practices/)
- [Mongoose 性能优化](https://mongoosejs.com/docs/api/query.html)

---

## 支持

如遇到问题，请：

1. 检查 MongoDB 服务状态
2. 查看服务器日志（包含详细的 MongoDB 错误信息）
3. 验证 .env 配置是否正确
4. 检查网络连接和防火墙设置
