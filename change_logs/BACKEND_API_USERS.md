# 👥 使用者管理 API 文件

## 1. 取得使用者列表

### 基本資訊
- **端點**: `GET /api/users`
- **權限**: admin (3)
- **說明**: 取得所有使用者清單

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
GET /api/users?role=manager&status=active
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| role | string | ❌ | 角色篩選 (admin, manager, viewer) |
| status | string | ❌ | 狀態篩選 (active, inactive) |

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "name": "系統管理員",
        "email": "admin@ncku.edu.tw",
        "role": "admin",
        "roleName": "系統管理員",
        "isActive": true,
        "lastLogin": "2025-10-18T14:30:00Z",
        "createdAt": "2025-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "username": "hr_manager",
        "name": "人事主管",
        "email": "hr@ncku.edu.tw",
        "role": "manager",
        "roleName": "檔案管理員",
        "isActive": true,
        "lastLogin": "2025-10-17T16:20:00Z",
        "createdAt": "2025-02-15T00:00:00Z"
      },
      {
        "id": 3,
        "username": "viewer",
        "name": "一般檢視者",
        "email": "viewer@ncku.edu.tw",
        "role": "viewer",
        "roleName": "檢視者",
        "isActive": true,
        "lastLogin": "2025-10-18T10:15:00Z",
        "createdAt": "2025-03-01T00:00:00Z"
      }
    ],
    "total": 3,
    "summary": {
      "admin": 1,
      "manager": 1,
      "viewer": 1,
      "active": 3,
      "inactive": 0
    }
  }
}
```

**失敗回應 (403)**:
```json
{
  "success": false,
  "message": "權限不足，此操作需要更高權限"
}
```

### 實作細節

```javascript
async function getUsers(req, res) {
  try {
    // 1. 權限檢查：只有 admin 可以查看使用者列表
    const user = await verifyToken(req.headers.authorization);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 建立查詢條件
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (req.query.role) {
      query += ' AND role = ?';
      params.push(req.query.role);
    }
    
    if (req.query.status) {
      const isActive = req.query.status === 'active';
      query += ' AND is_active = ?';
      params.push(isActive);
    }
    
    query += ' ORDER BY id ASC';
    
    // 3. 查詢使用者
    const users = await db.query(query, params);
    
    // 4. 角色名稱對應
    const roleNames = {
      'admin': '系統管理員',
      'manager': '檔案管理員',
      'viewer': '檢視者'
    };
    
    // 5. 格式化回應（不包含密碼）
    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      roleName: roleNames[u.role],
      isActive: u.is_active,
      lastLogin: u.last_login,
      createdAt: u.created_at
    }));
    
    // 6. 統計資訊
    const summary = {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      viewer: users.filter(u => u.role === 'viewer').length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length
    };
    
    return res.json({
      success: true,
      data: {
        users: formattedUsers,
        total: formattedUsers.length,
        summary: summary
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得使用者列表失敗' 
    });
  }
}
```

---

## 2. 新增使用者

### 基本資訊
- **端點**: `POST /api/users`
- **權限**: admin (3)
- **說明**: 建立新使用者帳號

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "new_user",
  "password": "secure123",
  "name": "新使用者",
  "email": "newuser@ncku.edu.tw",
  "role": "viewer"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | ✅ | 使用者帳號（唯一） |
| password | string | ✅ | 密碼（最少 8 字元） |
| name | string | ✅ | 使用者姓名 |
| email | string | ✅ | Email 地址（唯一） |
| role | string | ✅ | 角色 (admin, manager, viewer) |

### 密碼規範

```javascript
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: false,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false
};
```

### 回應範例

**成功回應 (201)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "username": "new_user",
      "name": "新使用者",
      "email": "newuser@ncku.edu.tw",
      "role": "viewer",
      "roleName": "檢視者",
      "isActive": true,
      "createdAt": "2025-10-18T14:30:00Z"
    }
  },
  "message": "使用者已建立"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "使用者名稱已存在"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "密碼必須至少 8 個字元"
}
```

### 實作細節

