#!/usr/bin/env node

const http = require('http');

const DEFAULT_BASE_URL = process.env.LOAD_TEST_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

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
        const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        reqOptions.headers = {
          ...reqOptions.headers,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
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
        const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        req.write(bodyStr);
      }
      req.end();
    });
  }

  async testHotelList() {
    console.log('\n\n🏨 测试1: 获取酒店列表 (高并发读)');
    console.log('═'.repeat(60));

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < this.concurrency; i++) {
      for (let j = 0; j < this.requestsPerThread; j++) {
        promises.push(
          this.makeRequest('/api/hotels?page=1&limit=10', { method: 'GET' })
        );
      }
    }

    console.log(`并发数: ${this.concurrency}`);
    console.log(`每线程请求: ${this.requestsPerThread}`);
    console.log(`总请求数: ${this.concurrency * this.requestsPerThread}`);
    console.log('发送中...');

    await Promise.all(promises);

    const duration = (Date.now() - startTime) / 1000;
    const throughput = this.results.total / duration;
    const responseTimes = this.results.responseTimes.sort((a, b) => a - b);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const p95Index = Math.floor(responseTimes.length * 0.95);

    console.log('\n📊 结果:');
    console.log(`  ✓ 成功: ${this.results.success}`);
    console.log(`  ✗ 失败: ${this.results.failed}`);
    console.log(`  耗时: ${duration.toFixed(2)}s`);
    console.log(`  🚀 吞吐量: ${throughput.toFixed(2)} req/s`);
    console.log(`  响应时间分布:`);
    console.log(`    - 最小: ${Math.min(...responseTimes)}ms`);
    console.log(`    - 平均: ${(responseTimes.reduce((a,b) => a+b) / responseTimes.length).toFixed(2)}ms`);
    console.log(`    - P95: ${responseTimes[p95Index]}ms`);
    console.log(`    - P99: ${responseTimes[p99Index]}ms`);
    console.log(`    - 最大: ${Math.max(...responseTimes)}ms`);
    console.log(`  状态码分布: ${JSON.stringify(this.results.statusCodes)}`);
  }

  async testLoginRateLimit() {
    console.log('\n\n🔐 测试2: 登录限流 (测试 5/15min 限制)');
    console.log('═'.repeat(60));

    this.results = {
      total: 0, success: 0, failed: 0,
      statusCodes: {}, responseTimes: [],
      errors: []
    };

    const body = JSON.stringify({
      username: 'testuser',
      password: 'password123'
    });

    console.log('快速连续发送 15 个登录请求...');
    const startTime = Date.now();
    
    for (let i = 0; i < 15; i++) {
      await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body
      });
      const lastStatus = Object.keys(this.results.statusCodes).pop();
      const statusCode = this.results.statusCodes[lastStatus] || '?';
      const mark = lastStatus === '200' ? '✓' : (lastStatus === '429' ? '⚠️' : '✗');
      console.log(`请求 ${String(i+1).padStart(2)} [${mark}]: ${lastStatus}`);
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log('\n📊 结果:');
    console.log(`  总请求: ${this.results.total}`);
    console.log(`  ✓ 成功 (200): ${this.results.statusCodes['200'] || 0}`);
    console.log(`  ⚠️  被限流 (429): ${this.results.statusCodes['429'] || 0}`);
    console.log(`  ✗ 其他: ${this.results.failed}`);
    console.log(`  耗时: ${duration.toFixed(2)}s`);
    console.log(`  预期: 前 5 个成功，剩余被限流`);
    
    const success429 = this.results.statusCodes['429'] >= 5;
    if (success429) {
      console.log(`  ✅ 限流生效正确！`);
    } else {
      console.log(`  ⚠️  限流可能未生效，检查中间件配置`);
    }
  }

  async testConcurrentOrders() {
    console.log('\n\n📦 测试3: 并发下单 (下单限流)');
    console.log('═'.repeat(60));

    this.results = {
      total: 0, success: 0, failed: 0,
      statusCodes: {}, responseTimes: [],
      errors: []
    };

    const body = JSON.stringify({
      hotelId: 'hotel-001',
      roomType: '豪华大床房',
      quantity: 1,
      checkInDate: '2026-03-15',
      checkOutDate: '2026-03-16',
      guestName: 'Test User',
      guestPhone: '13800138000'
    });

    // 10 个用户快速连续下单
    const promises = [];
    console.log('10 个用户快速连续下单...');
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      promises.push(
        this.makeRequest('/api/orders', {
          method: 'POST',
          body,
          headers: {
            'Authorization': `Bearer token_user_${i}`
          }
        })
      );
    }

    await Promise.all(promises);
    const duration = (Date.now() - startTime) / 1000;

    console.log('\n📊 结果:');
    console.log(`  总请求: ${this.results.total}`);
    console.log(`  ✓ 成功: ${this.results.statusCodes['201'] || this.results.statusCodes['200'] || 0}`);
    console.log(`  ⚠️  被限流 (429): ${this.results.statusCodes['429'] || 0}`);
    console.log(`  ✗ 失败: ${this.results.failed}`);
    console.log(`  耗时: ${duration.toFixed(2)}s`);
    console.log(`  状态码分布: ${JSON.stringify(this.results.statusCodes)}`);
  }

  printSummary() {
    console.log('\n\n📈 测试总结');
    console.log('═'.repeat(60));
    console.log(`总请求数: ${this.results.total}`);
    const successRate = (this.results.success / this.results.total * 100).toFixed(2);
    console.log(`总成功率: ${successRate}%`);
    
    if (this.results.responseTimes.length > 0) {
      const sorted = this.results.responseTimes.sort((a, b) => a - b);
      const avg = sorted.reduce((a,b) => a+b) / sorted.length;
      console.log(`响应时间 (全部请求):`);
      console.log(`  - 最小: ${Math.min(...sorted)}ms`);
      console.log(`  - 平均: ${avg.toFixed(2)}ms`);
      console.log(`  - 最大: ${Math.max(...sorted)}ms`);
    }

    console.log('\n✅ 压力测试完成！');
    console.log('\n💡 建议:');
    console.log('  1. 查看应用日志: npm run dev');
    console.log('  2. 到 MongoDB 验证数据完整性');
    console.log('  3. 检查 MongoDB 性能: db.system.profile.find().limit(10)');
  }

  async runAll() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║           🚀 酒店预订平台 - 后端压力测试              ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
    // 检查服务是否运行
    console.log(`\n检查服务状态... (${this.baseUrl})`);
    try {
      const baseUrl = new URL(this.baseUrl);
      const response = await new Promise((resolve, reject) => {
        const tryPaths = ['/health', '/api/health'];
        let index = 0;

        const requestNext = () => {
          if (index >= tryPaths.length) {
            reject(new Error('服务未运行'));
            return;
          }

          const req = http.request({
            hostname: baseUrl.hostname,
            port: baseUrl.port,
            path: tryPaths[index],
            method: 'GET',
            timeout: 5000
          }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(true);
            } else {
              index += 1;
              requestNext();
            }
          });

          req.on('error', () => {
            index += 1;
            requestNext();
          });

          req.on('timeout', () => {
            req.destroy();
            index += 1;
            requestNext();
          });

          req.end();
        };

        requestNext();
      });

      if (!response) {
        console.error('❌ 服务检查失败！');
        process.exit(1);
      }
      console.log('✅ 服务运行正常\n');
    } catch (e) {
      console.error(`❌ 无法连接到服务：${this.baseUrl}`);
      console.error('   先启动服务: cd server && npm start');
      console.error('   或指定地址: set LOAD_TEST_BASE_URL=http://localhost:5000');
      process.exit(1);
    }

    await this.testHotelList();
    
    // 重置结果
    this.results = {
      total: 0, success: 0, failed: 0,
      statusCodes: {}, responseTimes: [],
      errors: []
    };

    await this.testLoginRateLimit();
    
    this.results = {
      total: 0, success: 0, failed: 0,
      statusCodes: {}, responseTimes: [],
      errors: []
    };

    await this.testConcurrentOrders();
    
    this.printSummary();
  }
}

// 执行测试
const tester = new LoadTester(DEFAULT_BASE_URL, {
  concurrency: 20,
  requestsPerThread: 50
});

tester.runAll().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
