# 折扣权限管理实现

## 功能需求
- **管理员**：不能设置折扣，但可以查看商家折扣信息
- **商户**：只有商户账号能设置和修改折扣

## 实现方案

### 1. 后端修改

#### 文件：`server/src/routes/hotels.js`
- **修改内容**：将折扣更新路由权限从 `authorize('merchant', 'admin')` 改为 `authorize('merchant')`
- **说明**：只有商户token可以访问该路由，管理员的请求会在网关层被拒绝

```javascript
// 更新酒店折扣（仅商户可设置）
router.put('/:id/discounts', authorize('merchant'), hotelController.updateHotelDiscounts);
```

#### 文件：`server/src/controllers/hotelController.js`
- **修改内容**：增强 `updateHotelDiscounts` 函数的权限检查
- **说明**：防止管理员通过其他方式绕过权限限制，只允许该酒店的商户修改折扣

```javascript
// 只允许该酒店的商户修改折扣，管理员无权修改
if (hotel.merchantId.toString() !== req.user.id) {
  return res.status(403).json({
    success: false,
    message: "只有酒店的商户可以修改折扣信息",
  });
}
```

### 2. 前端修改

#### 文件：`admin/src/pages/HotelManagement.js`

##### 修改1：操作列按钮权限
- **商户**：显示"设置折扣"按钮，可编辑折扣
- **管理员**：显示"查看折扣"按钮，只读查看折扣信息

```javascript
{user.role === 'merchant' && (
  <Button type="link" onClick={() => {
    // 设置折扣逻辑
  }}>设置折扣</Button>
)}

{user.role === 'admin' && (
  <Button type="link" onClick={() => {
    // 查看折扣逻辑
  }}>查看折扣</Button>
)}
```

##### 修改2：折扣模态框
- **标题**：
  - 商户时：「设置折扣」
  - 管理员时：「查看折扣」
  
- **编辑状态**：
  - 商户：所有字段可编辑，显示"添加折扣"和"删除折扣"按钮
  - 管理员：所有字段禁用（readonly），隐藏添加/删除按钮
  
- **按钮状态**：
  - 商户：显示"确定"和"取消"按钮
  - 管理员：只显示"关闭"按钮

## 变更清单

| 文件 | 变更 | 备注 |
|------|------|------|
| `server/src/routes/hotels.js` | 修改折扣路由权限 | 第23行，仅限merchant角色 |
| `server/src/controllers/hotelController.js` | 增强权限验证 | 第410-415行，只允许商户修改 |
| `admin/src/pages/HotelManagement.js` | 修改操作按钮和模态框 | 第324-368行、第616-685行 |

## 测试场景

### 场景1：商户账号（merchant1）
- ✅ 可以看到自己酒店的"设置折扣"按钮
- ✅ 可以打开折扣编辑模式，添加/修改/删除折扣
- ✅ 成功保存折扣信息

### 场景2：管理员账号（admin）
- ✅ 可以看到所有酒店的"查看折扣"按钮
- ✅ 可以打开折扣查看模式，但所有字段禁用
- ✅ 无法添加、修改、删除折扣
- ✅ 如果直接调用API修改折扣，返回403错误

### 场景3：权限校验
```bash
# 商户可以修改折扣
PUT /api/hotels/:id/discounts
Authorization: Bearer [merchant-token]
# ✅ 返回200成功

# 管理员无法修改折扣
PUT /api/hotels/:id/discounts
Authorization: Bearer [admin-token]
# ❌ 返回403, message: "只有酒店的商户可以修改折扣信息"
```

## 默认账号

### 商户账号
- 用户名: merchant1
- 密码: merchant123

### 管理员账号
- 用户名: admin
- 密码: admin123

## API变更

### 权限变化
- `PUT /api/hotels/:id/discounts` 
  - 之前：可被 merchant 和 admin 调用
  - 现在：仅 merchant 可调用（需要是该酒店的商户）

## 相关文件位置

- 后端路由：[server/src/routes/hotels.js](server/src/routes/hotels.js#L23)
- 后端控制器：[server/src/controllers/hotelController.js](server/src/controllers/hotelController.js#L410-L415)
- 前端页面：[admin/src/pages/HotelManagement.js](admin/src/pages/HotelManagement.js#L324-L368)
- 折扣模态框：[admin/src/pages/HotelManagement.js](admin/src/pages/HotelManagement.js#L616-L685)
