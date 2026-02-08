# MongoDB 快速集成指南

## 📋 核心要点

| 步骤 | 操作 | 状态 |
|-----|------|------|
| 1 | 安装 MongoDB | ✅ 本指南包含 |
| 2 | 添加依赖 (mongoose) | ✅ 已更新 package.json |
| 3 | 配置数据库连接 | ✅ src/config/database.js |
| 4 | 创建数据模型 | ✅ User-mongoose.js, Hotel-mongoose.js |
| 5 | 更新服务器入口 | ✅ src/index.js |
| 6 | 迁移控制器代码 | ⏳ 见 MONGODB_MIGRATION_EXAMPLES.md |
| 7 | 初始化数据 | ✅ scripts/seed.js |

---

## 🚀 五分钟快速开始

### 1️⃣ 安装 MongoDB (Docker 推荐)

```bash
# 启动 MongoDB Docker 容器
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 验证连接
mongosh  # 如果已安装 MongoDB CLI
```

### 2️⃣ 安装依赖

```bash
cd server
npm install
```

### 3️⃣ 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env，确保 MongoDB URI 正确
# MONGODB_URI=mongodb://localhost:27017/hotel-booking-dev
```
   
Current Mongosh Log ID: 6987fbafa2ae68ed8e8ce5af
### 4️⃣ 初始化数据

```bash
# 运行种子脚本（可选，用于填充示例数据）
node scripts/seed.js
```

### 5️⃣ 启动服务器

```bash
# 开发模式（带自动重启）
npm run dev

# 生产模式
npm start
```

✅ **完成！** 服务器现在使用 MongoDB

---

## 📁 新增文件清单

```
server/
├── src/
│   ├── config/
│   │   └── database.js              # ✨ MongoDB 连接配置
│   └── models/
│       ├── User-mongoose.js         # ✨ User Mongoose 模型
│       └── Hotel-mongoose.js        # ✨ Hotel Mongoose 模型
├── scripts/
│   └── seed.js                      # ✨ 数据种子脚本
├── .env.example                     # ✨ 环境变量示例
└── package.json                     # ✅ 已更新：添加 mongoose

根目录/
├── MONGODB_MIGRATION_GUIDE.md       # 📖 完整迁移指南
├── MONGODB_MIGRATION_EXAMPLES.md    # 💡 代码迁移示例
└── MONGODB_QUICK_START.md           # 📝 本文件
```

---

## 🔄 模型对比

### User 模型

| 功能 | 内存版本 | MongoDB版本 |
|------|---------|-----------|
| 密码加密 | 手动处理 | ✨ 自动处理（pre-save 钩子） |
| 密码比对 | UserModel.comparePassword() | ✨ user.comparePassword() |
| 查询 | 数组遍历 | ✨ .find(), .findById() |
| Token管理 | 手动管理 | ✨ addRefreshToken(), removeRefreshToken() |
| 索引 | 无 | ✨ username, email 索引 |

### Hotel 模型

| 功能 | 内存版本 | MongoDB版本 |
|------|---------|-----------|
| ID 生成 | 手动 UUID | ✨ 自动 ObjectId |
| 过滤 | 遍历数组 | ✨ MongoDB 查询语句 |
| 搜索 | 字符串匹配 | ✨ 文本索引 |
| 排序 | 内存排序 | ✨ 数据库排序 |
| 关联 | 手动拼接 | ✨ populate() |

---

## 🛠️ 常用命令

### MongoDB 操作

```bash
# 连接到 MongoDB
mongosh

# 查看所有数据库
show databases

# 切换数据库
use hotel-booking-dev

# 查看所有集合
show collections

# 查看用户
db.users.find()

# 查看酒店
db.hotels.find().pretty()

# 统计酒店数量
db.hotels.countDocuments({ status: 'published' })
```

### Node.js 操作

```bash
# 重新初始化数据
node scripts/seed.js

# 查看日志分析
npm run dev  # 观察控制台输出

# 进行 API 测试
curl http://localhost:5000/health
```

---

## 🔐 环境变量配置

```env
# 基础配置
NODE_ENV=development
PORT=5000

# MongoDB 连接选项
# 本地开发
MONGODB_URI=mongodb://localhost:27017/hotel-booking-dev

# MongoDB Atlas（云端）
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-booking

# 测试环境
MONGODB_TEST_URI=mongodb://localhost:27017/hotel-booking-test

# CORS 配置（前端地址）
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# JWT 密钥（修改这些！）
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

---

## 🔗 Mongoose 基础用法

### 创建文档

```javascript
const User = require('./models/User-mongoose');

// 使用静态方法
const user = await User.createUser({
  username: 'john',
  password: 'password123',
  email: 'john@example.com',
  role: 'merchant'
});
```

### 查询文档

```javascript
// 查找一个
const user = await User.findByUsername('john');

// 查找多个
const users = await User.find({ role: 'merchant' });

// 按 ID 查找
const user = await User.findById(userId);

// 条件查询
const hotels = await Hotel.find({
  city: '上海',
  starRating: { $gte: 4 },
  status: 'published'
});
```

