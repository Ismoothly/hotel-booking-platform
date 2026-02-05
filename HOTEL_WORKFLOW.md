# 酒店审核发布工作流程

## 流程概览

```
商户创建酒店 → 管理员审核 → 管理员发布 → 客户端可见
   (draft)     (approved)    (published)
```

## 详细流程

### 1️⃣ 商户创建酒店

**操作：** 商户登录管理端，填写酒店信息并提交

**接口：** `POST /api/hotels`

**初始状态：**
- `status`: `draft` （草稿状态）
- `reviewStatus`: `pending` （待审核）

**结果：** 酒店保存成功，提示"酒店创建成功，等待管理员审核"

---

### 2️⃣ 管理员审核

**操作：** 管理员登录后查看待审核酒店列表

**接口：** `GET /api/admin/hotels/pending`

**审核操作：**

#### ✅ 审核通过
- **接口：** `PUT /api/admin/hotels/:id/approve`
- **结果：** `reviewStatus` 变更为 `approved`
- **说明：** 酒店通过审核，但尚未发布，客户端仍不可见

#### ❌ 审核拒绝
- **接口：** `PUT /api/admin/hotels/:id/reject`
- **参数：** `{ "reason": "拒绝原因" }`
- **结果：** `reviewStatus` 变更为 `rejected`
- **说明：** 商户可以修改后重新提交审核

---

### 3️⃣ 管理员发布

**前提条件：** 酒店必须 `reviewStatus === 'approved'`

**操作：** 管理员在审核通过后点击"发布"

**接口：** `PUT /api/admin/hotels/:id/publish`

**结果：**
- `status` 变更为 `published`
- 酒店在客户端列表中可见

---

### 4️⃣ 客户端展示

**接口：** `GET /api/hotels`

**过滤条件：** 只返回 `status === 'published'` 的酒店

**可见性：** 用户在移动端和小程序端可以看到已发布的酒店

---

## 管理操作

### 🔽 下线酒店

**接口：** `PUT /api/admin/hotels/:id/unpublish`

**结果：**
- `status` 变更为 `unpublished`
- 客户端不再显示该酒店

### 🔄 重新上线

**接口：** `PUT /api/admin/hotels/:id/restore`

**前提：** 酒店必须已审核通过（`reviewStatus === 'approved'`）

**结果：**
- `status` 变更为 `published`
- 客户端重新显示该酒店

---

## 状态字段说明

### status（发布状态）
| 状态 | 说明 | 客户端可见 |
|------|------|-----------|
| draft | 草稿 | ❌ |
| published | 已发布 | ✅ |
| unpublished | 已下线 | ❌ |

### reviewStatus（审核状态）
| 状态 | 说明 | 可发布 |
|------|------|--------|
| pending | 待审核 | ❌ |
| approved | 审核通过 | ✅ |
| rejected | 审核拒绝 | ❌ |

---

## 常见场景

### ❓ 商户创建酒店后客户端看不到？

**原因：** 新建酒店默认为 `draft` 状态且 `reviewStatus` 为 `pending`

**解决：** 
1. 管理员登录后台
2. 在"待审核酒店"中找到该酒店
3. 审核通过
4. 点击"发布"按钮
5. 客户端即可看到

### ❓ 审核通过后客户端还是看不到？

**原因：** 审核通过（`approved`）后仍需要手动发布

**解决：** 管理员在审核通过后需要额外点击"发布"按钮

### ❓ 如何修改已发布的酒店？

**流程：**
1. 商户修改酒店信息（`PUT /api/hotels/:id`）
2. 修改后保持原有的 `status` 和 `reviewStatus`
3. 如果需要重新审核，管理员可以先下线，审核后再发布

---

## API 快速参考

| 操作 | 接口 | 角色 | 说明 |
|------|------|------|------|
| 创建酒店 | `POST /api/hotels` | 商户 | 初始状态：draft + pending |
| 待审核列表 | `GET /api/admin/hotels/pending` | 管理员 | 查看所有待审核酒店 |
| 审核通过 | `PUT /api/admin/hotels/:id/approve` | 管理员 | reviewStatus → approved |
| 审核拒绝 | `PUT /api/admin/hotels/:id/reject` | 管理员 | reviewStatus → rejected |
| 发布酒店 | `PUT /api/admin/hotels/:id/publish` | 管理员 | status → published |
| 下线酒店 | `PUT /api/admin/hotels/:id/unpublish` | 管理员 | status → unpublished |
| 客户端列表 | `GET /api/hotels` | 用户 | 仅返回 published 状态 |

---

## 测试建议

1. **创建测试酒店：** 使用商户账号创建酒店，确认初始状态为 draft/pending
2. **查看待审核：** 使用管理员账号查看待审核列表
3. **审核通过：** 点击审核通过，确认状态变更
4. **发布酒店：** 点击发布按钮
5. **客户端验证：** 访问客户端，确认酒店可见
