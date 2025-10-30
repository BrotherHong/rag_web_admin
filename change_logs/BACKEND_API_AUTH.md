# 🔐 認證 API 文件

## 1. 使用者登入

### 基本資訊
- **端點**: `POST /api/auth/login`
- **權限**: 無需認證
- **說明**: 驗證使用者帳號密碼並返回 Token

### 請求參數

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | ✅ | 使用者帳號 |
| password | string | ✅ | 使用者密碼 |

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系統管理員",
      "email": "admin@ncku.edu.tw",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "expiresAt": "2025-10-19T23:59:59Z"
  },
  "message": "登入成功"
}
```

**失敗回應 (401)**:
```json
{
  "success": false,
  "message": "帳號或密碼錯誤"
}
```

### 實作細節

1. **密碼驗證**: 使用 bcrypt 比對加密後的密碼
2. **Token 生成**: 
   - 使用 JWT 生成 Token
   - 包含 userId, username, role
   - 設定過期時間（建議 24 小時）
3. **安全措施**:
   - 限制登入嘗試次數（5 次/10 分鐘）
   - 記錄登入失敗次數
   - 記錄登入 IP 和時間

### 測試帳號

| 帳號 | 密碼 | 角色 | 說明 |
|------|------|------|------|
| admin | admin123 | admin | 系統管理員 |
| hr_manager | manager123 | manager | 檔案管理員 |
| viewer | viewer123 | viewer | 一般檢視者 |

---

## 2. 使用者登出

### 基本資訊
- **端點**: `POST /api/auth/logout`
- **權限**: 需要認證
- **說明**: 登出使用者並使 Token 失效

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: 無

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 實作細節

1. **Token 失效**:
   - 將 Token 加入黑名單（Redis）
   - 或在資料庫標記為已登出
2. **清理 Session**: 清除伺服器端的 Session 資料
3. **記錄活動**: 記錄登出時間和 IP

---

## 3. 驗證 Token

### 基本資訊
- **端點**: `GET /api/auth/verify`
- **權限**: 需要認證
- **說明**: 驗證 Token 是否有效並返回使用者資訊

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**: 無

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系統管理員",
      "email": "admin@ncku.edu.tw",
      "role": "admin"
    },
    "isValid": true
  }
}
```

**失敗回應 (401)**:
```json
{
  "success": false,
  "message": "Token 已過期或無效"
}
```

### 實作細節

1. **Token 驗證**:
   ```javascript
   // 解碼 JWT Token
   const decoded = jwt.verify(token, SECRET_KEY);
   
   // 檢查是否在黑名單中
   const isBlacklisted = await redis.get(`blacklist:${token}`);
   if (isBlacklisted) {
     return { success: false, message: 'Token 已失效' };
   }
   
   // 檢查過期時間
   if (decoded.exp < Date.now() / 1000) {
     return { success: false, message: 'Token 已過期' };
   }
   
   // 查詢使用者是否仍存在且啟用
   const user = await db.users.findOne({ 
     id: decoded.userId, 
     isActive: true 
   });
   
   if (!user) {
     return { success: false, message: '使用者不存在或已停用' };
   }
   
   return { success: true, data: { user } };
   ```

2. **自動更新 Token**:
   - 若 Token 接近過期（如剩餘 1 小時），自動更新並返回新 Token
   - 在回應 Header 中加入新 Token: `X-New-Token`

3. **使用場景**:
   - 前端頁面載入時驗證登入狀態
   - 長時間閒置後恢復使用
   - 跨分頁同步登入狀態

---

## 錯誤碼對照表

| 錯誤碼 | HTTP 狀態 | 訊息 | 說明 |
|-------|----------|------|------|
| AUTH_001 | 401 | 帳號或密碼錯誤 | 登入失敗 |
| AUTH_002 | 401 | Token 已過期或無效 | Token 驗證失敗 |
| AUTH_003 | 401 | 未提供 Token | 缺少認證資訊 |
| AUTH_004 | 403 | 帳號已被停用 | 使用者被管理員停用 |
| AUTH_005 | 429 | 登入嘗試次數過多 | 觸發頻率限制 |

---

## 安全建議

### 1. Token 管理
```javascript
// JWT Payload 建議結構
{
  "userId": 1,
  "username": "admin",
  "role": "admin",
  "iat": 1698480000,  // 發行時間
  "exp": 1698566400,  // 過期時間
  "jti": "unique-token-id"  // Token ID (用於撤銷)
}
```

### 2. 密碼規範
- 最少 8 字元
- 必須包含英文和數字
- 建議包含特殊字元
- 儲存時使用 bcrypt (cost factor: 10-12)

### 3. Rate Limiting
```javascript
// 建議限制
登入 API: 5 次/10 分鐘/IP
驗證 API: 100 次/分鐘/使用者
所有 API: 1000 次/小時/IP
```

### 4. HTTPS Only
- 所有認證相關 API 必須使用 HTTPS
- 設定 Secure 和 HttpOnly Cookie (若使用 Cookie)

### 5. 記錄與監控
```javascript
// 需要記錄的事件
- 登入成功/失敗
- Token 驗證失敗
- 異常 IP 登入
- 多次登入失敗
- 權限不足的操作嘗試
```

---

## 前端整合範例

### JavaScript/React 範例

```javascript
// 1. 登入
const login = async (username, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // 儲存使用者資訊和 Token
      localStorage.setItem('user', JSON.stringify(result.data));
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('登入失敗:', error);
    throw error;
  }
};

// 2. 驗證 Token
const verifyToken = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.token) return false;
    
    const response = await fetch('/api/auth/verify', {
      headers: { 
        'Authorization': `Bearer ${user.token}` 
      }
    });
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    return false;
  }
};

// 3. 登出
const logout = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${user.token}` 
      }
    });
    
    localStorage.removeItem('user');
  } catch (error) {
    console.error('登出失敗:', error);
  }
};
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
