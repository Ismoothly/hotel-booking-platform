# 后端服务压力测试指南

## 概述

本指南帮助你进行完整的压力测试，验证并发控制、限流机制、以及扣库存的正确性。

---

## 第一步：启动后端服务

### 前置条件

1. **MongoDB 运行中**
   ```powershell
   # 检查 MongoDB
   mongod --version
   ```

2. **Node.js 依赖已安装**
   ```powershell
   cd f:\hotel-booking-platform\server
   npm install
   ```

### 启动服务

```powershell
cd f:\hotel-booking-platform\server
npm start
```

预期输出：
```
正在连接 MongoDB...
Server running on port 5000
服务已准备好接收请求
```

确认服务健康：
```powershell
# 在新的PowerShell窗口运行
curl http://localhost:5000/health
```

---

## 第二步：选择压力测试工具

### 推荐方案（按難度）

#### 💚 **推荐：PowerShell 脚本**（最简单）
- 不需要额外安装
- 直接用 Windows PowerShell
- 适合快速测试

#### 💛 **中等：Apache Bench (ab)**
- Windows 版本有点麻烦
- 功能齐全
- 命令行友好

#### 🔴 **高级：wrk**
- 高性能
- 需要编译或下载预编译版
- 支持 Lua 脚本

---

## 第三步：执行压力测试

### 方案1：PowerShell 脚本（推荐新手）

创建 `test-load.ps1`:

```powershell
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 简单负载测试脚本
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 配置
$baseUrl = "http://localhost:5000"
$concurrency = 10        # 并发数
$requestsPerThread = 50  # 每个线程发送的请求数
$totalRequests = $concurrency * $requestsPerThread

# 1️⃣  测试 - 获取酒店列表（简单查询，不涉及库存）
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "测试1: 获取酒店列表" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

$tasks = @()
for ($i = 0; $i -lt $concurrency; $i++) {
    $task = {
        param($baseUrl, $requestsPerThread)
        for ($j = 0; $j -lt $requestsPerThread; $j++) {
            try {
                $response = Invoke-WebRequest -Uri "$baseUrl/api/hotels?page=1&limit=10" `
                    -Method GET `
                    -TimeoutSec 10 `
                    -ErrorAction Stop
                @{ success = 1; statusCode = $response.StatusCode }
            } catch {
                @{ success = 0; statusCode = $_.Exception.Response.StatusCode }
            }
        }
    }
    $tasks += Start-Job -ScriptBlock $task -ArgumentList $baseUrl, $requestsPerThread
}

# 等待所有任务完成
$results = @()
foreach ($task in $tasks) {
    $results += Receive-Job -Job $task -Wait
    Remove-Job -Job $task
}

$stopwatch.Stop()

$successCount = @($results | Where-Object { $_.success -eq 1 }).Count
$failCount = @($results | Where-Object { $_.success -eq 0 }).Count
$duration = $stopwatch.Elapsed.TotalSeconds
$throughput = [math]::Round($totalRequests / $duration, 2)

Write-Host "总请求数: $totalRequests"
Write-Host "成功: $successCount ✓"
Write-Host "失败: $failCount ✗"
Write-Host "耗时: $($duration)s"
Write-Host "吞吐量: $throughput req/s"
Write-Host ""

# 2️⃣  测试 - 登录（涉及限流）
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "测试2: 登录接口（测试限流）" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green

$loginPayload = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$loginResults = @()

for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
            -Method POST `
            -Headers @{"Content-Type" = "application/json"} `
            -Body $loginPayload `
            -TimeoutSec 10 `
            -ErrorAction Stop
        $loginResults += @{ 
            success = 1
            statusCode = $response.StatusCode
            attempt = $i + 1
        }
    } catch {
        $loginResults += @{ 
            success = 0
            statusCode = $_.Exception.Response.StatusCode
            attempt = $i + 1
        }
    }
    Start-Sleep -Milliseconds 100
}

$stopwatch.Stop()

Write-Host "登录尝试数: 10"
Write-Host "成功: $(@($loginResults | Where-Object { $_.success -eq 1 }).Count)"
Write-Host "被限流: $(@($loginResults | Where-Object { $_.statusCode -eq 429 }).Count)"
Write-Host "耗时: $($stopwatch.Elapsed.TotalSeconds)s"
Write-Host ""

Write-Host "═══════════════════════════════════════" -ForegroundColor Yellow
Write-Host "测试完成！" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Yellow
```

**运行测试：**
```powershell
# 在项目根目录
.\test-load.ps1
```

---

### 方案2：Node.js 压力测试脚本（更灵活）

创建 `server/load-test.js`:

```javascript
const http = require('http');

