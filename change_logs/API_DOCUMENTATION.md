# API 架構說明文件

## 概述

本專案採用前後端分離架構，前端透過 `src/services/api.js` 模組與後端 API 進行通訊。目前使用模擬資料實現所有功能，方便在沒有實際後端的情況下進行開發和測試。

## API 服務層架構

### 檔案位置
- `src/services/api.js` - 所有 API 呼叫的統一入口

### 設計特點

1. **模擬與真實 API 無縫切換**
   - 當前使用模擬資料和延遲來模擬真實 API 行為
   - 註解中包含真實 API 呼叫的程式碼範例
   - 只需取消註解並移除模擬邏輯即可切換到真實後端

2. **統一的響應格式**
   ```javascript
   {
     success: boolean,    // 操作是否成功
     data: any,          // 返回的資料
     message: string     // 錯誤或成功訊息
   }
   ```

3. **模擬延遲**
   - 所有 API 呼叫都包含延遲（300ms-1500ms）
   - 模擬真實網路請求的體驗
   - 測試載入狀態和使用者體驗

## API 端點列表

### 認證相關 API

#### 1. 登入 (`login`)
```javascript
import { login } from '../services/api';

const response = await login(username, password);
```

**請求參數：**
- `username` (string) - 使用者帳號
- `password` (string) - 使用者密碼

**響應範例：**
```javascript
{
  success: true,
  data: {
    user: {
      id: 1,
      username: "admin",
      name: "系統管理員",
      role: "admin"
    },
    token: "mock_token_1_1729123456789"
  },
  message: "登入成功"
}
```

**測試帳號：**
- admin / admin123
- hr_manager / hr123

#### 2. 登出 (`logout`)
```javascript
const response = await logout();
```

#### 3. 驗證 Token (`verifyToken`)
```javascript
const response = await verifyToken();
```

---

### 知識庫檔案管理 API

#### 1. 取得檔案列表 (`getFiles`)
```javascript
import { getFiles } from '../services/api';

const response = await getFiles({
  search: '人事',        // 可選：搜尋關鍵字
  category: '規章制度',  // 可選：分類篩選
  page: 1,              // 可選：頁碼
  limit: 10             // 可選：每頁數量
});
```

**響應範例：**
```javascript
{
  success: true,
  data: {
    files: [
      {
        id: 1,
        name: "人事規章.pdf",
        size: "2.4 MB",
        uploadDate: "2025-10-15",
        category: "規章制度",
        uploader: "admin"
      }
    ],
    total: 8,
    page: 1,
    limit: 10
  }
}
```

#### 2. 上傳檔案 (`uploadFile`)
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('category', '規章制度');

const response = await uploadFile(formData);
```

**響應範例：**
```javascript
{
  success: true,
  data: {
    id: 9,
    name: "新檔案.pdf",
    size: "1.5 MB",
    uploadDate: "2025-10-17",
    category: "規章制度",
    uploader: "admin"
  },
  message: "檔案上傳成功"
}
```

#### 3. 刪除檔案 (`deleteFile`)
```javascript
const response = await deleteFile(fileId);
```

**響應範例：**
```javascript
{
  success: true,
  message: "檔案刪除成功"
}
```

#### 4. 下載檔案 (`downloadFile`)
```javascript
const response = await downloadFile(fileId);
```

**響應範例：**
```javascript
{
  success: true,
  data: {
    url: "http://localhost:3000/api/files/download/1",
    fileName: "人事規章.pdf"
  }
}
```

---

### 統計與活動記錄 API

#### 1. 取得系統統計 (`getStatistics`)
```javascript
import { getStatistics } from '../services/api';

const response = await getStatistics();
```

**響應範例：**
```javascript
{
  success: true,
  data: {
    totalFiles: 8,
    filesByCategory: {
      "規章制度": 3,
      "請假相關": 2,
      "薪資福利": 3
    },
    monthlyQueries: 1234,
    systemStatus: "running",
    storageUsed: "45.6 GB",
    storageTotal: "100 GB"
  }
}
```

#### 2. 取得最近活動 (`getRecentActivities`)
```javascript
const response = await getRecentActivities(limit);
```

**響應範例：**
```javascript
{
  success: true,
  data: [
    {
      id: 1,
      type: "upload",
      fileName: "人事規章.pdf",
      user: "admin",
      timestamp: "2025-10-15T10:30:00"
    }
  ]
}
```

---

### 分類管理 API

#### 1. 取得所有分類 (`getCategories`)
```javascript
const response = await getCategories();
```

**響應範例：**
```javascript
{
  success: true,
  data: ["規章制度", "請假相關", "薪資福利", "未分類"]
}
```

---

## 如何切換到真實後端

### 步驟 1: 設定環境變數

創建 `.env` 檔案（從 `.env.example` 複製）：
```bash
cp .env.example .env
```

編輯 `.env` 檔案：
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### 步驟 2: 修改 API 函數

以 `login` 函數為例：

**目前（模擬）：**
```javascript
export const login = async (username, password) => {
  await delay(800);
  
  // 模擬後端驗證邏輯
  const user = mockDatabase.users.find(
    u => u.username === username && u.password === password
  );
  
  if (user) {
    return { success: true, data: { user, token } };
  }
  return { success: false, message: '帳號或密碼錯誤' };
};
```

**切換到真實（取消註解）：**
```javascript
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: '登入失敗，請稍後再試'
    };
  }
};
```

### 步驟 3: 移除模擬資料

刪除或註解掉以下內容：
- `mockDatabase` 物件
- `delay` 函數呼叫
- 模擬的業務邏輯

---

## 錯誤處理

所有 API 函數都包含 try-catch 錯誤處理：

```javascript
try {
  const response = await someApiCall();
  if (response.success) {
    // 處理成功情況
  } else {
    // 處理失敗情況
    console.error(response.message);
  }
} catch (error) {
  console.error('API 錯誤:', error);
}
```

---

## Token 管理

### 儲存 Token
登入成功後，Token 會儲存在 localStorage：
```javascript
localStorage.setItem('token', response.data.token);
```

### 使用 Token
在需要認證的 API 請求中加入 Authorization header：
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### 清除 Token
登出時清除所有認證資訊：
```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('isAuthenticated');
```

---

## 開發建議

1. **保持模擬資料同步**
   - 確保模擬資料結構與真實後端 API 一致
   - 有助於前端開發不受後端進度影響

2. **使用 TypeScript**
   - 考慮使用 TypeScript 定義 API 響應類型
   - 提高程式碼可維護性和類型安全

3. **API 文檔**
   - 與後端團隊保持 API 文檔同步
   - 使用 Swagger/OpenAPI 等工具

4. **測試**
   - 為 API 服務層撰寫單元測試
   - 模擬不同的網路狀況（成功、失敗、超時）

5. **錯誤監控**
   - 考慮整合 Sentry 等錯誤追蹤服務
   - 記錄 API 呼叫失敗的詳細資訊

---

## 現有模擬資料

### 使用者帳號
- admin / admin123 (管理員)
- hr_manager / hr123 (人事主管)

### 檔案類別
- 規章制度
- 請假相關
- 薪資福利
- 未分類

### 預設檔案
系統預設包含 8 個範例檔案，涵蓋各種類別。

---

## 聯絡資訊

如有任何 API 相關問題，請聯絡後端開發團隊或查看 API 文檔。
