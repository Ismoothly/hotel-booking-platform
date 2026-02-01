# 项目结构说明

## 整体结构

```
hotel-booking-platform/
├── README.md                 # 项目说明文档
├── QUICK_START.md           # 快速启动指南
├── package.json             # 根目录package.json
├── .gitignore              # Git忽略文件
│
├── server/                  # 后端服务（Node.js + Express）
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   │   └── index.js    # 环境配置
│   │   ├── models/         # 数据模型
│   │   │   ├── User.js     # 用户模型
│   │   │   └── Hotel.js    # 酒店模型
│   │   ├── controllers/    # 控制器
│   │   │   ├── authController.js    # 认证控制器
│   │   │   ├── hotelController.js   # 酒店控制器
│   │   │   └── adminController.js   # 管理员控制器
│   │   ├── routes/         # 路由
│   │   │   ├── auth.js     # 认证路由
│   │   │   ├── hotels.js   # 酒店路由
│   │   │   └── admin.js    # 管理员路由
│   │   ├── middleware/     # 中间件
│   │   │   └── auth.js     # 认证中间件
│   │   ├── utils/          # 工具函数
│   │   │   └── jwt.js      # JWT工具
│   │   └── index.js        # 入口文件
│   ├── .env                # 环境变量
│   └── package.json        # 依赖配置
│
├── client/                  # 用户端（移动端 - React）
│   ├── public/             # 静态文件
│   │   └── index.html      # HTML模板
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── Home.js           # 首页（酒店查询页）
│   │   │   ├── Home.css          # 首页样式
│   │   │   ├── HotelList.js      # 酒店列表页
│   │   │   ├── HotelList.css     # 列表页样式
│   │   │   ├── HotelDetail.js    # 酒店详情页
│   │   │   └── HotelDetail.css   # 详情页样式
│   │   ├── services/       # API服务
│   │   │   └── api.js      # API封装
│   │   ├── contexts/       # React Context
│   │   │   └── SearchContext.js  # 搜索上下文
│   │   ├── utils/          # 工具函数
│   │   │   └── helpers.js  # 辅助函数
│   │   ├── App.js          # 应用主组件
│   │   ├── App.css         # 应用样式
│   │   └── index.js        # 入口文件
│   └── package.json        # 依赖配置
│
└── admin/                   # 管理端（PC端 - React + Ant Design）
    ├── public/             # 静态文件
    │   └── index.html      # HTML模板
    ├── src/
    │   ├── pages/          # 页面组件
    │   │   ├── Login.js           # 登录注册页
    │   │   ├── Login.css          # 登录页样式
    │   │   └── HotelManagement.js # 酒店管理页
    │   ├── services/       # API服务
    │   │   └── api.js      # API封装
    │   ├── contexts/       # React Context
    │   │   └── AuthContext.js     # 认证上下文
    │   ├── App.js          # 应用主组件
    │   ├── App.css         # 应用样式
    │   └── index.js        # 入口文件
    └── package.json        # 依赖配置
```

## 核心功能模块说明

### 1. 后端服务（server/）

#### 数据模型
- **User.js**: 用户管理，支持商户和管理员两种角色
- **Hotel.js**: 酒店信息管理，包含状态管理和审核流程

#### 控制器
- **authController**: 处理用户注册、登录、获取当前用户信息
- **hotelController**: 处理酒店的CRUD操作（商户功能）
- **adminController**: 处理酒店审核、发布、下线等管理功能

#### 路由
- **/api/auth**: 认证相关接口
- **/api/hotels**: 酒店信息接口
- **/api/admin**: 管理员专用接口

### 2. 用户端（client/）

#### 页面组件
- **Home**: 酒店查询页（首页）
  - Banner轮播
  - 搜索条件设置
  - 筛选器
  
- **HotelList**: 酒店列表页
  - 酒店列表展示
  - 排序功能
  - 滚动加载
  
- **HotelDetail**: 酒店详情页
  - 图片轮播
  - 详细信息展示
  - 房型列表
  - 预订功能

#### 核心功能
- **SearchContext**: 全局搜索参数管理
- **API服务**: 统一的HTTP请求封装

### 3. 管理端（admin/）

#### 页面组件
- **Login**: 登录注册页
  - 支持商户和管理员注册
  - 角色选择
  
- **HotelManagement**: 酒店管理页
  - 商户：酒店CRUD操作
  - 管理员：审核、发布、下线功能

#### 核心功能
- **AuthContext**: 全局认证状态管理
- **权限控制**: 基于角色的访问控制

## 数据流说明

### 用户端数据流
1. 用户在首页设置搜索条件
2. 搜索参数存储在SearchContext
3. 跳转到列表页，使用存储的参数请求API
4. 点击酒店项进入详情页
5. 在详情页可以查看完整信息并预订

### 管理端数据流

#### 商户流程
1. 商户登录系统
2. 创建/编辑酒店信息
3. 提交后进入审核状态
4. 等待管理员审核

#### 管理员流程
1. 管理员登录系统
2. 查看待审核酒店列表
3. 审核通过/拒绝
4. 审核通过后可发布
5. 已发布可下线

## API接口说明

### 认证接口
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录
- GET /api/auth/me - 获取当前用户

### 酒店接口（用户端）
- GET /api/hotels - 获取酒店列表
- GET /api/hotels/:id - 获取酒店详情

### 酒店接口（商户端）
- GET /api/hotels/merchant/my-hotels - 获取我的酒店
- POST /api/hotels - 创建酒店
- PUT /api/hotels/:id - 更新酒店
- DELETE /api/hotels/:id - 删除酒店

### 管理员接口
- GET /api/admin/hotels - 获取所有酒店
- GET /api/admin/hotels/pending - 获取待审核酒店
- PUT /api/admin/hotels/:id/approve - 审核通过
- PUT /api/admin/hotels/:id/reject - 审核拒绝
- PUT /api/admin/hotels/:id/publish - 发布酒店
- PUT /api/admin/hotels/:id/unpublish - 下线酒店
- PUT /api/admin/hotels/:id/restore - 恢复酒店

## 状态管理

### 酒店审核状态（reviewStatus）
- pending: 待审核
- approved: 审核通过
- rejected: 审核拒绝

### 酒店发布状态（status）
- draft: 草稿
- published: 已发布
- unpublished: 已下线

## 技术亮点

1. **前后端分离**: 清晰的架构设计
2. **权限控制**: 基于JWT的认证和角色权限管理
3. **响应式设计**: 移动端适配
4. **状态管理**: React Context API
5. **代码复用**: 可复用组件和工具函数
6. **API封装**: 统一的请求拦截和错误处理
7. **用户体验**: 
   - 移动端使用Ant Design Mobile
   - PC端使用Ant Design
   - 流畅的页面切换
   - 友好的错误提示

## 扩展建议

1. **数据持久化**: 接入MongoDB或MySQL数据库
2. **图片上传**: 集成七牛云或阿里云OSS
3. **支付功能**: 接入支付宝/微信支付
4. **订单管理**: 完善预订和订单管理功能
5. **评论系统**: 添加用户评价功能
6. **地图集成**: 接入高德/百度地图
7. **消息通知**: 添加站内消息和邮件通知
8. **数据分析**: 添加统计报表功能
