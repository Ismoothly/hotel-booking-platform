#!/usr/bin/env node

const http = require('http');

class StockCompetitionTester {
  constructor(baseUrl = process.env.LOAD_TEST_BASE_URL || `http://localhost:${process.env.PORT || 5000}`) {
    this.successfulOrders = [];
    this.failedOrders = [];
    this.startTime = null;
    this.baseUrl = baseUrl;
    const parsedUrl = new URL(baseUrl);
    this.hostname = parsedUrl.hostname;
    this.port = parsedUrl.port;
  }

  async login(username) {
    return new Promise((resolve) => {
      const body = JSON.stringify({
        username: username,
        password: 'password123'
      });

      const options = {
        hostname: this.hostname,
        port: this.port,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: res.statusCode === 200,
              token: result.accessToken || null,
              error: result.message || null
            });
          } catch (e) {
            resolve({ success: false, token: null, error: '登录失败' });
          }
        });
      });

      req.on('error', () => {
        resolve({ success: false, token: null, error: '网络错误' });
      });

      req.write(body);
      req.end();
    });
  }

  async placeOrder(userId, token, hotelId, roomType, quantity) {
    return new Promise((resolve) => {
      const body = JSON.stringify({
        hotelId: hotelId,
        roomType: roomType,
        quantity: quantity,
        checkInDate: '2026-03-20',
        checkOutDate: '2026-03-21',
        guestName: `User ${userId}`,
        guestPhone: `1380000${String(userId).padStart(4, '0')}`
      });

      const options = {
        hostname: this.hostname,
        port: this.port,
        path: '/api/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      };

      const startTime = Date.now();

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const duration = Date.now() - startTime;
          try {
            const result = JSON.parse(data);
            resolve({
              userId,
              statusCode: res.statusCode,
              success: res.statusCode === 200 || res.statusCode === 201,
              message: result.message || result.error || '',
              duration,
              orderId: result.data?.orderId || null
            });
          } catch (e) {
            resolve({
              userId,
              statusCode: res.statusCode,
              success: false,
              message: '解析失败',
              duration
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          userId,
          success: false,
          message: error.message,
          duration: Date.now() - startTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          userId,
          success: false,
          message: '超时',
          duration: Date.now() - startTime
        });
      });

      req.write(body);
      req.end();
    });
  }

  async getHotelStock(hotelId, roomType) {
    return new Promise((resolve) => {
      const options = {
        hostname: this.hostname,
        port: this.port,
        path: `/api/hotels/${hotelId}`,
        method: 'GET',
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.data && result.data.rooms) {
              const room = result.data.rooms.find(r => r.type === roomType);
              resolve(room ? room.quantity : 0);
            } else {
              resolve(0);
            }
          } catch (e) {
            resolve(0);
          }
        });
      });

      req.on('error', () => {
        resolve(0);
      });

      req.write('');
      req.end();
    });
  }

  async runTest() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          📦 库存竞争测试 - Optimistic Lock 验证       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // 测试参数
    const hotelId = 'hotel-001';  // 确保这个 ID 在 DB 中存在
    const roomType = '豪华大床房';
    const initialStock = 5;
    const competitors = 50;  // 50 个用户同时抢购

    console.log('📋 测试配置:');
    console.log(`  服务地址: ${this.baseUrl}`);
    console.log(`  酒店 ID: ${hotelId}`);
    console.log(`  房型: ${roomType}`);
    console.log(`  初始库存: ${initialStock} 间`);
    console.log(`  竞争用户数: ${competitors} 人`);
    console.log(`  每人抢购: 1 间`);
    console.log('\n');

    // 第1步：检查初始库存
    console.log('📊 第1步: 检查初始库存');
    const currentStock = await this.getHotelStock(hotelId, roomType);
    console.log(`  当前库存: ${currentStock} 间`);

    if (currentStock < initialStock) {
      console.log('  ⚠️  警告: 库存少于预期，测试结果可能不准确');
    }
    console.log('');

    // 第2步：登录所有用户
    console.log('🔐 第2步: 登录所有用户...');
    const tokens = {};
    let loginSuccess = 0;

    for (let i = 0; i < competitors; i++) {
      const username = `testuser${i}`;
      const result = await this.login(username);
      
      if (result.success && result.token) {
        tokens[i] = result.token;
        loginSuccess++;
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  已登录: ${i + 1}/${competitors}`);
      }
    }

    console.log(`  ✓ 登录成功: ${loginSuccess}/${competitors}\n`);

    if (loginSuccess === 0) {
      console.error('❌ 没有用户登录成功，请检查后端服务和用户账户');
      process.exit(1);
    }

    // 第3步：并发下单
    console.log('🚀 第3步: 并发下单（全部用户同时发起）');
    this.startTime = Date.now();

    const orders = [];
    for (let i = 0; i < competitors; i++) {
      if (tokens[i]) {
        orders.push(
          this.placeOrder(
            i,
            tokens[i],
            hotelId,
            roomType,
            1
          )
        );
      }
    }

    const results = await Promise.all(orders);
    const duration = Date.now() - this.startTime;

    // 分析结果
    this.successfulOrders = results.filter(r => r.success);
    this.failedOrders = results.filter(r => !r.success);

    console.log(`  总耗时: ${(duration / 1000).toFixed(2)}s\n`);

    // 第4步：显示详细结果
    console.log('📊 第4步: 结果分析');
    console.log(`  提交订单: ${competitors} 个`);
    console.log(`  ✓ 成功: ${this.successfulOrders.length} 个`);
    console.log(`  ✗ 失败: ${this.failedOrders.length} 个`);

    const responseTimes = results.map(r => r.duration).sort((a, b) => a - b);
    console.log(`  响应时间:`);
    console.log(`    - 最小: ${Math.min(...responseTimes)}ms`);
    console.log(`    - 平均: ${(responseTimes.reduce((a,b) => a+b) / responseTimes.length).toFixed(2)}ms`);
    console.log(`    - 最大: ${Math.max(...responseTimes)}ms`);
    console.log('');

    // 第5步：验证库存
    console.log('💾 第5步: 验证库存');
    const finalStock = await this.getHotelStock(hotelId, roomType);
    const expectedFinalStock = initialStock - this.successfulOrders.length;

    console.log(`  初始库存: ${initialStock} 间`);
    console.log(`  成功订单: ${this.successfulOrders.length} 个`);
    console.log(`  预期库存: ${expectedFinalStock} 间`);
    console.log(`  实际库存: ${finalStock} 间`);
    console.log('');

    // 第6步：验证结果
    console.log('✅ 第6步: 验证 Optimistic Lock 效果');
    console.log('');

    let passed = true;

    // 检查1: 成功订单数是否等于初始库存
    if (this.successfulOrders.length === initialStock) {
      console.log(`  ✅ 检查1: 成功订单数正确 (${this.successfulOrders.length} = ${initialStock})`);
    } else {
      console.log(`  ❌ 检查1: 成功订单数异常 (${this.successfulOrders.length} ≠ ${initialStock})`);
      passed = false;
    }

    // 检查2: 库存是否正确扣减
    if (finalStock === 0) {
      console.log(`  ✅ 检查2: 库存正确扣减到 0`);
    } else if (finalStock < 0) {
      console.log(`  ❌ 检查2: 库存为负 (${finalStock})，发生超卖！`);
      passed = false;
    } else {
      console.log(`  ⚠️  检查2: 库存未完全扣除 (${finalStock})`);
    }

    // 检查3: 失败订单数是否合理
    const expectedFailures = competitors - initialStock;
    if (this.failedOrders.length >= expectedFailures) {
      console.log(`  ✅ 检查3: 失败订单数合理 (${this.failedOrders.length} >= ${expectedFailures})`);
    } else {
      console.log(`  ❌ 检查3: 失败订单数不足 (${this.failedOrders.length} < ${expectedFailures})`);
      passed = false;
    }

    // 检查4: 是否有 409 冲突状态码
    const conflicts = results.filter(r => r.statusCode === 409).length;
    if (conflicts > 0) {
      console.log(`  ✅ 检查4: 产生了 ${conflicts} 个冲突 (409)，乐观锁工作正常`);
    } else {
      console.log(`  ⚠️  检查4: 没有 409 冲突 (可能库存足够或其他原因)`);
    }

    console.log('');

    // 最终结论
    if (passed) {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║                    ✅ 测试通过！                       ║');
      console.log('║            Optimistic Lock 工作正常，不会超卖         ║');
      console.log('╚════════════════════════════════════════════════════════╝');
    } else {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║                   ❌ 测试失败！                        ║');
      console.log('║             请检查并发控制实现是否有问题           ║');
      console.log('╚════════════════════════════════════════════════════════╝');
    }

    console.log('\n📝 详细日志:\n');

    // 显示成功的订单（前5个）
    console.log('✓ 成功的订单:');
    this.successfulOrders.slice(0, 5).forEach((order, idx) => {
      console.log(`  ${idx + 1}. 用户${order.userId}: ${order.statusCode} ${order.message}`);
    });
    if (this.successfulOrders.length > 5) {
      console.log(`  ... 还有 ${this.successfulOrders.length - 5} 个成功订单`);
    }

    console.log('\n✗ 失败的订单:');
    this.failedOrders.slice(0, 5).forEach((order, idx) => {
      console.log(`  ${idx + 1}. 用户${order.userId}: ${order.statusCode} (${order.message})`);
    });
    if (this.failedOrders.length > 5) {
      console.log(`  ... 还有 ${this.failedOrders.length - 5} 个失败订单`);
    }

    console.log('\n');
  }
}

// 运行测试
const tester = new StockCompetitionTester();
tester.runTest().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
