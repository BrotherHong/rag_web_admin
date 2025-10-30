# 檔案結構重構文檔

## 概述
本次重構將原本 1307 行的 `Dashboard.jsx` 拆分成多個獨立的模組化組件，提高代碼的可維護性和可讀性。

## 原始結構
```
Dashboard.jsx (1307 lines)
├── Dashboard (主組件)
├── DashboardHome (儀表板首頁)
└── Settings (設定頁面)
    ├── AIModelSettings (AI 模型設定)
    ├── KnowledgeBaseSettings (知識庫設定)
    ├── CategoryManagement (分類管理)
    ├── UserManagement (使用者管理)
    ├── NotificationSettings (通知設定)
    ├── BackupSettings (備份設定)
    └── SystemInfo (系統資訊)
```

## 新檔案結構
```
src/components/
├── Dashboard.jsx (200 lines) - 主容器組件
├── DashboardHome.jsx (231 lines) - 儀表板首頁
├── Settings/ - 設定相關組件資料夾
│   ├── index.jsx (151 lines) - 設定主頁面
│   ├── AIModelSettings.jsx (98 lines) - AI 模型設定
│   ├── KnowledgeBaseSettings.jsx (85 lines) - 知識庫設定
│   ├── CategoryManagement.jsx (208 lines) - 分類管理
│   ├── UserManagement.jsx (78 lines) - 使用者管理
│   ├── NotificationSettings.jsx (105 lines) - 通知設定
│   ├── BackupSettings.jsx (90 lines) - 備份設定
│   └── SystemInfo.jsx (100 lines) - 系統資訊
├── KnowledgeBase.jsx - 知識庫管理
├── UploadFiles.jsx - 檔案上傳
└── Login.jsx - 登入頁面
```

## 組件詳細說明

### 1. Dashboard.jsx (主容器)
**責任：**
- 頂部導航欄（標題、使用者資訊、登出按鈕）
- 側邊導航欄（儀表板、知識庫、上傳、設定）
- 頁面路由管理（currentPage 狀態）
- 登出邏輯處理

**導入組件：**
```javascript
import DashboardHome from './DashboardHome';
import KnowledgeBase from './KnowledgeBase';
import UploadFiles from './UploadFiles';
import Settings from './Settings';
```

**狀態管理：**
- `currentPage`: 當前顯示的頁面
- `isLoggingOut`: 登出載入狀態

### 2. DashboardHome.jsx
**責任：**
- 顯示統計資料卡片（總檔案數、總問答、平均回應時間、使用者滿意度）
- 顯示最近活動記錄
- API 資料載入與顯示

**功能：**
- `getStatistics()`: 獲取統計資料
- `getRecentActivities()`: 獲取最近活動
- `formatTimeAgo()`: 格式化時間顯示
- `getFileIcon()`: 根據檔案類型顯示圖示
- `getActivityIcon()`: 根據活動類型顯示圖示

**狀態管理：**
- `stats`: 統計資料
- `activities`: 活動記錄
- `isLoading`: 載入狀態

### 3. Settings/index.jsx (設定主頁面)
**責任：**
- 設定頁面的標籤導航
- 管理所有設定相關的狀態
- 渲染對應的設定子組件
- 處理設定變更與儲存

**導入組件：**
```javascript
import AIModelSettings from './AIModelSettings';
import KnowledgeBaseSettings from './KnowledgeBaseSettings';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import NotificationSettings from './NotificationSettings';
import BackupSettings from './BackupSettings';
import SystemInfo from './SystemInfo';
```

**標籤：**
- AI 模型設定
- 知識庫設定
- 分類管理
- 使用者管理
- 通知設定
- 備份設定
- 系統資訊

**狀態管理：**
- `activeTab`: 當前活躍的標籤
- `settings`: 所有設定的集中狀態物件

### 4. Settings/AIModelSettings.jsx
**責任：**
- AI 模型選擇（GPT-4, GPT-3.5 Turbo, Claude, Llama）
- Temperature 控制（0-1）
- Max Tokens 設定（100-4000）
- Top P 控制（0-1）
- Tone 選擇（Professional, Friendly, Casual, Formal）

**Props：**
- `settings`: 設定物件
- `onChange`: 變更處理函數

### 5. Settings/KnowledgeBaseSettings.jsx
**責任：**
- 相似度閾值設定（0-1）
- 最大檢索文檔數（1-20）
- 自動清理天數（30-365）
- 索引更新頻率選擇

**Props：**
- `settings`: 設定物件
- `onChange`: 變更處理函數

