# 压力测试 - 快速开始

## ⚡ 5 分钟快速上手

### 步骤 1: 启动后端服务

打开 **PowerShell 窗口 1**：

```powershell
cd f:\hotel-booking-platform\server
npm start
```

等待输出：
```
正在连接 MongoDB...
Server running on port 5000
```

### 步骤 2A: 运行主要压力测试

打开 **PowerShell 窗口 2**：

```powershell
cd f:\hotel-booking-platform\server
node load-test.js
```

**预期输出**：
```
╔════════════════════════════════════════╗
║    🚀 酒店预订平台 - 后端压力测试    ║
╚════════════════════════════════════════╝

🏨 测试1: 获取酒店列表 (高并发读)
════════════════════════════════════════
并发数: 20
总请求数: 1000
发送中...

📊 结果:
  ✓ 成功: 1000
  ✗ 失败: 0
  耗时: 9.82s
  🚀 吞吐量: 101.83 req/s
  ...
```

### 步骤 2B: 运行库存竞争测试（关键）

```powershell
cd f:\hotel-booking-platform\server
node test-stock-competition.js
```

**这个测试最重要！** 它验证：
- ✅ 5 间房，50 个用户同时抢购
- ✅ 只有 5 个成功，45 个失败
- ✅ 库存不会为负（不超卖）
- ✅ 乐观锁正常工作

**预期输出**：
```
📦 库存竞争测试 - Optimistic Lock 验证

📋 测试配置:
  酒店 ID: hotel-001
  房型: 豪华大床房
  初始库存: 5 间
  竞争用户数: 50 人

✓ 成功: 5 个
✗ 失败: 45 个

✅ 检查1: 成功订单数正确 (5 = 5) ✓
✅ 检查2: 库存正确扣减到 0 ✓
✅ 检查3: 失败订单数合理 (45 >= 45) ✓

╔════════════════════════════════════════╗
║        ✅ 测试通过！              ║
║  Optimistic Lock 工作正常，不会超卖  ║
╚════════════════════════════════════════╝
```

---

## 📊 三个关键测试说明

### 测试1: 高并发读（load-test.js - 第一个）

```
✓ 验证内容: 大量并发查询是否能快速响应
✓ 场景: 100 个用户同时浏览酒店列表
✓ 预期: 
  - 吞吐量 > 100 req/s
  - 平均响应 < 100ms
  - 成功率 = 100%
```

### 测试2: 限流效果（load-test.js - 第二个）

```
✓ 验证内容: 登录限流是否生效 (5/15min)
✓ 场景: 15 个快速连续登录请求
✓ 预期:
  - 前 5 个: 200 成功
  - 后 10 个: 429 被限流
  - 必须至少有 5 个 429
```

### 测试3: 库存竞争（最关键！）

```
✓ 验证内容: Optimistic Lock 是否能防止超卖
✓ 场景: 5 间房，50 个用户同时下单
✓ 预期:
  - 成功 5 个
  - 失败 45 个
  - 库存 = 0（不是负数）
  - 无超卖现象
```

---

## 🔍 如何理解测试结果

### ✅ 一切正常

```
吞吐量: 103 req/s
P99 响应: 280ms
成功率: 99.8%
限流触发: ✓
库存精确: ✓
```

**表示**：架构设计正确，可以上线！

### ⚠️ 轻微异常

```
吞吐量: 85 req/s  (略低)
P99 响应: 450ms   (有突刺)
成功率: 98.5%
```

**表示**：需要优化，但不影响功能。可以加监控看是否会变差。

### ❌ 严重问题

```
库存为负数     → 超卖发生！Optimistic Lock 不工作
成功率 < 95%   → 有不明原因的失败
限流未触发     → 中间件配置有问题
```

**表示**：立即停止，找出问题！

---

## 🛠️ 常见问题排查

### 问题1: "Error: connect ECONNREFUSED"

```
原因: 后端服务未启动
解决: 
  1. 检查窗口1是否有 "Server running on port 5000"
  2. 如果没有，运行: cd server && npm start
```

### 问题2: "请先登录" 错误

```
原因: 测试数据不存在
解决:
  1. 确保 MongoDB 有测试用户: testuser0, testuser1, ...
  2. 或修改脚本里的用户名
```

### 问题3: 库存竞争测试显示超卖

```
原因: Optimistic Lock 有 bug
解决:
  1. 检查 server/src/controllers/orderController.js
  2. 查看 updateOne 的条件是否包含: 'rooms.quantity': { $gte: quantity }
  3. 查看 if (modifiedCount === 0) 的处理
```

### 问题4: 限流不生效（没有 429）

```
原因: 中间件配置问题
解决:
  1. 检查 server/src/middleware/rateLimiter.js
  2. 确保 loginLimiter 的 max: 5
  3. 确保路由使用了这个中间件
```

---

## 📈 进阶测试

### 自定义并发数

编辑 `load-test.js` 第一行：

```javascript
const tester = new LoadTester('http://localhost:5000', {
  concurrency: 50,      // ← 改这里（默认20）
  requestsPerThread: 100 // ← 改这里（默认50）
});
```

### 自定义库存竞争场景

编辑 `test-stock-competition.js` 这里：

```javascript
const initialStock = 10;  // ← 改库存数
const competitors = 100;  // ← 改竞争人数
```

### 使用 Artillery 做自动化测试

如果要每天自动测试：

```powershell
npm install -g artillery

# 第一次运行
artillery run artillery-config.yml --output report.json

# 查看报告
artillery report report.json
```

---

## 📚 测试脚本位置

| 文件 | 位置 | 用途 |
|------|------|------|
| load-test.js | `server/` | 综合压力测试（读、写、限流） |
| test-stock-competition.js | `server/` | 库存竞争测试（最关键） |
| LOAD_TESTING_GUIDE.md | 根目录 | 详细文档 |

---

## 🎯 测试流程（完整版）

```
1️⃣  启动后端
   └─ npm start

2️⃣  基础健康检查 (可选)
  └─ curl http://localhost:5000/health

3️⃣  运行综合压力测试
   └─ node load-test.js
   └─ 检查: 吞吐量、响应时间、限流

4️⃣  运行库存竞争测试（最关键）
   └─ node test-stock-competition.js
   └─ 检查: 零超卖，乐观锁工作

5️⃣  检查 MongoDB 日志 (可选)
   └─ db.orders.find().limit(10)
   └─ 确认订单数据完整

6️⃣  查看服务日志 (可选)
   └─ 检查服务端有无错误输出
```

---

## 💡 面试时怎么说

**问题**："你的项目怎么验证支持这么高的并发？"

**回答**：
> "我写了完整的压力测试：
> 
> 1. **综合压力测试**（load-test.js）
>    - 20 个并发，1000 个请求
>    - 验证吞吐量 > 100 req/s
>    - 限流在 5/15min 时生效
> 
> 2. **库存竞争测试**（test-stock-competition.js）
>    - 5 间房，50 用户同时抢购
>    - 验证只有 5 个成功
>    - 库存为 0，零超卖
> 
> 这证明我的 Optimistic Lock + MongoDB 事务能够正确处理并发。"

---

## ✅ 测试清单

在提交代码前，确保：

- [ ] `npm start` 后端正常启动
- [ ] `node load-test.js` 吞吐量 > 100 req/s
- [ ] 限流测试显示 5 个成功 + 10 个 429
- [ ] `node test-stock-competition.js` 零超卖
- [ ] MongoDB 订单数据完整
- [ ] 没有错误日志输出

全部通过 ✅ → 可以演示或面试！

