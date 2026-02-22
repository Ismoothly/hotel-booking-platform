# 微信小程序真机调试指南

## 问题症状

- ✅ **模拟器运行正常**：在微信开发者工具中一切正常
- ❌ **真机调试失败**：登录失败、酒店列表加载失败、网络请求超时

## 原因分析

真机调试失败的主要原因：

1. **localhost 无法访问**  
   真机设备无法访问开发电脑的 `localhost:5000`，必须使用局域网 IP

2. **域名校验限制**  
   微信小程序默认会检查请求域名白名单（已在项目中关闭）

3. **跨网络问题**  
   手机和电脑不在同一 WiFi 网络

## 快速解决方法

### 步骤 1：获取电脑局域网 IP

#### Windows 系统
```powershell
ipconfig
```
查找 `IPv4 地址`，例如：`192.168.1.100`

#### Mac/Linux 系统
```bash
ifconfig
# 或
ip addr
```
查找 `inet` 地址，例如：`192.168.1.100`

### 步骤 2：确保后端服务启动

```bash
cd server
npm run dev
```

确认后端运行在 `http://0.0.0.0:5000` 或 `http://localhost:5000`

### 步骤 3：在小程序中配置 API 地址

1. 打开小程序，进入【我的】页面
2. 点击【⚙️ API 配置】菜单
3. 输入你的电脑 IP 地址：
   ```
   http://192.168.1.100:5000/api
   ```
   > 注意：将 `192.168.1.100` 替换为你电脑的实际 IP

4. 点击【测试连接】验证是否成功
5. 点击【保存配置】

### 步骤 4：重启小程序

配置保存后，关闭并重新打开小程序，配置即可生效。

## 配置检查清单

- [ ] 电脑和手机连接同一 WiFi
- [ ] 后端服务器已启动（端口 5000）
- [ ] 防火墙允许端口 5000 访问
- [ ] API 地址格式正确（http:// 开头，/api 结尾）
- [ ] IP 地址是局域网地址（192.168.x.x 或 10.x.x.x）

## 常见问题

### Q1: 测试连接失败，显示 "连接超时"
**检查事项：**
- 后端服务是否启动？运行 `npm run dev` 在 server 目录
- 手机和电脑是否在同一 WiFi？
- 防火墙是否阻止了 5000 端口？

**Windows 添加防火墙规则：**
```powershell
netsh advfirewall firewall add rule name="Node 5000" dir=in action=allow protocol=TCP localport=5000
```

### Q2: 连接成功但登录失败
**检查事项：**
- 数据库是否正常？MongoDB 是否启动？
- 查看后端日志，是否有错误信息
- 测试账号：username: `admin`, password: `admin123`

### Q3: 模拟器可以，真机不行
**原因：**
- 模拟器使用 localhost 访问开发电脑
- 真机必须使用局域网 IP

**解决：**
- 按照上述步骤配置 API 地址为局域网 IP

### Q4: 每次重启小程序都要重新配置？
**不需要！**
- API 地址会保存在本地存储中
- 只有更换网络或 IP 变化时才需要重新配置

## 开发模式 vs 生产模式

### 开发模式（当前）
- 使用 HTTP 协议
- 域名校验已关闭 (`urlCheck: false`)
- 可以使用局域网 IP

### 生产模式
- 必须使用 HTTPS 协议
- 必须配置合法域名白名单
- 在微信公众平台配置服务器域名

## 便捷调试技巧

### 1. 使用 Console 打印日志
在微信开发者工具的 Console 中查看详细日志：
```javascript
console.log('📡 API 请求:', url, method, data)
console.log('✅ 响应成功:', response)
console.error('🔴 请求失败:', error)
```

### 2. 使用 vconsole 调试真机
在真机上启用 vconsole 查看日志：
```typescript
// 在 app.tsx 中添加
if (process.env.NODE_ENV === 'development') {
  // vconsole 会显示在真机屏幕上
}
```

### 3. 查看网络请求
微信开发者工具 → 调试器 → Network 标签页，查看所有网络请求。

## 测试用例

配置完成后，测试以下功能：

1. **登录测试**
   - 用户名：`admin`
   - 密码：`admin123`
   - 预期：登录成功，跳转到首页

2. **酒店列表测试**
   - 进入首页
   - 选择城市、日期
   - 点击搜索
   - 预期：显示酒店列表

3. **酒店详情测试**
   - 点击任意酒店
   - 预期：显示酒店详细信息

4. **购物车测试**
   - 添加房间到购物车
   - 预期：提示添加成功

## 高级配置

### 使用 ngrok 实现外网访问

如果需要在不同网络环境下测试，可以使用 ngrok：

```bash
# 安装 ngrok
npm install -g ngrok

# 启动 ngrok（映射本地 5000 端口）
ngrok http 5000
```

然后使用 ngrok 提供的 HTTPS 地址配置小程序。

### 使用花生壳内网穿透

花生壳提供免费的内网穿透服务：
1. 注册花生壳账号
2. 下载并安装客户端
3. 映射本地 5000 端口
4. 使用生成的域名配置小程序

## 项目配置说明

### project.config.json
```json
{
  "setting": {
    "urlCheck": false,  // 已关闭域名校验，开发时必须
    "es6": false,
    "enhance": false,
    "compileHotReLoad": false
  }
}
```

### API 配置逻辑
- 默认地址：`http://localhost:5000/api`（模拟器）
- 真机地址：从本地存储读取（需用户配置）
- 动态切换：每次请求都会读取最新配置

## 相关文档

- [Taro 官方文档](https://taro-docs.jd.com/)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [项目 README](../README.md)
- [MongoDB 快速开始](../MONGODB_QUICK_START.md)

## 技术支持

如果遇到问题：
1. 查看本文档的常见问题部分
2. 检查控制台日志
3. 使用【测试连接】功能验证网络
4. 检查后端服务器日志

---

**提示**：真机调试时网络配置是最常见的问题，按照本指南逐步检查即可解决。