### 6. Settings/CategoryManagement.jsx
**責任：**
- 顯示現有分類列表
- 新增分類（名稱 + 顏色選擇）
- 刪除分類
- 顏色選擇器（10 種預設顏色 + 自訂顏色）

**功能：**
- Modal 對話框控制
- 顏色預覽
- 分類 CRUD 操作

**狀態管理：**
- `categories`: 分類列表
- `isModalOpen`: Modal 開關狀態
- `newCategory`: 新分類資料

### 7. Settings/UserManagement.jsx
**責任：**
- 使用者列表顯示（表格）
- 使用者資訊（名稱、Email、角色、狀態）
- 響應式設計（移動裝置隱藏 Email 欄位）

**功能：**
- 角色徽章顯示（Admin, Editor, Viewer）
- 狀態徽章顯示（Active, Inactive）

**狀態管理：**
- `users`: 使用者列表

### 8. Settings/NotificationSettings.jsx
**責任：**
- 5 種通知設定開關
  - Email 通知
  - 上傳成功通知
  - 上傳失敗通知
  - 儲存空間警告
  - 每週報告

**Props：**
- `settings`: 設定物件
- `onChange`: 變更處理函數

**UI 特色：**
- 自訂 Toggle 開關
- NCKU 紅色主題

### 9. Settings/BackupSettings.jsx
**責任：**
- 自動備份開關
- 備份頻率選擇（每日、每週、每月）
- 備份歷史記錄顯示
- 立即備份功能
- 還原功能

**狀態管理：**
- `backupHistory`: 備份歷史記錄

**Props：**
- `settings`: 設定物件
- `onChange`: 變更處理函數

### 10. Settings/SystemInfo.jsx
**責任：**
- 系統統計資訊顯示
  - 系統版本
  - 上線時間
  - CPU 使用率
  - 記憶體使用率
  - 資料庫大小
  - 快取大小
  - API 請求數
  - 錯誤率
- 儲存空間使用視覺化（進度條）

**特色：**
- 2 欄網格佈局
- 視覺化進度條
- 百分比計算顯示

## 重構優點

### 1. 可維護性提升
- 每個組件職責單一，易於理解和修改
- 程式碼量減少，從單一 1307 行拆分成多個小檔案
- 組件獨立，修改不影響其他部分

### 2. 可重用性
- Settings 子組件可以在其他頁面重用
- 通用功能（如顏色選擇器）可獨立測試

### 3. 開發效率
- 團隊成員可以並行開發不同組件
- 減少合併衝突
- 易於進行單元測試

### 4. 程式碼組織
- 相關功能組織在同一資料夾
- 清晰的命名和結構
- 易於新增功能

### 5. 效能優化潛力
- 可以對單一組件進行 lazy loading
- 減少不必要的重新渲染
- 更好的程式碼分割

## 保留的功能

✅ 所有原有功能完整保留：
- 頂部導航欄和使用者資訊
- 側邊導航欄和頁面切換
- 儀表板統計資料顯示
- 所有設定功能
- 登出功能
- 響應式設計
- NCKU 紅色主題

## 導入/匯出模式

所有組件使用一致的導入/匯出模式：

```javascript
// 頂部導入依賴
import { useState } from 'react';
import SomeComponent from './SomeComponent';

// 組件定義
function MyComponent() {
  // 組件邏輯
}

// 預設匯出
export default MyComponent;
```

## 狀態管理策略

### 本地狀態
- CategoryManagement: 分類列表
- UserManagement: 使用者列表
- BackupSettings: 備份歷史

### 傳遞狀態
- Settings 主組件管理所有設定狀態
- 透過 props 傳遞給子組件
- onChange 回調統一處理變更

## 下一步建議

1. **測試**
   - 為每個組件編寫單元測試
   - 測試組件間的整合

2. **優化**
   - 實作 React.memo 避免不必要的重新渲染
   - 使用 useCallback 和 useMemo 優化效能

3. **功能增強**
   - 新增更多設定選項時，可以繼續拆分
   - 考慮使用狀態管理庫（如 Redux 或 Zustand）

4. **文檔**
   - 為每個組件添加 JSDoc 註解
   - 建立 Storybook 展示組件

## 總結

本次重構成功將一個龐大的 1307 行檔案拆分成 10 個模組化組件，總共約 1146 行程式碼，分布在更合理的結構中。每個組件現在都有明確的職責，更易於維護和擴展。所有原有功能完整保留，並為未來的開發和優化奠定了良好的基礎。
