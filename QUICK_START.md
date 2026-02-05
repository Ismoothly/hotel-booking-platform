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
cd ../client
npm install

# 安装管理端依赖
cd ../admin
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

## 八、示例请求流程（curl）

### 1) 登录并保存 Cookie

```bash
curl -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"merchant","password":"merchant123"}' \
   -c cookie.txt
```

### 2) 访问受保护接口

```bash
curl http://localhost:5000/api/auth/me \
   -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 3) 刷新 Access Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
   -b cookie.txt
```

### 4) 退出登录

```bash
curl -X POST http://localhost:5000/api/auth/logout \
   -b cookie.txt
```

## 九、技术支持

如有问题，请联系课程项目组。
