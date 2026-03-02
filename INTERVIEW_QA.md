# 后端面试追问与标准答案

## 项目：酒店预订平台后端设计

---

## 🔥 分布式锁相关追问

### Q1: Redis 单点故障怎么办？

**标准答案**：
> "单点 Redis 确实有风险，生产环境我们会用 **Redis 哨兵模式** 或 **Redis Cluster** 做高可用。
> 
> - **哨兵模式**：主从复制 + 自动故障转移，主节点挂了 30 秒内自动切换到从节点
> - **Redlock 算法**：在 3 个独立 Redis 实例上同时获取锁，超过半数成功才算获取成功，单节点挂了不影响
> 
> 如果对可用性要求极高，我们还可以加 **降级策略**：Redis 不可用时自动回退到 MongoDB 乐观锁，保证服务不中断。"

**追问**：那主从切换期间锁会丢失吗？

**答**：
> "会有短暂的数据丢失窗口（异步复制延迟），所以 Redlock 要求在多个独立实例上获取锁。或者用 **Zookeeper / etcd**，它们基于 Raft 协议能保证强一致性，但性能比 Redis 低 30%。权衡下来，酒店预订场景允许极少量冲突，Redis + 异步复制足够。"

---

### Q2: 锁超时了但业务还没执行完怎么办？

**标准答案**：
> "这是分布式锁最经典的坑，有三种解决方案：
> 
> **方案1：设置合理的超时时间**（推荐）
> - 根据业务逻辑设置 TTL，支付流程一般 5-10 秒够了
> - 给个 Buffer：如果逻辑耗时 3 秒，就设置 10 秒过期
> 
> **方案2：自动续期（Watchdog）**
> ```javascript
> // 后台线程每 3 秒检查一次，如果业务还在执行就延长 TTL
> const watchdog = setInterval(() => {
>   redis.expire(`lock:${key}`, 10);
> }, 3000);
> // 业务完成后清理
> clearInterval(watchdog);
> ```
> 
> **方案3：幂等性设计**
> - 即使锁超时被别人抢到，用订单号 + 状态机保证不会重复扣款
> - 核心是业务逻辑本身要幂等，锁只是性能优化"

**追问**：那释放锁的时候怎么保证不会误删别人的锁？

**答**：
> "用 **Lua 脚本 + 唯一标识符**：
> ```javascript
> const lockId = uuidv4(); // 获取锁时生成唯一 ID
> // 释放时判断是自己的锁才删除
> const script = `
>   if redis.call('get', KEYS[1]) == ARGV[1] then
>     return redis.call('del', KEYS[1])
>   else
>     return 0
>   end
> `;
> redis.eval(script, 1, `lock:${key}`, lockId);
> ```
> Lua 脚本保证 get + del 是原子操作，不会被打断。"

---

## 🔒 并发控制追问

### Q3: 乐观锁和悲观锁的区别？为什么选乐观锁？

**标准答案**：
| 类型 | 实现方式 | 适用场景 | 优缺点 |
|------|---------|---------|--------|
| **乐观锁** | 版本号 / CAS / 条件更新 | 读多写少，冲突率低 | ✅ 高并发性能好<br>❌ 冲突时需要重试 |
| **悲观锁** | SELECT FOR UPDATE / Redis SETNX | 写多读少，必须串行 | ✅ 强一致性<br>❌ 阻塞等待，性能差 |

> "我们选乐观锁因为：
> 1. 酒店预订是低冲突场景（同一房型同时下单概率 < 5%）
> 2. MongoDB 的 `updateOne` 条件更新天然支持乐观锁
> 3. 不阻塞其他请求，吞吐量比悲观锁高 3-5 倍
> 
> 如果是茅台抢购（冲突率 > 80%），才考虑悲观锁或消息队列削峰。"

---

### Q4: 如果并发量特别大，modifiedCount === 0 的重试会不会雪崩？

**标准答案**：
> "好问题！确实存在这个风险，有三个优化方向：
> 
> **优化1：限流 + 指数退避**
> ```javascript
> let retries = 0;
> while (retries < 3) {
>   const result = await Hotel.updateOne(condition, update);
>   if (result.modifiedCount > 0) break;
>   await sleep(Math.pow(2, retries) * 100); // 100ms, 200ms, 400ms
>   retries++;
> }
> ```
> 
> **优化2：前置限流**
> - 已经做了：下单 5/1min、支付 3/1min
> - 前端加验证码：防止脚本刷单
> 
> **优化3：消息队列削峰**（极端高并发）
> - 下单请求扔到 RabbitMQ，用 worker 串行处理
> - 保证数据库压力可控
> 
> 当前我们的限流参数是根据压测结果调优的，正常场景下重试率 < 5%。"

