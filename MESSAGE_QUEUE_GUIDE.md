# 消息队列最终一致性方案

## 架构说明

```
用户支付 → 支付成功响应（快速） → 发送消息到队列
                                    ↓
                            消费者异步处理
                                    ↓
                              扣减库存
                                    ↓
                            失败自动重试（指数退避）
```

## 关键特性

### 1. **最终一致性保证**
- 支付标记快速完成（用户感知响应快）
- 库存扣减异步处理，失败自动重试
- 即使消费者崩溃，消息也不会丢失

### 2. **自动重试机制**
```javascript
{
  attempts: 3,                    // 最多重试3次
  backoff: {
    type: 'exponential',
    delay: 2000                   // 2s → 4s → 8s（指数退避）
  }
}
```

### 3. **幂等性保护**
消费者会检查订单是否已处理过：
```javascript
if (order.paymentStatus === 'paid' && order.status === 'paid') {
  console.log('订单已处理过，跳过');
  return { status: 'already_processed' };
}
```

## 流程详解

### 支付流程
1. **用户点击支付**
2. **后端处理（completePayment）**
   - 验证订单存在且未支付
   - 标记订单为 `status='paid', paymentStatus='paid'`
   - 发送消息到队列：`{ orderId, items }`
   - **立即返回成功**（不等库存扣减）

3. **消费者异步处理（inventoryQueue process）**
   - 监听队列消息
   - 逐项扣减库存（乐观锁）
   - 失败时自动重试（最多3次）
   - 所有失败重试都失败 → 消息进入死信队列

## 状态转移

```
订单创建: status=pending, paymentStatus=unpaid
    ↓
用户支付: status=paid, paymentStatus=paid （立即）
    ↓
队列处理: 扣减库存（最终一致）
    ↓
最终状态: status=paid, paymentStatus=paid, 库存已扣减
```

## API 端点

### 查询队列状态
```bash
GET http://127.0.0.1:5000/api/queue/stats
```

**响应示例**：
```json
{
  "code": 200,
  "message": "队列状态查询成功",
  "data": {
    "queue": "inventory-deduction",
    "waiting": 2,        // 等待处理的任务
    "active": 1,         // 正在处理的任务
    "completed": 15,     // 已完成任务
    "failed": 0,         // 失败任务
    "description": {
      "waiting": "等待处理的任务数",
      "active": "当前正在处理的任务数",
      "completed": "已完成的任务数",
      "failed": "失败的任务数"
    }
  }
}
```

## 支付端测试流程

1. **登录用户**
```bash
# 假设已登录，获得 access_token 和 refresh_token
```

2. **创建订单**
```bash
POST http://127.0.0.1:5000/api/orders
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "guestName": "张三",
  "guestPhone": "13800138000",
  "notes": "请靠近窗户"
}
```

3. **执行支付**
```bash
PUT http://127.0.0.1:5000/api/orders/:orderId/pay
Authorization: Bearer <access_token>

# 立即返回成功，库存处理在后台进行
```

4. **查看队列状态**
```bash
GET http://127.0.0.1:5000/api/queue/stats

# waiting=1 表示还有消息在队列等待
# active=0  表示没有正在处理的消息
# completed=N 表示已完成的消息数
```

5. **检查订单最终状态**
```bash
GET http://127.0.0.1:5000/api/orders/:orderId
Authorization: Bearer <access_token>

# 应该显示 status='paid', paymentStatus='paid'
```

## 后端日志示例

```
[支付] 用户 xxx 开始支付订单: ORD-1707905400000-1234
[支付] ✓ 订单已标记为支付状态: ORD-1707905400000-1234
[队列] 📤 已发送库存扣减任务到队列
[队列] 开始处理库存扣减: ORD-1707905400000-1234, 进度: 0%
[队列] 扣减库存: 酒店=xxx, 房型=标准间, 数量=1
[队列] ✓ 库存扣减成功: 标准间
[队列] ✓ 订单 ORD-1707905400000-1234 库存扣减完成
[队列] ✓ 任务完成: 1, 订单: ORD-1707905400000-1234
```

## 故障处理

### 场景1：消费者处理失败
```
首次失败 (2秒后重试)
  ↓
第二次失败 (4秒后重试)
  ↓
第三次失败 (8秒后重试)
  ↓
全部失败，进入死信队列（可手动排查处理）
```

### 场景2：支付标记成功，但队列未能扣库存
**不会导致问题**，因为：
1. 支付方已经是 `status='paid'`
2. 消费者具有幂等性检查
3. 可以设置告警，定时检查失败的任务

## 监控建议

1. **队列深度监控**
   - 定期查询 `/api/queue/stats`
   - waiting > 100 时发出告警

2. **失败任务处理**
   - 定期检查失败的消息
   - 可在 Bull UI 或日志中查看

3. **消费延迟监控**
   - 监控任务从发送到完成的时间
   - 异常延迟时发出告警

## 与之前方案的对比

| 指标 | 同步支付 | 异步支付（消息队列） |
|------|--------|-------------------|
| **响应速度** | 300-500ms（需等库存） | <50ms |
| **并发能力** | 受库存更新影响 | 不受影响 |
| **失败处理** | 立即返回错误 | 自动重试 |
| **一致性** | 强一致性 | 最终一致性 |
| **用户体验** | 支付反应慢 | 支付反应快 |
| **复杂度** | 低 | 中 |

## 小程序测试

1. 登录小程序
2. 选择酒店、房间、日期
3. 加入购物车
4. 前往结算并生成订单
5. 点击【去支付】
   - ✅ 立即显示"支付成功"
   - 📤 消息已发送到队列
6. 稍等几秒（消费者处理库存）
7. 查询订单 → 应该显示已支付且库存已扣减

## 配置调整

如需修改重试次数或延迟，编辑 `inventoryQueue.js`：

```javascript
const job = await inventoryQueue.add(
  { orderId, items },
  {
    priority: 10,
    attempts: 3,           // ← 改这里：重试次数
    backoff: {
      type: 'exponential',
      delay: 2000          // ← 改这里：初始延迟（毫秒）
    }
  }
);
```

## 相关文件

- 队列服务：`src/services/inventoryQueue.js`
- 支付控制器：`src/controllers/orderController.js`（completePayment 函数）
- 队列路由：`src/routes/queue.js`
- 应用启动：`src/index.js`（已集成队列初始化）

## 下一步优化

1. **添加 Bull 的 Web UI**（可视化管理队列）
   ```bash
   npm install bull-board
   ```

2. **实现库存回查机制**（定期检查未完成的消息）

3. **添加支付失败补偿**（如果最终库存扣减失败，自动退款）

4. **Redis 持久化**（确保重启后消息不丢失）
   - 修改 Redis 配置或启动参数