```javascript
const bcrypt = require('bcrypt');

async function addUser(req, res) {
  try {
    // 1. 權限檢查
    const currentUser = await verifyToken(req.headers.authorization);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 驗證參數
    const { username, password, name, email, role } = req.body;
    
    // 2.1 必填欄位檢查
    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: '所有欄位都是必填的' 
      });
    }
    
    // 2.2 使用者名稱檢查
    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: '使用者名稱必須至少 3 個字元' 
      });
    }
    
    // 2.3 密碼檢查
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: '密碼必須至少 8 個字元' 
      });
    }
    
    // 2.4 Email 格式檢查
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email 格式不正確' 
      });
    }
    
    // 2.5 角色驗證
    const allowedRoles = ['admin', 'manager', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: '無效的角色' 
      });
    }
    
    // 3. 檢查使用者名稱是否已存在
    const existingUsername = await db.users.findOne({ username: username });
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: '使用者名稱已存在' 
      });
    }
    
    // 4. 檢查 Email 是否已存在
    const existingEmail = await db.users.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email 已被使用' 
      });
    }
    
    // 5. 加密密碼
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 6. 建立使用者
    const newUser = await db.users.create({
      username: username,
      password: hashedPassword,
      name: name,
      email: email,
      role: role,
      is_active: true,
      created_at: new Date()
    });
    
    // 7. 記錄活動
    await db.activities.create({
      type: 'user_add',
      user_id: currentUser.id,
      details: `新增使用者: ${username} (${role})`,
      timestamp: new Date()
    });
    
    // 8. 返回結果（不包含密碼）
    const roleNames = {
      'admin': '系統管理員',
      'manager': '檔案管理員',
      'viewer': '檢視者'
    };
    
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          roleName: roleNames[newUser.role],
          isActive: newUser.is_active,
          createdAt: newUser.created_at
        }
      },
      message: '使用者已建立'
    });
    
  } catch (error) {
    console.error('Add user error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '建立使用者失敗' 
    });
  }
}
```

---

## 3. 更新使用者

### 基本資訊
- **端點**: `PUT /api/users/:id`
- **權限**: admin (3)
- **說明**: 更新使用者資訊

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters**:
```
PUT /api/users/4
```

**Request Body**:
```json
{
  "name": "更新後的姓名",
  "email": "newemail@ncku.edu.tw",
  "role": "manager",
  "isActive": true,
  "password": "newpassword123"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| name | string | ❌ | 使用者姓名 |
| email | string | ❌ | Email 地址 |
| role | string | ❌ | 角色 |
| isActive | boolean | ❌ | 啟用狀態 |
| password | string | ❌ | 新密碼（若要修改） |

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "username": "new_user",
      "name": "更新後的姓名",
      "email": "newemail@ncku.edu.tw",
      "role": "manager",
      "roleName": "檔案管理員",
      "isActive": true,
      "createdAt": "2025-10-18T14:30:00Z",
      "updatedAt": "2025-10-18T15:00:00Z"
    }
  },
  "message": "使用者資訊已更新"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "Email 已被其他使用者使用"
}
```

**失敗回應 (404)**:
```json
{
  "success": false,
  "message": "找不到指定的使用者"
}
```

### 實作細節

