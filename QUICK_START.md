# 快速启动指南

## 一、安装依赖

在项目根目录执行：

```bash
npm install
```

然后分别安装各个子项目的依赖：

```bash
# 安装后端依赖
cd server
npm install

# 安装用户端依赖
cd ./client
npm install

# 安装管理端依赖
cd ./admin
npm install
```

## 二、启动项目

### 方法1：使用根目录脚本（推荐）

在项目根目录执行：

```bash
npm run dev
```

这会同时启动：
- 后端服务（端口5000）
- 用户端（端口3000）
- 管理端（端口3001）

### 方法2：分别启动

**启动后端服务：**
```bash
cd server
npm run dev
```

**启动用户端：**
```bash
cd client
npm start
```

**启动管理端：**
```bash
cd admin
npm start
```

## 三、访问地址

- 用户端（移动端）：http://localhost:3000
- 管理端（PC端）：http://localhost:3001
- 后端API：http://localhost:5000

## 三点五、认证说明（双 Token）

- Access Token：短期有效（默认 15 分钟），放在 Authorization Header。
- Refresh Token：长期有效（默认 7 天），存于 httpOnly Cookie。
- 前端已内置 401 自动刷新逻辑。

## 四、测试账号

### 管理员账号
- 用户名：admin
- 密码：admin123

### 商户账号
- 用户名：merchant
- 密码：merchant123

## 五、功能说明

### 用户端（移动端）功能
1. **酒店查询页（首页）**
   - Banner轮播广告
   - 目的地选择
   - 入住/离店日期选择
   - 关键字搜索
   - 星级筛选
   - 价格筛选
   - 快捷标签

2. **酒店列表页**
   - 酒店列表展示
   - 综合排序/价格排序/星级排序
   - 酒店基本信息展示

3. **酒店详情页**
   - 酒店图片轮播
   - 酒店基本信息
   - 酒店设施
   - 周边信息
   - 房型价格列表
   - 预订功能

### 管理端（PC端）功能

#### 商户角色
1. **酒店信息管理**
   - 创建酒店
   - 编辑酒店信息
   - 删除酒店
   - 查看审核状态

#### 管理员角色
1. **酒店审核管理**
   - 查看所有酒店
   - 审核待审核酒店
   - 审核通过/拒绝
   - 发布酒店
   - 下线酒店

## 六、开发建议

1. **代码提交规范**
   - 每个功能点完成后及时提交
   - 提交信息要清晰明确
   - 示例：`feat: 添加酒店列表页` 或 `fix: 修复日期选择器bug`

2. **分支管理**
   - main：主分支
   - develop：开发分支
   - feature/xxx：功能分支

3. **代码规范**
   - 使用ESLint进行代码检查
   - 保持代码整洁和注释完整

## 七、常见问题

**Q: 端口被占用怎么办？**
A: 可以修改对应项目的package.json中的启动脚本，指定其他端口。

**Q: API请求失败怎么办？**
A: 检查后端服务是否正常启动，确认端口是否正确。

**Q: 为什么刷新接口无效？**
A: 刷新依赖 httpOnly Cookie。浏览器请求需开启 `withCredentials`，并确保前后端端口/域名允许携带 Cookie。

**Q: 如何添加新的酒店数据？**
A: 使用管理端的商户账号登录，点击"新增酒店"按钮。

**Q: 商户创建酒店后客户端看不到？**
A: 这是正常的！酒店需要经过审核和发布流程：
1. 商户创建酒店 → 状态为 draft + pending
2. 管理员登录查看"待审核酒店"
3. 管理员点击"审核通过"
4. 管理员点击"发布"按钮
5. 客户端即可看到该酒店

**Q: 审核通过后客户端还是看不到？**
A: 审核通过（reviewStatus: approved）后还需要手动发布（status: published）。只有状态为 published 的酒店才会在客户端显示。

**Q: 客户端能看到部分酒店但不是全部？**
A: 客户端有筛选条件。常见原因：
1. **城市过滤**：客户端默认搜索"上海"，检查酒店地址是否包含对应城市名
   - ✅ 正确：`上海市黄浦区中山东一路100号`
   - ❌ 错误：`长宁`（缺少"上海"关键词）
2. **星级过滤**：检查是否选择了特定星级
3. **价格范围**：检查是否设置了价格筛选

**解决方法：** 
- 修改酒店地址为完整地址（包含城市名）
- 清除客户端的筛选条件
- 检查浏览器开发者工具 Network 标签，查看实际请求的参数

**Q: 如何确认酒店已发布？**
A: 检查酒店的两个状态字段：
- `reviewStatus` 必须为 `approved`（审核通过）
- `status` 必须为 `published`（已发布）

只有同时满足这两个条件，酒店才会在客户端列表中显示。

## 八、双 Token 测试指南

### 自动化测试（推荐）

在项目根目录运行测试脚本：

```powershell
.\test-double-token.ps1
```

该脚本会自动测试：
- ✓ 登录并获取 Access Token 和 Refresh Token Cookie
- ✓ 使用 Access Token 访问受保护接口
- ✓ 使用 Refresh Token 刷新 Access Token
- ✓ 验证 Token 旋转机制
- ✓ 退出登录并验证 Token 失效

### 手动测试（curl）

#### 1) 登录并保存 Cookie

```bash
curl -v -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"merchant","password":"merchant123"}' \
   -c cookie.txt
```

**验证点：**
- 响应包含 `data.accessToken` 字段
- 响应头包含 `Set-Cookie: refresh_token=...` 且带 `HttpOnly` 和 `Path=/api/auth`

#### 2) 访问受保护接口

```bash
# 从上一步响应中复制 accessToken
curl http://localhost:5000/api/auth/me \
   -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**验证点：** 返回用户信息

#### 3) 刷新 Access Token

```bash
curl -v -X POST http://localhost:5000/api/auth/refresh \
   -b cookie.txt \
   -c cookie.txt
```

**验证点：**
- 返回新的 `data.accessToken`
- Cookie 中的 refresh_token 被更新（Token 旋转）

#### 4) 退出登录

```bash
curl -v -X POST http://localhost:5000/api/auth/logout \
   -b cookie.txt
```

**验证点：** Refresh Token Cookie 被清除

### 浏览器测试

1. 打开管理端 http://localhost:3001
2. 打开浏览器开发者工具（F12）→ Network 标签
3. 使用 merchant/merchant123 登录
4. 查看 `/api/auth/login` 请求：
   - Response: 包含 `accessToken`
   - Headers: 包含 `Set-Cookie: refresh_token`
5. 打开 Application → Cookies：
   - 应该看到 `refresh_token`（HttpOnly）
6. 在 Console 测试自动刷新：
   ```javascript
   // 设置一个过期的 token
   localStorage.setItem('admin_token', 'expired_token');
   // 刷新页面，观察 Network 中的自动刷新请求
   location.reload();
   ```

## 九、技术支持

如有问题，请联系课程项目组。