---

## 🔐 JWT 认证追问

### Q5: Refresh Token 存在哪里？为什么不存 localStorage？

**标准答案**：
> "Refresh Token 存在 **httpOnly Cookie** 里，有三个安全优势：
> 
> 1. **防 XSS 攻击**：JavaScript 无法读取 httpOnly Cookie，即使页面被注入恶意脚本也拿不到
> 2. **自动携带**：浏览器会自动在请求里带上，不用前端手动管理
> 3. **有过期时间**：设置 maxAge = 7 天，到期自动失效
> 
> 如果放 localStorage：
> - ❌ XSS 攻击可以用 `localStorage.getItem('token')` 直接读取
> - ❌ 需要手动清理，容易泄露
> 
> Access Token 可以放 localStorage（15 分钟过期，风险窗口小）。"

**追问**：那 CSRF 攻击怎么办？

**答**：
> "Cookie 确实有 CSRF 风险，我们做了两层防护：
> 1. **SameSite=Strict**：Cookie 只在同站请求时发送
> 2. **CORS 白名单**：只允许我们自己的域名调用 API
> 
> 前端还可以加 CSRF Token（后端生成随机 token，前端放请求头），但当前我们的 SameSite 策略已经能防住常见 CSRF 攻击。"

---

### Q6: Access Token 过期时，前端如何自动刷新？

**标准答案**：
> "用 **Axios 拦截器** 实现无感刷新：
> ```javascript
> // 响应拦截器
> axios.interceptors.response.use(
>   response => response,
>   async error => {
>     if (error.response?.status === 401 && !error.config._retry) {
>       error.config._retry = true;
>       // 调用刷新接口
>       const { data } = await axios.post('/api/auth/refresh');
>       // 更新 Access Token
>       localStorage.setItem('accessToken', data.accessToken);
>       // 重放原请求
>       error.config.headers['Authorization'] = `Bearer ${data.accessToken}`;
>       return axios.request(error.config);
>     }
>     return Promise.reject(error);
>   }
> );
> ```
> 
> 关键点：
> - `_retry` 标记防止无限循环
> - 刷新失败才跳转登录页
> - 并发请求只刷新一次（加全局锁）"

**追问**：如果 Refresh Token 也过期了呢？

**答**：
> "那就是真正的登录超时，清空本地 token 并跳转登录页。我们设置 Refresh 7 天过期，意味着用户一周不用就要重新登录，这是合理的安全策略。如果要'永久登录'，可以延长到 30 天，但风险更高。"

---

## 📊 数据库设计追问

### Q7: MongoDB 的事务性能怎么样？和 MySQL 比呢？

**标准答案**：
> "MongoDB 4.0+ 支持 ACID 事务，性能对比：
> 
> | 维度 | MongoDB | MySQL |
> |------|---------|-------|
> | 单文档操作 | 更快（原生原子性） | 需要事务包裹 |
> | 跨文档事务 | 慢 20%（需要协调） | 行级锁性能更好 |
> | 嵌套数据 | 一次查询（rooms 在 hotels 里） | 需要 JOIN（慢） |
> | 水平扩展 | 天然分片 | 分库分表复杂 |
> 
> 我们的场景：
> - 事务只用在支付扣库存（低频）
> - 大部分操作是单文档（不需要事务）
> - MongoDB 的嵌套文档避免了大量 JOIN，整体性能反而更好
> 
> 如果是金融系统要求强一致性，我会选 MySQL + 分布式事务。"

---

### Q8: 为什么 rooms 要嵌套在 hotels 里，不单独建表？

**标准答案**：
> "这是 **嵌入式文档 vs 引用** 的权衡：
> 
> **嵌入式（当前方案）**：
> ```javascript
> {
>   _id: 'hotel123',
>   nameCn: '上海外滩酒店',
>   rooms: [
>     { type: '豪华大床房', quantity: 10, price: 888 }
>   ]
> }
> ```
> ✅ 一次查询拿全（无需 JOIN）
> ✅ 更新库存原子性（同一文档）
> ❌ 不适合 rooms 频繁独立查询
> 
> **引用（SQL 风格）**：
> ```javascript
> // hotels 表
> { _id: 'hotel123', nameCn: '...' }
> // rooms 表
> { _id: 'room456', hotelId: 'hotel123', type: '...' }
> ```
> ✅ 适合 rooms 独立管理
> ❌ 需要 JOIN 或多次查询
> 
> 我们的业务：酒店和房型是强关联的（查酒店必看房型），嵌入更高效。"

