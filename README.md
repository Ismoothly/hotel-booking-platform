# 易宿酒店预订平台

第五期前端训练营大作业项目

## 项目简介

智慧出行酒店预订平台是一个面向现代旅游出行场景的综合服务体系，旨在为酒店商家与终端消费者之间搭建高效、便捷的信息交互桥梁。

## 项目结构

```
hotel-booking-platform/
├── client/          # 用户端（移动端）
├── admin/           # 管理端（PC端）
├── server/          # 后端服务
└── README.md
```

## 技术栈

### 前端
- **用户端**: React 18 + React Router + Ant Design Mobile
- **管理端**: React 18 + React Router + Ant Design
- **状态管理**: React Hooks + Context API
- **HTTP客户端**: Axios

### 后端
- **框架**: Node.js + Express
- **数据库**: 内存数据库（可扩展为MongoDB/MySQL）
- **认证**: JWT

## 功能模块

### 用户端（移动端）
1. **酒店查询页**
   - 顶部Banner广告
   - 地点定位
   - 关键字搜索
   - 入住日期选择
   - 筛选条件（星级、价格）
   - 快捷标签

2. **酒店列表页**
   - 核心条件筛选
   - 详细筛选
   - 酒店列表（支持滚动加载）

3. **酒店详情页**
   - 酒店图片轮播
   - 基础信息展示
   - 日历选择
   - 房型价格列表

### 管理端（PC端）
1. **用户登录/注册**
   - 支持商户和管理员两种角色

2. **酒店信息管理**（商户角色）
   - 酒店信息录入
   - 信息编辑和修改

3. **酒店审核管理**（管理员角色）
   - 信息审核（通过/不通过）
   - 酒店发布
   - 酒店下线

## 快速开始

### 安装依赖

```bash
# 安装所有依赖
npm run install-all
```

### 开发模式

```bash
# 同时启动所有服务
npm run dev

# 或分别启动
npm run dev:client   # 启动用户端（端口3000）
npm run dev:admin    # 启动管理端（端口3001）
npm run dev:server   # 启动后端服务（端口5000）
```

### 构建生产版本

```bash
npm run build
```

## 默认账号

### 管理员账号
- 用户名: admin
- 密码: admin123

### 商户账号
- 用户名: merchant
- 密码: merchant123

## API文档

### 基础路径
- 开发环境: `http://localhost:5000/api`

### 主要接口

#### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

#### 酒店信息
- `GET /api/hotels` - 获取酒店列表
- `GET /api/hotels/:id` - 获取酒店详情
- `POST /api/hotels` - 创建酒店（商户）
- `PUT /api/hotels/:id` - 更新酒店（商户）
- `DELETE /api/hotels/:id` - 删除酒店（商户）

#### 审核管理
- `GET /api/admin/hotels/pending` - 获取待审核酒店
- `PUT /api/admin/hotels/:id/approve` - 审核通过
- `PUT /api/admin/hotels/:id/reject` - 审核拒绝
- `PUT /api/admin/hotels/:id/publish` - 发布酒店
- `PUT /api/admin/hotels/:id/unpublish` - 下线酒店

## 数据字段说明

### 酒店信息必填字段
- 酒店名称（中英文）
- 酒店地址
- 酒店星级
- 酒店房型
- 酒店价格
- 开业时间

### 可选字段
- 附近景点
- 交通信息
- 附近商场
- 优惠信息

## 评分标准

- 功能完成度：60分
- 技术复杂度：10分
- 用户体验：10分
- 代码质量：10分
- 项目创新性：10分

## 注意事项

1. 代码需要有清晰的Git提交记录
2. 不要一次性提交所有代码
3. 每个提交应该有明确的意义
4. 可以使用开源UI组件库

## 开发团队




