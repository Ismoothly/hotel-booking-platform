# 真机调试说明

## 问题描述
模拟器正常，但真机调试时：
- ❌ 登录失败
- ❌ 酒店列表加载失败
- ❌ 网络请求超时

## 快速解决

### 方法 1：使用配置助手（推荐）
```bash
# 在项目根目录运行
.\start-miniprogram-debug.ps1
```

### 方法 2：手动配置

1. **获取电脑 IP**
   ```bash
   # Windows
   ipconfig
   
   # Mac
   ifconfig
   ```
   找到类似 `192.168.1.100` 的地址

2. **启动后端**
   ```bash
   cd server
   npm run dev
   ```

3. **在小程序中配置**
   - 打开小程序
   - 进入【我的】→【⚙️ API 配置】
   - 输入：`http://你的IP:5000/api`
   - 测试连接 → 保存配置
   - 重启小程序

4. **确保同一网络**
   - 手机和电脑必须连接同一 WiFi

## 配置验证

运行测试脚本验证配置：
```bash
.\test-miniprogram-api.ps1
```

## 详细文档

请查看：[MINIPROGRAM_DEBUG_GUIDE.md](../MINIPROGRAM_DEBUG_GUIDE.md)

## 技术说明

- 模拟器可以使用 `localhost`
- 真机必须使用局域网 IP（如 `192.168.1.100`）
- 域名校验已关闭（`urlCheck: false`）
- 后端监听 `0.0.0.0`（允许外部访问）
- CORS 已配置（开发环境允许所有来源）

## 常见错误

### "request:fail timeout"
- 原因：无法连接到服务器
- 解决：检查 IP 地址、网络连接、防火墙

### "登录失败"
- 原因：API 地址未配置或错误
- 解决：在【API 配置】页面设置正确地址

### "酒店列表为空"
- 原因：后端数据库未初始化
- 解决：运行 `node scripts/seed.js` 初始化数据

## 需要帮助？

1. 查看控制台日志
2. 使用【测试连接】功能诊断
3. 查看完整文档：MINIPROGRAM_DEBUG_GUIDE.md