---

### Q9: 索引怎么设计的？为什么是这几个字段？

**标准答案**：
> "索引设计基于 **查询频率 + 数据量**：
> 
> **orders 集合**：
> ```javascript
> { userId: 1, status: 1, createdAt: -1 } // 复合索引
> { orderId: 1 }  // 唯一索引
> ```
> - 理由：'我的订单'高频查询 `find({ userId, status }).sort({ createdAt: -1 })`
> - 复合索引覆盖了这个查询，避免全表扫描
> 
> **hotels 集合**：
> ```javascript
> { status: 1, city: 1, 'rooms.price': 1 }
> ```
> - 理由：列表页按城市、状态、价格区间筛选
> 
> **索引选择原则**：
> 1. 高频查询字段优先
> 2. 等值查询在前，范围查询在后
> 3. 写多的字段少建索引（每次 insert 都要更新索引）
> 
> 我们用 MongoDB Compass 的查询分析器验证了索引命中率 > 95%。"

---

## 🚀 性能优化追问

### Q10: 如果订单表到 1000 万条，查询会不会很慢？

**标准答案**：
> "会变慢，但有优化方案：
> 
> **方案1：分页 + 索引**（当前已做）
> - 每页只查 10 条，有 userId + createdAt 复合索引
> - 即使 1000 万条，查询时间 < 100ms
> 
> **方案2：冷热数据分离**
> - 3 个月前的订单归档到 `orders_archive` 集合
> - 查询时先查热表，没有再查归档表
> 
> **方案3：按时间分表**
> ```
> orders_2026_01
> orders_2026_02
> ...
> ```
> - 查询时自动路由到对应月份的表
> 
> **方案4：读写分离**
> - MongoDB 副本集：主节点写，从节点读
> - 订单列表从从节点读，减轻主节点压力
> 
> 当前项目量级不需要分表，但我预留了时间字段索引，后续扩展方便。"

---

### Q11: 限流参数怎么定的？为什么登录是 5 次？

**标准答案**：
> "限流参数来自 **业务分析 + 压测验证**：
> 
> **登录 5/15min**：
> - 正常用户：输错密码 2-3 次就会仔细看
> - 暴力破解：工具每秒尝试上百次
> - 5 次能拦住 99% 的暴力攻击，不影响正常用户
> 
> **下单 5/1min**：
> - 正常用户：选房、填信息需要 1-2 分钟
> - 刷单脚本：1 秒下几十单
> - 5 次/分钟能拦住机器人，不影响真人
> 
> **支付 3/1min**：
> - 正常用户：支付失败重试 1-2 次
> - 重放攻击：1 秒重复支付几十次
> - 3 次够用且更严格（涉及扣款）
> 
> **调优过程**：
> 1. 初始设置保守值（登录 3 次）
> 2. 线上观察误伤率（客服投诉）
> 3. 逐步放宽到 5 次
> 4. 用 Prometheus 监控触发率，保持在 1% 以下"

---

## 🛡️ 安全性追问

### Q12: 密码怎么存储的？用的什么算法？

**标准答案**：
> "用 **bcrypt** 加盐哈希：
> ```javascript
> const bcrypt = require('bcryptjs');
> const hashedPassword = await bcrypt.hash(password, 10); // 10 轮
> ```
> 
> **为什么不用 MD5 / SHA256**？
> - MD5/SHA：太快，GPU 每秒能破解几十亿次
> - bcrypt：故意慢（10 轮需要 100ms），暴力破解不现实
> - 且每次生成不同的盐（salt），彩虹表攻击无效
> 
> **10 轮的选择**：
> - 轮数越高越安全，但登录越慢
> - 10 轮：安全性够（2^10 = 1024 次计算）+ 用户体验好（100ms）
> - 如果对安全要求极高，可以调到 12 轮
> 
> 验证时用 `bcrypt.compare(plainPassword, hashedPassword)`，自动处理盐。"

---

### Q13: SQL 注入怎么防？

