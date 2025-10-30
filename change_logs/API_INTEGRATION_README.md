# 人事室 AI 客服後台管理系統 - API 架構更新

## 🎉 更新內容

本次更新將整個系統重構為使用 API 呼叫方式，模擬前後端分離架構。

### ✨ 新增檔案

1. **`src/services/api.js`** - API 服務層
   - 統一管理所有 API 呼叫
   - 模擬後端響應和延遲
   - 包含真實 API 呼叫的程式碼範例（已註解）

2. **`API_DOCUMENTATION.md`** - API 文檔
   - 詳細的 API 使用說明
   - 請求/響應格式範例
   - 如何切換到真實後端的步驟

3. **`.env.example`** - 環境變數範例
   - API 基礎 URL 配置

### 🔄 更新的組件

1. **`Login.jsx`**
   - 使用 `login()` API 進行身份驗證
   - 儲存 token 和使用者資訊到 localStorage
   - 改善錯誤處理

2. **`KnowledgeBase.jsx`**
   - 使用 `getFiles()` 載入檔案列表
   - 使用 `uploadFile()` 上傳檔案
   - 使用 `deleteFile()` 刪除檔案
   - 使用 `downloadFile()` 下載檔案
   - 使用 `getCategories()` 載入分類
   - 添加載入狀態和錯誤處理
   - 支援檔案上傳時選擇分類

3. **`Dashboard.jsx`**
   - 使用 `logout()` API 進行登出
   - 使用 `getStatistics()` 獲取系統統計
   - 使用 `getRecentActivities()` 獲取活動記錄
   - 顯示真實的使用者資訊
   - 添加載入狀態

## 📦 API 功能列表

### 認證 API
- ✅ `login(username, password)` - 使用者登入
- ✅ `logout()` - 使用者登出
- ✅ `verifyToken()` - 驗證 token

### 檔案管理 API
- ✅ `getFiles(params)` - 取得檔案列表（支援搜尋和分類篩選）
- ✅ `uploadFile(formData)` - 上傳檔案
- ✅ `deleteFile(fileId)` - 刪除檔案
- ✅ `downloadFile(fileId)` - 下載檔案

### 統計與活動 API
- ✅ `getStatistics()` - 取得系統統計資料
- ✅ `getRecentActivities(limit)` - 取得最近活動記錄

### 分類管理 API
- ✅ `getCategories()` - 取得所有分類

## 🚀 如何使用

### 開發環境（使用模擬 API）

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

訪問 http://localhost:5173/

### 測試帳號

- **帳號**: `admin` / **密碼**: `admin123` （管理員）
- **帳號**: `hr_manager` / **密碼**: `hr123` （人事主管）

## 🔌 切換到真實後端

### 步驟 1: 設定環境變數

```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 檔案
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### 步驟 2: 修改 API 服務

在 `src/services/api.js` 中：

1. 取消註解真實 fetch 呼叫的程式碼
2. 移除或註解掉模擬邏輯（`delay()` 和 `mockDatabase`）
3. 確保響應格式與後端一致

範例：

```javascript
// 原本（模擬）
export const login = async (username, password) => {
  await delay(800);
  const user = mockDatabase.users.find(...);
  return { success: true, data: { user, token } };
};

// 改為（真實）
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await response.json();
};
```

### 步驟 3: 測試

確保後端 API 返回的格式符合以下結構：

```javascript
{
  success: boolean,    // 操作是否成功
  data: any,          // 返回的資料（可選）
  message: string     // 訊息（可選）
}
```

## 📊 模擬資料說明

### 使用者資料
- 2 個測試帳號（admin 和 hr_manager）

### 檔案資料
- 8 個範例檔案
- 涵蓋 3 個分類（規章制度、請假相關、薪資福利）

### 活動記錄
- 3 筆最近活動記錄

### 統計資料
- 檔案總數、分類統計
- 本月查詢次數：1,234
- 系統狀態：運行正常

## 🛠 技術特點

- **模擬網路延遲**：每個 API 呼叫都有 300ms-1500ms 的延遲
- **統一響應格式**：所有 API 返回一致的格式
- **錯誤處理**：完整的 try-catch 和錯誤訊息
- **Token 管理**：自動處理 token 儲存和使用
- **載入狀態**：所有 API 呼叫都有載入動畫
- **樂觀更新**：上傳和刪除後自動重新載入資料

## 📝 注意事項

1. 目前使用的是**模擬 API**，所有資料存儲在記憶體中
2. 重新整理頁面會重置所有變更（除了登入狀態）
3. 切換到真實後端時，確保後端 API 的響應格式一致
4. Token 儲存在 localStorage，實際應用中可能需要考慮安全性

## 📚 相關文檔

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - 詳細的 API 文檔
- [.env.example](./.env.example) - 環境變數配置範例

## 🎨 設計特色

- ✅ 成功大學紅色主題 (#9f1c20)
- ✅ 白底黑字配色
- ✅ 現代科技感設計
- ✅ 響應式布局
- ✅ 流暢的動畫效果
- ✅ 完整的載入狀態

## 🤝 貢獻

如有任何問題或建議，歡迎提出 Issue 或 Pull Request。