### 更新文档

```javascript
// 方式 1：获取后修改
const hotel = await Hotel.findById(hotelId);
hotel.starRating = 5;
await hotel.save();

// 方式 2：直接更新
const hotel = await Hotel.findByIdAndUpdate(
  hotelId,
  { starRating: 5 },
  { new: true }  // 返回更新后的文档
);
```

### 删除文档

```javascript
// 删除一个
await Hotel.findByIdAndDelete(hotelId);

// 删除多个
await Hotel.deleteMany({ status: 'draft' });
```

### 聚合查询

```javascript
// 获取按城市分组的酒店统计
const stats = await Hotel.aggregate([
  { $match: { status: 'published' } },
  {
    $group: {
      _id: '$city',
      count: { $sum: 1 },
      avgRating: { $avg: '$averageRating' }
    }
  }
]);
```

---

## ⚠️ 常见陷阱

### 1. ObjectId 类型

```javascript
// ❌ 错误：字符串 ID
const hotel = await Hotel.findById('some-string-id');

// ✅ 正确：ObjectId
const mongoose = require('mongoose');
const objectId = new mongoose.Types.ObjectId(idString);
const hotel = await Hotel.findById(objectId);

// ✅ 或直接验证
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ message: 'Invalid ID' });
}
```

### 2. 关联查询

```javascript
// ❌ 懒惰方式（返回 ObjectId）
const hotel = await Hotel.findById(hotelId);
console.log(hotel.merchantId); // "5f7a8b9c0d..." (ObjectId)

// ✅ 正确方式（自动关联）
const hotel = await Hotel.findById(hotelId).populate('merchantId');
console.log(hotel.merchantId.username); // "merchant1"
```

### 3. 数据验证

```javascript
// ❌ 忽略验证
await Hotel.findByIdAndUpdate(id, data);

// ✅ 启用验证
await Hotel.findByIdAndUpdate(
  id,
  data,
  { runValidators: true, new: true }
);
```

### 4. 性能查询

```javascript
// ❌ 低效：获取所有字段
const hotels = await Hotel.find({ city: '上海' });

// ✅ 高效：只获取需要的字段
const hotels = await Hotel.find({ city: '上海' })
  .select('nameCn starRating -_id')
  .limit(20);
```

---

## 📊 数据库统计

```bash
# 运行种子脚本后预期看到：
✓ 已创建 4 个用户
✓ 已创建 4 个酒店

总用户数: 4
  - 1 个管理员 (admin)
  - 2 个商户 (merchant1, merchant2)
  - 1 个客户 (customer1)

总酒店数: 4
  - 上海: 2 家
  - 杭州: 1 家
  - 北京: 1 家
```

---

## 🐛 故障排除

### 问题 1：无法连接 MongoDB

```
错误: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**解决方案：**
```bash
# 检查 MongoDB 是否运行
docker ps | grep mongodb

# 如果未运行，启动它
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 检查 .env 配置
cat .env | grep MONGODB_URI
```

### 问题 2：ObjectId 验证失败

**解决方案：**
```javascript
// 在控制器中添加验证
const mongoose = require('mongoose');

if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid ID format' 
  });
}
```

### 问题 3：唯一性约束错误

```
错误: E11000 duplicate key error
```

**解决方案：**
```javascript
// 在创建前检查
const existing = await User.findOne({ email });
if (existing) throw new Error('Email already registered');
```

---

## 📚 学习资源

| 资源 | 链接 |
|------|------|
| MongoDB 官方文档 | https://docs.mongodb.com/ |
| Mongoose 官方文档 | https://mongoosejs.com/ |
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas |
| Mongoose 教程 | https://mongoosejs.com/docs/guide.html |
| MongoDB 最佳实践 | https://docs.mongodb.com/manual/administration/best-practices/ |

---

## ✅ 验证检查清单

在生产部署前，确保：

- [ ] MongoDB 已正确安装或容器运行
- [ ] `.env` 文件已配置正确的 MongoDB URI
- [ ] 运行了 `npm install` 安装依赖
- [ ] 数据模型已正确迁移（User-mongoose.js, Hotel-mongoose.js）
- [ ] 服务器启动时成功连接到 MongoDB
- [ ] 可以通过 API 创建和查询数据
- [ ] 敏感信息（JWT 密钥等）已更改
- [ ] 日志显示正常的 MongoDB 操作

---

## 🎯 后续步骤

1. **迁移控制器**：参考 MONGODB_MIGRATION_EXAMPLES.md 更新现有控制器
2. **更新路由**：将导入改为新的 Mongoose 模型
3. **添加数据验证**：使用 Mongoose 的验证功能
4. **配置备份**：设置 MongoDB 备份策略
5. **监控性能**：使用 MongoDB 性能分析工具
6. **部署优化**：根据生产需求调整连接池大小

---

**需要帮助？** 参考详细的 MONGODB_MIGRATION_GUIDE.md 或 MONGODB_MIGRATION_EXAMPLES.md