**标准答案**：
> "MongoDB 天然防 SQL 注入，但有 **NoSQL 注入** 风险：
> 
> **攻击示例**：
> ```javascript
> // 恶意请求：{ username: { $ne: null }, password: { $ne: null } }
> // 会匹配到任意用户
> User.findOne({ username: req.body.username, password: req.body.password });
> ```
> 
> **防护措施**：
> 1. **类型校验**（已做）：
> ```javascript
> if (typeof username !== 'string' || typeof password !== 'string') {
>   return res.status(400).json({ message: '参数类型错误' });
> }
> ```
> 
> 2. **使用 Mongoose**：
> - Mongoose 会自动过滤 `$ne`, `$gt` 等操作符
> - Schema 定义严格类型限制
> 
> 3. **输入白名单**：
> - 用户名只允许字母数字下划线：`/^[a-zA-Z0-9_]+$/`
> - 在 User Schema 里做了正则校验
> 
> 所以我们是三层防护：前端校验 + 后端类型检查 + Mongoose Schema 约束。"

---

## 💰 扩展性追问

### Q14: 如果要做秒杀功能，现有架构需要改什么？

**标准答案**：
> "秒杀是高并发极端场景，需要四个改进：
> 
> **改进1：Redis 预减库存**
> ```javascript
> // 秒杀前把库存加载到 Redis
> redis.set('stock:hotel123:room456', 100);
> 
> // 秒杀时先扣 Redis
> const remaining = await redis.decr('stock:hotel123:room456');
> if (remaining < 0) {
>   redis.incr('stock:hotel123:room456'); // 回滚
>   return '库存不足';
> }
> // 通过 Redis 再写 MongoDB
> ```
> 
> **改进2：消息队列削峰**
> - 用户请求先入队（RabbitMQ）
> - Worker 串行处理，保护数据库
> 
> **改进3：CDN + 页面静态化**
> - 秒杀页面全部静态化，CDN 分发
> - 只有下单按钮调 API
> 
> **改进4：限流升级**
> - 网关层限流（Nginx limit_req）
> - 前端加验证码防刷
> 
> 当前架构可以支撑 QPS < 1000 的普通促销，真正秒杀需要上述改造。"

---

### Q15: 多机房部署怎么保证数据一致性？

**标准答案**：
> "多机房是**可用性 vs 一致性**的权衡：
> 
> **方案1：主从架构**（推荐）
> - 北京机房：主 MongoDB + 主 Redis
> - 上海机房：从 MongoDB + 从 Redis
> - 写操作全部到主，读操作可以从
> - 优点：强一致性，缺点：主机房挂了写服务中断
> 
> **方案2：双活架构**
> - 两个机房都可读可写
> - 用 MongoDB 的 **Causal Consistency** 保证最终一致性
> - 冲突解决：时间戳晚的胜出
> - 优点：任意机房挂了不影响，缺点：有短暂不一致窗口
> 
> 酒店预订场景：
> - 用方案1（主从）：库存扣减必须强一致性
> - 查询接口可以从机房读（延迟 100ms 可接受）
> - 用消息队列同步订单到分析系统（异步）
> 
> 如果是社交产品（如朋友圈），可以用方案2。"

---

## 📈 监控与调试追问

### Q16: 线上如何排查慢查询？

**标准答案**：
> "用 **MongoDB Profiler + 日志分析**：
> 
> **步骤1：开启慢查询日志**
> ```javascript
> // 记录超过 100ms 的查询
> db.setProfilingLevel(1, { slowms: 100 });
> ```
> 
> **步骤2：查看慢查询**
> ```javascript
> db.system.profile.find().sort({ ts: -1 }).limit(10);
> ```
> 
> **步骤3：分析 explain**
> ```javascript
> db.orders.find({ userId: '123' }).explain('executionStats');
> // 看 executionTimeMillis 和 totalDocsExamined
> ```
> 
> **常见问题**：
> - 没用索引：`totalDocsExamined` 很大 → 建索引
> - 索引失效：查询条件有 `$or` / 正则 → 优化查询
> - 数据量太大：考虑分页或归档
> 
> 生产环境：
> - 用 **MongoDB Atlas**：内置性能监控面板
> - 或接入 **APM**（如阿里云 ARMS）：自动采集慢查询
> - 设置告警：慢查询数 > 10/分钟 发钉钉通知"

---

### Q17: 如果线上出现超卖，怎么快速定位和修复？