class LoadTester {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.concurrency = options.concurrency || 10;
    this.requestsPerThread = options.requestsPerThread || 50;
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      statusCodes: {},
      responseTimes: [],
      errors: []
    };
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(this.baseUrl + path);
      
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        timeout: 10000,
      };

      if (options.headers) {
        reqOptions.headers = options.headers;
      }

      if (options.body) {
        reqOptions.headers = {
          ...reqOptions.headers,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(options.body)
        };
      }

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const time = Date.now() - startTime;
          this.results.responseTimes.push(time);
          this.results.total++;
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            this.results.success++;
          } else if (res.statusCode === 429) {
            this.results.statusCodes['429'] = (this.results.statusCodes['429'] || 0) + 1;
            this.results.failed++;
          } else {
            this.results.failed++;
          }

          this.results.statusCodes[res.statusCode] = 
            (this.results.statusCodes[res.statusCode] || 0) + 1;
          
          resolve({ success: true, statusCode: res.statusCode, time });
        });
      });

      req.on('error', (error) => {
        this.results.total++;
        this.results.failed++;
        this.results.errors.push(error.message);
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        this.results.total++;
        this.results.failed++;
        resolve({ success: false, error: 'timeout' });
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async testHotelList() {
    console.log('\n\n🏨 测试1: 获取酒店列表');
    console.log('═'.repeat(50));

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < this.concurrency; i++) {
      for (let j = 0; j < this.requestsPerThread; j++) {
        promises.push(
          this.makeRequest('/api/hotels?page=1&limit=10', { method: 'GET' })
        );
      }
    }

    await Promise.all(promises);

    const duration = (Date.now() - startTime) / 1000;
    const throughput = this.results.total / duration;

    console.log(`总请求数: ${this.results.total}`);
    console.log(`✓ 成功: ${this.results.success}`);
    console.log(`✗ 失败: ${this.results.failed}`);
    console.log(`耗时: ${duration.toFixed(2)}s`);
    console.log(`吞吐量: ${throughput.toFixed(2)} req/s`);
    console.log(`状态码分布:`, this.results.statusCodes);
    console.log(`平均响应时间: ${(this.results.responseTimes.reduce((a,b) => a+b, 0) / this.results.responseTimes.length).toFixed(2)}ms`);
  }

  async testLoginRateLimit() {
    console.log('\n\n🔐 测试2: 登录限流');
    console.log('═'.repeat(50));

    this.results = {
      total: 0, success: 0, failed: 0,
      statusCodes: {}, responseTimes: [],
      errors: []
    };

    const body = JSON.stringify({
      username: 'testuser',
      password: 'password'
    });

    const startTime = Date.now();
    // 快速连续登录 15 次
    for (let i = 0; i < 15; i++) {
      await this.makeRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      console.log(`请求 ${i + 1}: ${this.results.statusCodes[Object.keys(this.results.statusCodes).pop()] || '?'}`);
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log(`\n总请求数: ${this.results.total}`);
    console.log(`✓ 成功: ${this.results.success}`);
    console.log(`⚠️  被限流(429): ${this.results.statusCodes['429'] || 0}`);
    console.log(`耗时: ${duration.toFixed(2)}s`);
    console.log(`状态码分布:`, this.results.statusCodes);
  }

  printSummary() {
    console.log('\n\n📊 测试总结');
    console.log('═'.repeat(50));
    console.log(`总请求数: ${this.results.total}`);
    console.log(`成功率: ${((this.results.success / this.results.total) * 100).toFixed(2)}%`);
    console.log(`最大响应时间: ${Math.max(...this.results.responseTimes)}ms`);
    console.log(`最小响应时间: ${Math.min(...this.results.responseTimes)}ms`);
    const avg = this.results.responseTimes.reduce((a,b) => a+b, 0) / this.results.responseTimes.length;
    console.log(`平均响应时间: ${avg.toFixed(2)}ms`);
  }

  async runAll() {
    console.log('🚀 开始压力测试');
    console.log('═'.repeat(50));
    
    // 检查服务是否运行
    try {
      await this.makeRequest('/health');
    } catch (e) {
      console.error('❌ 服务未运行，请先启动后端');
      process.exit(1);
    }

    await this.testHotelList();
    
    this.results = {
      total: 0, success: 0, failed: 0,
      statusCodes: {}, responseTimes: [],
      errors: []
    };

    await this.testLoginRateLimit();
    
    this.printSummary();
  }
}

// 执行测试
const tester = new LoadTester('http://localhost:5000', {
  concurrency: 20,
  requestsPerThread: 50
});

tester.runAll().catch(console.error);
```

**运行测试：**
```powershell
cd f:\hotel-booking-platform\server
node load-test.js
```

---

### 方案3：使用 Artillery（最专业）

#### 安装 Artillery

```powershell
npm install -g artillery
```

#### 创建测试配置 `artillery-config.yml`

```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 30
      arrivalRate: 10
      name: "Warmup"
    - duration: 60
      arrivalRate: 50
      name: "Loading"
    - duration: 30
      arrivalRate: 100
      name: "Peak Load"
    - duration: 20
      arrivalRate: 0
      name: "Cooldown"

scenarios:
  - name: "Hotel Booking Flow"
    flow:
      - get:
          url: "/api/hotels?page=1&limit=10"
          
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "password"
          
      - think: 5
      
      - get:
          url: "/api/orders"
          headers:
            Authorization: "Bearer {{ token }}"
```

#### 运行测试

```powershell
artillery run artillery-config.yml
```

---

## 测试场景深入

### 场景1：库存竞争（关键测试）

创建 `test-stock-competition.js`:

```javascript
const http = require('http');

// 模拟 50 个用户同时抢购最后 5 间房
async function testStockCompetition() {
  const hotelId = 'hotel123'; // 替换为 DB 中实际的酒店ID
  const roomType = '豪华大床房';
  const availableStock = 5;
  const competitors = 50; // 50 个用户抢购

  console.log('🏨 库存竞争测试');
  console.log(`酒店: ${hotelId}`);
  console.log(`房型: ${roomType}`);
  console.log(`库存: ${availableStock} 间`);
  console.log(`竞争者: ${competitors} 人`);
  console.log('═'.repeat(50));

  let successCount = 0;
  let failCount = 0;
  const results = [];

  const promises = [];

  for (let i = 0; i < competitors; i++) {
    const promise = new Promise((resolve) => {
      const body = JSON.stringify({
        hotelId,
        roomType,
        quantity: 1,
        checkInDate: '2026-03-10',
        checkOutDate: '2026-03-11'
      });

      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer token_user_${i}`
        },
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const success = res.statusCode === 200 || res.statusCode === 201;
          if (success) successCount++;
          else failCount++;
          
          results.push({
            userId: i,
            statusCode: res.statusCode,
            success: success,
            response: data.substring(0, 100)
          });
          resolve();
        });
      });

      req.on('error', () => {
        failCount++;
        results.push({ userId: i, success: false, error: 'request failed' });
        resolve();
      });

      req.write(body);
      req.end();
    });

    promises.push(promise);
    // 稍微延迟发送，模拟真实场景
    if ((i + 1) % 10 === 0) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  await Promise.all(promises);

  console.log(`\n结果:`);
  console.log(`✓ 成功订单: ${successCount}`);
  console.log(`✗ 失败订单: ${failCount}`);
  console.log(`\n预期: ${availableStock} 个用户成功，${competitors - availableStock} 个用户失败`);

  if (successCount === availableStock) {
    console.log('\n✅ 库存控制正确！');
  } else {
    console.log(`\n❌ 库存控制异常！期望 ${availableStock} 单，实际 ${successCount} 单`);
  }

  // 查询数据库验证
  console.log('\n💾 验证数据库...');
  console.log('请手动运行: db.hotels.findOne({ _id: "' + hotelId + '" })');
  console.log('检查 rooms 中对应房型的 quantity 是否为 0');
}

testStockCompetition().catch(console.error);
```

**运行测试：**
```powershell
node test-stock-competition.js
```

---

## 性能基准

### 预期指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 吞吐量 | > 100 req/s | QPS |
| 平均响应时间 | < 100ms | P50 |
| P99 响应时间 | < 300ms | 99% 的请求 |
| 成功率 | > 99.5% | 不应该有错误 |
| 限流准确性 | ±5% | 限流应该在预期内 |
| 库存准确性 | 100% | 零超卖 |

### 实际测试结果示例

```
🚀 开始压力测试

🏨 测试1: 获取酒店列表
═══════════════════════════════════════
总请求数: 500
✓ 成功: 500
✗ 失败: 0
耗时: 4.82s
吞吐量: 103.73 req/s
平均响应时间: 95.23ms

🔐 测试2: 登录限流
═══════════════════════════════════════
请求 1-5: 200 (全部成功)
请求 6-15: 429 (被限流)
✓ 成功: 5
⚠️  被限流: 10

📊 测试总结
═══════════════════════════════════════
成功率: 99.8%
最大响应时间: 450ms
最小响应时间: 23ms
平均响应时间: 95.23ms
```

---

## 常见问题排查

### 问题1：连接被拒绝
```
Error: connect ECONNREFUSED
```
**解决**：确保后端服务运行在 5000 端口
```powershell
npm start  # 在 server 目录
```

### 问题2：限流不生效
```
期望 429，但收到 200
```
**解决**：检查 rate limiter 中间件配置
```powershell
# 查看 server/src/middleware/rateLimiter.js
```

### 问题3：超卖发生
```
库存为 5，但 10 个用户都成功下单
```
**解决**：检查乐观锁条件
```javascript
// 应该是这样：
'rooms.quantity': { $gte: quantity }

// 而不是这样：
'rooms.quantity': { $gt: 0 }
```

---

## 总结

| 工具 | 难度 | 推荐度 | 适用场景 |
|------|------|--------|---------|
| PowerShell 脚本 | ⭐ | ⭐⭐⭐⭐⭐ | 快速测试、演示 |
| Node.js 脚本 | ⭐⭐ | ⭐⭐⭐⭐ | 详细数据、学习 |
| Artillery | ⭐⭐⭐ | ⭐⭐⭐ | 专业测试、CI/CD |
| Apache Bench | ⭐⭐ | ⭐⭐ | 简单场景 |

**建议**：
1. 先用 PowerShell 快速测试
2. 用 Node.js 脚本进行详细测试
3. 用 Artillery 做自动化测试

