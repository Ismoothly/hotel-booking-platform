# 并发控制与超卖防护实现文档

## 问题描述
原系统存在多用户同时下单导致超卖的问题，缺少并发控制机制。

## 解决方案

### 1. ✅ 请求限流（Rate Limiting）
**文件**: `server/src/middleware/rateLimiter.js`

实现了四种限流器：

#### 通用API限流器
- 15分钟内每个IP最多100个请求
- 防止API被大量请求攻击

#### 登录限流器
- 15分钟内每个IP最多5次登录尝试
- 防止暴力破解密码
- 成功的请求不计入限制

#### 订单创建限流器
- 每分钟最多5个订单
- 针对已认证用户使用userId作为key
- 防止恶意刷单

#### 支付限流器
- 每分钟最多3次支付请求
- 针对已认证用户使用userId作为key
- 防止重复支付攻击

### 2. ✅ MongoDB 事务（Transaction）
**文件**: `server/src/controllers/orderController.js` - `completePayment`

#### 实现原理
```javascript
const session = await Order.startSession();
session.startTransaction();

try {
  // 1. 查询订单
  // 2. 检查库存
  // 3. 扣减库存（原子操作）
  // 4. 更新订单状态
  
  await session.commitTransaction(); // 提交事务
} catch (error) {
  await session.abortTransaction(); // 回滚事务
} finally {
  session.endSession();
}
```

#### 特点
- **原子性**：所有操作要么全部成功，要么全部失败
- **一致性**：防止数据不一致
- **隔离性**：并发事务互不干扰

### 3. ✅ 乐观锁（Optimistic Locking）
**文件**: `server/src/controllers/orderController.js` - `completePayment`

#### 实现方式
使用 MongoDB 的条件更新：

```javascript
const updateResult = await Hotel.updateOne(
  {
    _id: item.hotelId,
    'rooms.type': item.roomType,
    'rooms.quantity': { $gte: item.quantity } // 确保库存充足
  },
  {
    $inc: { 'rooms.$.quantity': -item.quantity }
  },
  { session }
);

// 检查是否成功更新
if (updateResult.modifiedCount === 0) {
  throw new Error('库存不足或已被其他用户预订');
}
```

#### 工作原理
1. **条件检查**：只有当库存 >= 需求数量时才更新
2. **原子操作**：使用 `$inc` 原子递减库存
3. **结果验证**：检查 `modifiedCount`，若为0说明并发冲突
4. **自动重试**：事务失败会自动回滚

### 4. ✅ 库存验证改进
**文件**: `server/src/controllers/orderController.js` - `createOrder`

#### 改进点
- 从 `room.available` 改为使用 `room.quantity`
- 创建订单时严格验证库存
- 支付时再次验证并扣减库存（双重保险）

### 5. ✅ 路由级别限流
**应用位置**:
- `server/src/routes/auth.js` - 登录/注册限流
- `server/src/routes/orders.js` - 订单/支付限流  
- `server/src/index.js` - 全局API限流

## 防护效果

### 超卖防护
✅ **场景**: 100个用户同时抢购最后1间房
- 使用 MongoDB 事务 + 乐观锁
- 只有1个用户能成功支付
- 其他99个用户收到"库存不足"提示

### 暴力攻击防护
✅ **场景**: 恶意用户尝试暴力破解密码
- 15分钟内最多5次尝试
- 超过限制返回429状态码

### 刷单防护
✅ **场景**: 恶意用户频繁创建订单
- 每分钟最多5个订单
- 每分钟最多3次支付

### 并发安全
✅ **场景**: 多用户同时操作同一资源
- 事务保证原子性
- 乐观锁防止并发冲突
- 失败自动回滚

## 性能影响

### 事务开销
- 轻量级：MongoDB 4.0+ 原生支持
- 仅在支付环节使用，不影响查询性能

### 限流开销
- 极小：内存级别检查
- 不会显著影响响应时间

## 测试建议

### 并发测试
```bash
# 使用工具（如 Apache Bench）模拟并发请求
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/orders/ORDER_ID/pay
```

### 预期结果
- 只有库存数量的请求成功
- 其他请求返回库存不足错误
- 数据库库存准确，无超卖

## 配置调整

如需调整限流参数，编辑 `server/src/middleware/rateLimiter.js`：

```javascript
// 例如：调整订单限流为每分钟10个
const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 从5改为10
  // ...
});
```

## 注意事项

1. **MongoDB版本要求**: 需要 4.0+ 以支持事务
2. **副本集要求**: 事务需要副本集模式，单节点开发环境可能需要配置
3. **日志监控**: 已添加详细日志，便于追踪并发问题

## 部署检查清单

- [x] 安装 express-rate-limit
- [x] 创建限流中间件
- [x] 订单控制器添加事务支持
- [x] 实现乐观锁机制
- [x] 路由应用限流中间件
- [x] 测试并发场景
- [ ] 配置MongoDB副本集（生产环境）
- [ ] 监控限流日志
- [ ] 压力测试验证

## 后续优化建议

1. **Redis分布式锁**: 对于分布式部署，考虑使用Redis实现分布式锁
2. **消息队列**: 高并发场景下可引入消息队列削峰
3. **缓存优化**: 热门酒店数据可缓存到Redis
4. **数据库索引**: 确保查询字段都建立了合适的索引

---

**实施日期**: 2026-02-26  
**实施人**: AI Assistant  
**状态**: ✅ 已完成