**标准答案**：
> "应急响应流程：
> 
> **第1步：止损（5分钟内）**
> ```javascript
> // 紧急下线受影响的酒店
> db.hotels.updateOne(
>   { _id: 'hotel123' },
>   { $set: { status: 'maintenance' } }
> );
> // 或者调大限流参数，暂停支付
> ```
> 
> **第2步：定位原因（10分钟）**
> - 查日志：`grep 'modifiedCount === 0' logs/*.log`
> - 是并发冲突还是逻辑 bug？
> - 看监控：事务成功率是否异常
> 
> **第3步：数据修复（30分钟）**
> ```javascript
> // 查询超卖订单
> const overSold = await Order.find({
>   'items.hotelId': 'hotel123',
>   status: 'paid',
>   paidAt: { $gte: incidentTime }
> });
> 
> // 给用户退款 + 补偿
> for (const order of overSold) {
>   await order.refund();  // 调支付网关
>   await sendNotification(order.userId, '补偿通知');
> }
> ```
> 
> **第4步：根因分析**
> - 写事后报告（5W1H）
> - 加自动化测试防回归
> - 优化监控告警（库存负数立即报警）
> 
> **预防措施**：
> - 每天跑脚本检查：`db.hotels.find({ 'rooms.quantity': { $lt: 0 } })`
> - 监控告警：库存异常率 > 0.1% 发钉钉"

---

## 🎯 综合能力追问

### Q18: 如果让你重新设计，你会改什么？

**标准答案**（展示架构思维）：
> "基于当前经验，我会做三个改进：
> 
> **改进1：引入缓存层**
> - 热门酒店信息放 Redis（TTL 10分钟）
> - 减少 MongoDB 查询压力 70%
> - 用 Redis Pub/Sub 做缓存失效通知
> 
> **改进2：订单状态机显式化**
> ```javascript
> const OrderStateMachine = {
>   pending: ['confirmed', 'cancelled'],
>   confirmed: ['paid', 'cancelled'],
>   paid: ['refunded'],  // 不允许直接 cancelled
>   cancelled: []
> };
> ```
> - 防止非法状态转换
> - 当前是 if-else 判断，容易漏场景
> 
> **改进3：可观测性增强**
> - 接入链路追踪（Jaeger）：看请求在各服务的耗时
> - 结构化日志（JSON 格式）：方便 ELK 分析
> - 业务指标监控：支付成功率、平均响应时间
> 
> 但这些要根据业务量级权衡，当前架构已经满足中小规模需求。"

---

### Q19: 你觉得这个项目最大的亮点是什么？

**标准答案**（总结卖点）：
> "我认为有**三个亮点**：
> 
> **1. 并发控制三件套**
> - 限流 + 事务 + 乐观锁组合拳
> - 不是单一方案，而是分层防护
> - 能应对 QPS 500 的并发下单不超卖
> 
> **2. 安全性设计**
> - JWT 双 Token（窃取风险窗口 < 15分钟）
> - bcrypt + 盐哈希（暴力破解不现实）
> - 多层限流（登录/下单/支付分别控制）
> 
> **3. 可扩展架构**
> - MongoDB 嵌套文档避免 JOIN
> - 路由/控制器/模型分层清晰
> - 预留了分布式锁、缓存、消息队列的扩展点
> 
> 这个项目虽然规模不大，但该踩的坑都踩了，该考虑的都考虑了。如果面试官关注某个点，我可以深入讲代码实现。"

---

## 📚 补充：一句话回答技巧

| 问题类型 | 回答模板 |
|---------|---------|
| 为什么选 X？ | "对比 Y 的优劣 → 我们场景更适合 X → 举例说明" |
| 如果出现问题 Z？ | "立即止损 → 定位原因 → 修复数据 → 预防措施" |
| 能否支持场景 W？ | "当前可以/不行 → 需要改进点 → 具体实现方案" |
| 有什么不足？ | "承认短板 → 但符合当前业务 → 给出优化方向" |

**关键原则**：
- ✅ 诚实：不懂的说"这块还没深入研究，但可以从 X 方向思考"
- ✅ 自信：说"我们项目里是这样实现的"（有代码支撑）
- ✅ 深度：不要只说概念，讲具体代码和行号
- ✅ 思考：展示权衡和演进思路，不是死记硬背

---

**最后提醒**：面试时带上笔记本，随时打开代码给面试官看，说服力 +100%！