```javascript
async function updateUser(req, res) {
  try {
    // 1. 權限檢查
    const currentUser = await verifyToken(req.headers.authorization);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 查詢使用者
    const user = await db.users.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的使用者' 
      });
    }
    
    // 3. 準備更新資料
    const updates = {};
    const { name, email, role, isActive, password } = req.body;
    
    // 3.1 姓名更新
    if (name !== undefined) {
      updates.name = name;
    }
    
    // 3.2 Email 更新（檢查重複）
    if (email !== undefined && email !== user.email) {
      const existingEmail = await db.users.findOne({ 
        email: email,
        id: { $ne: req.params.id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email 已被其他使用者使用' 
        });
      }
      
      updates.email = email;
    }
    
    // 3.3 角色更新
    if (role !== undefined) {
      const allowedRoles = ['admin', 'manager', 'viewer'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: '無效的角色' 
        });
      }
      updates.role = role;
    }
    
    // 3.4 啟用狀態更新
    if (isActive !== undefined) {
      updates.is_active = isActive;
    }
    
    // 3.5 密碼更新
    if (password !== undefined) {
      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: '密碼必須至少 8 個字元' 
        });
      }
      
      const saltRounds = 10;
      updates.password = await bcrypt.hash(password, saltRounds);
    }
    
    // 4. 更新時間戳
    updates.updated_at = new Date();
    
    // 5. 執行更新
    await db.users.update({ id: req.params.id }, updates);
    
    // 6. 記錄活動
    await db.activities.create({
      type: 'user_update',
      user_id: currentUser.id,
      details: `更新使用者: ${user.username}`,
      timestamp: new Date()
    });
    
    // 7. 查詢更新後的使用者
    const updatedUser = await db.users.findOne({ id: req.params.id });
    
    // 8. 返回結果
    const roleNames = {
      'admin': '系統管理員',
      'manager': '檔案管理員',
      'viewer': '檢視者'
    };
    
    return res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          roleName: roleNames[updatedUser.role],
          isActive: updatedUser.is_active,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      },
      message: '使用者資訊已更新'
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '更新使用者失敗' 
    });
  }
}
```

---

## 4. 刪除使用者

### 基本資訊
- **端點**: `DELETE /api/users/:id`
- **權限**: admin (3)
- **說明**: 刪除使用者帳號

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
DELETE /api/users/4
```

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "使用者已刪除"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "無法刪除自己的帳號"
}
```

**失敗回應 (404)**:
```json
{
  "success": false,
  "message": "找不到指定的使用者"
}
```

### 實作細節

```javascript
async function deleteUser(req, res) {
  try {
    // 1. 權限檢查
    const currentUser = await verifyToken(req.headers.authorization);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 查詢使用者
    const user = await db.users.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的使用者' 
      });
    }
    
    // 3. 防止刪除自己
    if (user.id === currentUser.id) {
      return res.status(400).json({ 
        success: false, 
        message: '無法刪除自己的帳號' 
      });
    }
    
    // 4. 防止刪除最後一個 admin
    if (user.role === 'admin') {
      const adminCount = await db.users.count({ 
        role: 'admin',
        is_active: true 
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          success: false, 
          message: '無法刪除最後一個系統管理員' 
        });
      }
    }
    
    // 5. 使用 Transaction（軟刪除或硬刪除）
    await db.transaction(async (trx) => {
      // 選項 A: 軟刪除（推薦）- 保留歷史記錄
      await trx.users.update(
        { id: req.params.id },
        { is_active: false, deleted_at: new Date() }
      );
      
      // 選項 B: 硬刪除 - 完全移除
      // await trx.users.delete({ id: req.params.id });
      
      // 註記該使用者的活動記錄
      await trx.activities.update(
        { user_id: req.params.id },
        { user_deleted: true }
      );
    });
    
    // 6. 記錄活動
    await db.activities.create({
      type: 'user_delete',
      user_id: currentUser.id,
      details: `刪除使用者: ${user.username}`,
      timestamp: new Date()
    });
    
    return res.json({
      success: true,
      message: '使用者已刪除'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '刪除使用者失敗' 
    });
  }
}
```

---

## 安全建議

### 1. 密碼加密

```javascript
// 使用 bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// 加密
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// 驗證
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### 2. 密碼規則強化

```javascript
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: '密碼必須至少 8 個字元' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密碼必須包含小寫字母' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密碼必須包含數字' };
  }
  
  // 檢查常見弱密碼
  const weakPasswords = ['12345678', 'password', 'admin123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: '密碼過於簡單' };
  }
  
  return { valid: true };
}
```

### 3. 防止列舉攻擊

```javascript
// ❌ 不好的做法 - 洩漏資訊
if (usernameExists) {
  return { message: '使用者名稱已存在' };
}
if (emailExists) {
  return { message: 'Email 已存在' };
}

// ✅ 好的做法 - 統一錯誤訊息
if (usernameExists || emailExists) {
  return { message: '使用者名稱或 Email 已存在' };
}
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
