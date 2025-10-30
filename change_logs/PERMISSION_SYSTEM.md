# 權限管制系統說明

## 📋 系統概述

本系統實現了完整的角色型存取控制 (Role-Based Access Control, RBAC)，確保不同角色的使用者只能執行其權限範圍內的操作。

## 👥 角色定義

### 1. 管理員 (admin)
- **權限等級**: 最高 (Level 3)
- **可執行操作**:
  - ✅ 查看所有資料
  - ✅ 上傳和刪除檔案
  - ✅ 新增、編輯、刪除分類
  - ✅ 新增、編輯、刪除使用者
  - ✅ 修改系統設定
  - ✅ 查看系統資訊和備份

### 2. 主管 (manager)
- **權限等級**: 中等 (Level 2)
- **可執行操作**:
  - ✅ 查看所有資料
  - ✅ 上傳和刪除檔案
  - ❌ 無法管理分類
  - ❌ 無法管理使用者
  - ❌ 無法修改系統設定

### 3. 檢視者 (viewer)
- **權限等級**: 最低 (Level 1)
- **可執行操作**:
  - ✅ 查看所有資料
  - ✅ 下載檔案
  - ❌ 無法上傳檔案
  - ❌ 無法刪除檔案
  - ❌ 無法管理分類
  - ❌ 無法管理使用者
  - ❌ 無法修改系統設定

## 🔒 權限檢查機制

### API 層級檢查

所有資料修改 API 都會先進行權限檢查:

```javascript
// 權限檢查函數
const checkPermission = (requiredRole) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { hasPermission: false, message: '未登入' };
  }

  const roleHierarchy = {
    admin: 3,
    manager: 2,
    viewer: 1
  };

  const userLevel = roleHierarchy[currentUser.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  if (userLevel >= requiredLevel) {
    return { hasPermission: true };
  }

  return { 
    hasPermission: false, 
    message: `此操作需要 ${requiredRole} 以上權限` 
  };
};
```

### UI 層級檢查

UI 會根據使用者角色顯示或隱藏功能按鈕:

- **檔案刪除按鈕**: 僅 manager 以上可見
- **檔案上傳功能**: 僅 manager 以上可使用
- **分類管理按鈕**: 僅 admin 可見
- **使用者管理按鈕**: 僅 admin 可見
- **系統設定儲存**: 僅 admin 可點擊

## 📁 受保護的 API 端點

### 檔案管理
- `deleteFile()` - 需要 **manager** 以上權限
- `batchUpload()` - 需要 **manager** 以上權限

### 分類管理
- `addCategory()` - 需要 **admin** 權限
- `deleteCategory()` - 需要 **admin** 權限

### 使用者管理
- `addUser()` - 需要 **admin** 權限
- `updateUser()` - 需要 **admin** 權限
- `deleteUser()` - 需要 **admin** 權限

### 系統設定
- `updateSettings()` - 需要 **admin** 權限

## 🎨 UI 權限控制

### Dashboard 組件
```jsx
// 取得當前使用者權限
const isAdmin = user.role === 'admin';
const isManager = user.role === 'manager' || isAdmin;
const isViewer = user.role === 'viewer';

// 根據角色顯示不同內容
{isAdmin && (
  <button>新增分類</button>
)}

{!isAdmin && (
  <div>僅管理員可新增分類</div>
)}
```

### KnowledgeBase 組件
```jsx
// 檔案刪除按鈕權限控制
{isManager ? (
  <button onClick={() => handleDelete(file.id)}>刪除</button>
) : (
  <button disabled title="僅主管以上可刪除檔案">刪除</button>
)}
```

### UploadFiles 組件
```jsx
// 上傳頁面權限檢查
{!isManager ? (
  <div>權限不足 - 需要主管或管理員權限</div>
) : (
  // 顯示上傳介面
)}
```

## 🧪 測試帳號

系統內建三種角色的測試帳號:

### 管理員帳號
- **帳號**: admin
- **密碼**: admin123
- **角色**: admin
- **說明**: 擁有所有權限

### 主管帳號
- **帳號**: hr_manager
- **密碼**: manager123
- **角色**: manager
- **說明**: 可管理檔案，無法管理使用者和設定

### 檢視者帳號
- **帳號**: viewer
- **密碼**: viewer123
- **角色**: viewer
- **說明**: 僅能查看和下載，無法修改任何資料

## 📝 使用方式

1. **登入不同角色帳號**: 使用上述測試帳號登入系統
2. **觀察權限差異**: 
   - admin 可以看到所有功能按鈕
   - manager 無法看到「使用者管理」和「系統設定儲存」按鈕
   - viewer 會在「上傳檔案」頁面看到權限不足提示，且無法刪除檔案
3. **測試權限限制**: 嘗試執行超出權限的操作，系統會顯示錯誤訊息

## 🔐 安全特性

1. **雙重驗證**: API 層級和 UI 層級都會檢查權限
2. **角色階層**: 高階角色自動擁有低階角色的所有權限
3. **錯誤訊息**: 權限不足時會顯示清楚的錯誤訊息
4. **視覺回饋**: 
   - 角色徽章顯示在導航欄
   - 權限不足的按鈕會被隱藏或禁用
   - 顯示權限提示訊息

## 📊 權限矩陣

| 功能 | 檢視者 | 主管 | 管理員 |
|------|--------|------|--------|
| 查看檔案 | ✅ | ✅ | ✅ |
| 下載檔案 | ✅ | ✅ | ✅ |
| 上傳檔案 | ❌ | ✅ | ✅ |
| 刪除檔案 | ❌ | ✅ | ✅ |
| 新增分類 | ❌ | ❌ | ✅ |
| 刪除分類 | ❌ | ❌ | ✅ |
| 新增使用者 | ❌ | ❌ | ✅ |
| 編輯使用者 | ❌ | ❌ | ✅ |
| 刪除使用者 | ❌ | ❌ | ✅ |
| 修改系統設定 | ❌ | ❌ | ✅ |
| 查看系統資訊 | ✅ | ✅ | ✅ |

## 🚀 實現檔案

### API 層級
- **檔案**: `src/services/api.js`
- **關鍵函數**:
  - `checkPermission(requiredRole)` - 權限檢查
  - `getCurrentUser()` - 取得當前使用者
  - `ROLES` - 角色常數定義

### UI 層級
- **Dashboard.jsx**: 儀表板和系統設定權限控制
- **KnowledgeBase.jsx**: 知識庫檔案刪除權限控制
- **UploadFiles.jsx**: 檔案上傳權限控制

## 💡 維護建議

1. **新增 API 時**: 記得為所有修改資料的 API 添加 `checkPermission()` 檢查
2. **新增 UI 功能時**: 根據角色顯示或隱藏相關按鈕
3. **測試**: 使用三種測試帳號測試所有功能
4. **文件更新**: 新增角色或權限時更新本文件

## 🔄 版本歷史

- **v1.0** (2025-01-XX): 初始版本，實現三級角色權限系統
  - 實現 API 層級權限檢查
  - 實現 UI 層級權限控制
  - 新增測試帳號
  - 完成所有核心功能的權限保護
