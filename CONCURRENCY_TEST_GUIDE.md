# 并发控制测试指南

## 测试环境准备

1. 确保服务器运行：
```bash
cd f:\hotel-booking-platform\server
node src/index.js
```

2. 确保MongoDB运行并且有测试数据

## 测试场景

### 1. 测试请求限流

#### 测试登录限流（15分钟5次）
使用 PowerShell 快速发送多个请求：

```powershell
# 快速发送10个登录请求，应该有5个失败
1..10 | ForEach-Object {
  Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"username":"test","password":"wrong"}' `
    -ErrorAction SilentlyContinue
}
```

**预期结果**：
- 前5个请求返回401（密码错误）
- 后5个请求返回429（Too Many Requests）

#### 测试API限流（15分钟100次）
```powershell
# 发送超过100个请求
1..110 | ForEach-Object {
  Write-Host "Request $_"
  Invoke-RestMethod -Uri "http://localhost:5000/api/hotels" `
    -Method GET `
    -ErrorAction SilentlyContinue
}
```

**预期结果**：
- 前100个请求正常返回
- 后10个返回429

### 2. 测试订单限流（1分钟5次）

需要先登录获取token：

```powershell
# 1. 登录获取token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"customer1","password":"customer123"}'

$token = $loginResponse.data.accessToken

# 2. 快速创建10个订单
1..10 | ForEach-Object {
  Write-Host "Creating order $_"
  Invoke-RestMethod -Uri "http://localhost:5000/api/orders" `
    -Method POST `
    -Headers @{Authorization="Bearer $token"} `
    -ContentType "application/json" `
    -Body '{"guestName":"测试","guestPhone":"13800138000"}' `
    -ErrorAction SilentlyContinue
}
```

**预期结果**：
- 前5个请求可能成功或因购物车为空失败
- 后5个返回429

### 3. 测试并发超卖防护（核心功能）

#### 准备工作
1. 确保数据库中有一个酒店，某个房型只有1间可用
2. 创建多个用户账号
3. 每个用户购物车中添加该房型

#### 并发支付测试
```powershell
# 模拟5个用户同时支付抢购最后1间房
$tokens = @("token1", "token2", "token3", "token4", "token5")
$orderIds = @("order1", "order2", "order3", "order4", "order5")

# 使用后台作业并发执行
$jobs = @()
for($i=0; $i -lt 5; $i++) {
  $job = Start-Job -ScriptBlock {
    param($token, $orderId)
    Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$orderId/pay" `
      -Method PUT `
      -Headers @{Authorization="Bearer $token"} `
      -ErrorAction SilentlyContinue
  } -ArgumentList $tokens[$i], $orderIds[$i]
  $jobs += $job
}

# 等待所有作业完成
$jobs | Wait-Job
$jobs | Receive-Job
$jobs | Remove-Job
```

**预期结果**：
- 只有1个支付请求成功
- 其他4个返回"库存不足或已被其他用户预订"

### 4. 测试事务回滚

#### 模拟支付失败场景
修改代码在支付中间抛出错误，验证：
- 订单状态未改变
- 库存未扣减
- 数据一致性保持

### 5. 测试支付限流（1分钟3次）

```powershell
$token = "YOUR_TOKEN"
$orderId = "YOUR_ORDER_ID"

# 快速发送5次支付请求
1..5 | ForEach-Object {
  Write-Host "Payment attempt $_"
  Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$orderId/pay" `
    -Method PUT `
    -Headers @{Authorization="Bearer $token"} `
    -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 100
}
```

**预期结果**：
- 前3个请求正常处理
- 后2个返回429

## 验证方法

### 1. 查看服务器日志
```bash
# 观察控制台输出
# 应该看到：
# [支付] 用户 xxx 开始支付订单: xxx
# [支付] 扣减库存: ...
# [支付] ✓ 库存扣减成功
# [支付] ✓ 订单 xxx 支付成功
```

### 2. 查看数据库
```javascript
// 在 MongoDB 中验证
use hotel-booking-dev

// 查看库存
db.hotels.findOne({_id: ObjectId("...")}, {"rooms": 1})

// 查看订单状态
db.orders.find({"orderId": "..."})
```

### 3. 检查响应头
限流器会在响应头中添加：
```
RateLimit-Limit: 5
RateLimit-Remaining: 3
RateLimit-Reset: 1234567890
```

### 4. 错误响应格式
```json
// 限流错误
{
  "code": 429,
  "message": "操作过于频繁，请稍后再试"
}

// 库存不足错误
{
  "code": 500,
  "message": "房型名称 库存不足或已被其他用户预订",
  "error": "..."
}
```

## 压力测试工具

### 使用 Apache Bench (ab)
```bash
# 安装 ab
# Windows: 下载 Apache HTTP Server
# Linux: sudo apt-get install apache2-utils

# 并发测试
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/orders/ORDER_ID/pay
```

### 使用 Node.js 脚本
创建 `concurrent-test.js`：

```javascript
const axios = require('axios');

async function concurrentPayment() {
  const promises = [];
  
  // 10个并发请求
  for(let i = 0; i < 10; i++) {
    promises.push(
      axios.put('http://localhost:5000/api/orders/ORDER_ID/pay', {}, {
        headers: { Authorization: 'Bearer TOKEN' }
      }).catch(err => ({
        error: err.response?.data?.message || err.message
      }))
    );
  }
  
  const results = await Promise.all(promises);
  
  const success = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;
  
  console.log(`成功: ${success}, 失败: ${failed}`);
  console.log('失败原因:', results.filter(r => r.error).map(r => r.error));
}

concurrentPayment();
```

## 成功标准

✅ **限流测试通过**
- 超过限制的请求返回429
- 响应头包含限流信息

✅ **超卖防护通过**
- 并发支付只有1个成功
- 库存准确无超卖
- 失败订单正确提示

✅ **事务测试通过**
- 失败时数据完全回滚
- 无数据不一致

✅ **性能测试通过**
- 响应时间 < 500ms
- 并发处理正常
- 无死锁或阻塞

## 常见问题

### Q1: MongoDB 事务报错
**A**: 确保 MongoDB 4.0+ 且运行在副本集模式。开发环境可以：
```bash
# 单机模拟副本集
mongod --replSet rs0 --bind_ip localhost
mongo --eval "rs.initiate()"
```

### Q2: 限流不生效
**A**: 检查：
- 中间件是否正确应用到路由
- 请求是否携带正确的 IP 或 userId
- 时间窗口是否已过期

### Q3: 并发测试总是成功
**A**: 
- 确保库存确实不足（只有1间）
- 并发数要足够大（>10）
- 使用工具而非手动测试

---

**测试完成后记得**：
1. 清理测试数据
2. 恢复正常库存
3. 检查日志文件
4. 记录测试结果
