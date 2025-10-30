# 批次檔案上傳系統文檔

## 📅 建立日期
2025年10月17日

## 🎯 系統概述

### 功能特點
本系統實現了一個完整的批次檔案上傳解決方案，支援多管理員並發操作，具備以下核心功能：

1. **多檔案選擇** - 支援一次選擇多個檔案，或多次添加檔案
2. **重複檔案檢測** - 自動檢測完全重複和相關檔案
3. **智慧建議** - 根據檔名相似度提供刪除舊檔案的建議
4. **批次處理** - 一鍵上傳所有選定檔案
5. **即時進度** - 顯示每個檔案的處理進度
6. **跨頁面持久** - 即使離開頁面，回來後仍可查看進度
7. **多用戶支援** - 支援多個管理員同時使用系統

---

## 🏗️ 系統架構

### 前端組件

#### 1. UploadFiles.jsx
獨立的檔案上傳頁面，分為三個步驟：

**步驟 1: 選擇檔案**
- 拖曳或點擊選擇檔案
- 支援多次添加檔案
- 為每個檔案設定分類
- 移除不需要的檔案
- 顯示檔案列表和大小

**步驟 2: 檢查重複**
- 調用 `checkDuplicates` API
- 顯示完全重複的檔案（紅色警告）
- 顯示可能相關的檔案（黃色提示）
- 允許選擇要刪除的舊檔案
- 統計將刪除的檔案數量

**步驟 3: 上傳處理**
- 調用 `batchUpload` API 建立上傳任務
- 每秒輪詢 `getUploadProgress` 更新進度
- 顯示總體進度條
- 顯示每個檔案的處理狀態
- 區分成功、處理中、失敗的檔案

#### 2. Dashboard.jsx 修改
- 新增「上傳檔案」導航按鈕
- 添加路由到 UploadFiles 組件
- 保持與其他頁面一致的 UI 風格

#### 3. KnowledgeBase.jsx 簡化
- **移除** - 上傳按鈕和上傳 Modal
- **移除** - handleFileUpload 函數
- **移除** - showUploadModal, isUploading, uploadCategory 狀態
- **保留** - 查看檔案列表功能
- **保留** - 刪除檔案功能
- **保留** - 搜尋和篩選功能

---

## 🔧 API 服務層

### 新增 API 函數

#### 1. checkDuplicates(fileList)
**目的**: 檢查待上傳檔案是否與現有檔案重複或相關

**參數**:
```javascript
fileList: [
  { name: string, size: number, type: string },
  ...
]
```

**返回**:
```javascript
{
  success: true,
  data: [
    {
      fileName: string,           // 待上傳檔案名
      isDuplicate: boolean,        // 是否完全重複
      duplicateFile: object|null,  // 重複的檔案資訊
      relatedFiles: array,         // 相關檔案列表
      suggestReplace: boolean      // 是否建議替換
    },
    ...
  ]
}
```

**演算法**:
1. 檢查完全重複：檔名完全相同
2. 檢查相關性：
   - 移除副檔名
   - 分割檔名成關鍵詞（以空格、底線、連字號分隔）
   - 如果關鍵詞出現在現有檔案名中，視為相關

**範例**:
```javascript
// 假設知識庫中有：「人事規章2024.pdf」

// 上傳：「人事規章.pdf」
// 結果：isDuplicate: false, relatedFiles: [「人事規章2024.pdf」]

// 上傳：「人事規章2024.pdf」  
// 結果：isDuplicate: true, duplicateFile: {...}
```

---

#### 2. batchUpload(uploadData)
**目的**: 建立批次上傳任務並開始處理

**參數**:
```javascript
uploadData: {
  files: File[],              // 要上傳的檔案陣列
  categories: {               // 檔案分類對應
    '檔案名.pdf': '分類名',
    ...
  },
  removeFileIds: number[]     // 要刪除的舊檔案 ID
}
```

**返回**:
```javascript
{
  success: true,
  data: {
    taskId: string,           // 任務 ID (用於查詢進度)
    message: string
  }
}
```

**任務 ID 格式**: `task_{userId}_{timestamp}`

**處理流程**:
1. 驗證使用者身份
2. 生成唯一任務 ID
3. 創建任務記錄（儲存在 mockDatabase.uploadTasks）
4. 觸發異步處理函數 `processUploadTask`
5. 立即返回任務 ID

---

#### 3. processUploadTask(taskId, uploadData)
**目的**: 異步處理上傳任務（模擬後端行為）

**處理步驟**:

**階段 1: 刪除舊檔案**
```javascript
for (const fileId of removeFileIds) {
  // 從資料庫移除檔案
  // 新增刪除活動記錄
}
```

**階段 2: 處理每個檔案**
```javascript
for (const file of files) {
  // 更新檔案狀態為 'processing'
  // 模擬處理進度 (0% → 20% → 40% → 60% → 80% → 100%)
  // 隨機失敗測試 (10% 機率)
  // 成功：添加到資料庫，記錄活動
  // 失敗：記錄錯誤訊息
}
```

**階段 3: 完成任務**
```javascript
// 更新任務狀態
// status: 'completed' (全部成功) 或 'partial' (部分失敗)
// 記錄結束時間
```

**任務狀態**:
- `pending` - 等待處理
- `processing` - 處理中
- `completed` - 全部成功
- `partial` - 部分失敗

**檔案狀態**:
- `pending` - 等待處理
- `processing` - 處理中
- `completed` - 成功
- `failed` - 失敗

---

#### 4. getUploadProgress(taskId)
**目的**: 查詢上傳任務的即時進度

**參數**:
```javascript
taskId: string
```

**返回**:
```javascript
{
  success: true,
  data: {
    id: string,
    userId: number,
    userName: string,
    status: string,              // pending/processing/completed/partial
    totalFiles: number,
    processedFiles: number,
    successFiles: number,
    failedFiles: number,
    currentFile: string|null,    // 當前處理的檔案名
    files: [
      {
        id: string,
        name: string,
        size: number,
        status: string,          // pending/processing/completed/failed
        progress: number,        // 0-100
        error: string|null
      },
      ...
    ],
    removeFileIds: number[],
    categories: object,
    startTime: string,           // ISO 8601
    endTime: string|null,        // ISO 8601
    error: string|null
  }
}
```

**使用場景**:
- 前端每秒輪詢獲取最新進度
- 刷新頁面後恢復進度顯示
- 顯示其他管理員的上傳任務

---

#### 5. getUserUploadTasks()
**目的**: 取得當前使用者的所有上傳任務

**返回**:
```javascript
{
  success: true,
  data: [
    { /* 任務物件 */ },
    ...
  ]
}
```

**排序**: 按開始時間降序（最新的在前）

**用途**:
- 查看歷史上傳記錄
- 檢查未完成的任務
- 恢復中斷的上傳

---

#### 6. deleteUploadTask(taskId)
**目的**: 刪除已完成的任務記錄

**參數**:
```javascript
taskId: string
```

**返回**:
```javascript
{
  success: true,
  message: string
}
```

---

## 📊 資料結構

### mockDatabase.uploadTasks
儲存所有上傳任務的字典：

```javascript
{
  'task_1_1729155600000': {
    id: 'task_1_1729155600000',
    userId: 1,
    userName: '系統管理員',
    status: 'completed',
    totalFiles: 3,
    processedFiles: 3,
    successFiles: 3,
    failedFiles: 0,
    currentFile: null,
    files: [
      {
        id: 'file_0',
        name: '新版人事規章.pdf',
        size: 2457600,
        status: 'completed',
        progress: 100,
        error: null
      },
      // ...
    ],
    removeFileIds: [1, 5],
    categories: {
      '新版人事規章.pdf': '規章制度'
    },
    startTime: '2025-10-17T10:30:00.000Z',
    endTime: '2025-10-17T10:32:15.000Z',
    error: null
  },
  // 其他任務...
}
```

---

## 🔄 工作流程

### 完整上傳流程圖

```
┌─────────────────────────────────────────────────────────┐
│ 步驟 1: 選擇檔案                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. 使用者點擊或拖曳選擇檔案                            │ │
│ │ 2. 檔案加入 selectedFiles 陣列                        │ │
│ │ 3. 為每個檔案設定預設分類                              │ │
│ │ 4. 使用者可調整分類或移除檔案                          │ │
│ │ 5. 可多次點擊「繼續選擇」添加更多檔案                   │ │
│ │ 6. 點擊「下一步：檢查重複」                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 步驟 2: 檢查重複                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. 調用 checkDuplicates(fileList)                    │ │
│ │ 2. 後端比對每個檔案                                    │ │
│ │    - 檢查完全重複（檔名相同）                          │ │
│ │    - 檢查相關檔案（關鍵詞匹配）                        │ │
│ │ 3. 前端顯示檢查結果                                    │ │
│ │    - 紅色標示：完全重複                                │ │
│ │    - 黃色標示：可能相關                                │ │
│ │    - 綠色標示：無重複                                  │ │
│ │ 4. 使用者選擇要刪除的舊檔案                            │ │
│ │ 5. 點擊「開始上傳到知識庫」                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 步驟 3: 批次上傳                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 【前端】                                              │ │
│ │ 1. 調用 batchUpload(uploadData)                      │ │
│ │ 2. 收到 taskId                                        │ │
│ │ 3. 開始輪詢 getUploadProgress(taskId)                │ │
│ │    - 每 1 秒查詢一次                                   │ │
│ │ 4. 更新 UI 顯示進度                                    │ │
│ │ 5. 當 status 為 completed/partial 停止輪詢           │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 【後端】                                              │ │
│ │ 1. 創建任務記錄在 uploadTasks                         │ │
│ │ 2. 觸發 processUploadTask (異步)                     │ │
│ │    ├─ 刪除選定的舊檔案                                │ │
│ │    ├─ For each file:                                 │ │
│ │    │   ├─ 更新狀態為 processing                      │ │
│ │    │   ├─ 模擬處理過程 (進度 0→100%)                 │ │
│ │    │   ├─ 添加到資料庫或記錄錯誤                      │ │
│ │    │   └─ 更新檔案狀態                                │ │
│ │    └─ 更新任務狀態為 completed/partial               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 完成                                                      │
│ - 顯示成功/失敗統計                                        │
│ - 可點擊「完成」按鈕重新開始                                │
│ - 任務記錄保存在 uploadTasks 中                            │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 多用戶並發處理

### 設計原則

1. **任務隔離**
   - 每個任務有唯一 ID：`task_{userId}_{timestamp}`
   - 任務 ID 包含使用者 ID，確保不會衝突
   - 即使同一使用者也不會有相同的 timestamp

2. **資料一致性**
   - 所有任務儲存在同一個 `mockDatabase.uploadTasks` 物件
   - 使用任務 ID 作為 key，避免覆蓋
   - 檔案 ID 自動遞增，確保唯一性

3. **並發處理**
   - 每個任務獨立運行異步處理
   - 互不影響，互不阻塞
   - JavaScript 單線程 + Event Loop 自然支援並發

### 並發場景示例

#### 場景 1: 兩個管理員同時上傳

```
時間軸           管理員 A (ID=1)              管理員 B (ID=2)
─────────────────────────────────────────────────────────────
10:30:00    點擊「開始上傳」              
10:30:01    taskId: task_1_1697523001000
            開始處理檔案 1/3               點擊「開始上傳」
10:30:02    處理進度 20%                  taskId: task_2_1697523002000
10:30:03    處理進度 40%                  開始處理檔案 1/5
10:30:04    處理進度 60%                  處理進度 20%
10:30:05    處理進度 80%                  處理進度 40%
10:30:06    檔案 1 完成，開始檔案 2        處理進度 60%
...
```

**結果**: 兩個任務各自完成，互不干擾

#### 場景 2: 同一管理員在不同瀏覽器標籤

```
時間軸           標籤 A                       標籤 B
─────────────────────────────────────────────────────────────
10:30:00    開始上傳 (task_1_xxx000)      
10:30:05    處理中...                     開始上傳 (task_1_xxx005)
10:30:10    仍在處理中...                 處理中...
10:30:15    完成                          仍在處理中...
10:30:20                                  完成
```

**結果**: 兩個任務獨立完成，可以通過 `getUserUploadTasks()` 查看所有任務

---

## 🔍 進度持久化機制

### 問題
用戶在上傳過程中：
- 關閉瀏覽器標籤
- 刷新頁面
- 切換到其他頁面
- 網路暫時斷線

**要求**: 回來後仍能看到正確的進度

### 解決方案

#### 1. 後端持久化
```javascript
// 任務儲存在 mockDatabase.uploadTasks
// 即使前端關閉，後端仍在處理
mockDatabase.uploadTasks[taskId] = {
  // 完整的任務狀態
};
```

#### 2. 前端恢復機制

**方法 A**: localStorage 儲存 taskId
```javascript
// 上傳開始時
localStorage.setItem('currentUploadTask', taskId);

// 頁面載入時
useEffect(() => {
  const savedTaskId = localStorage.getItem('currentUploadTask');
  if (savedTaskId) {
    // 調用 getUploadProgress 恢復狀態
    fetchUploadProgress(savedTaskId);
  }
}, []);

// 上傳完成時清除
if (status === 'completed' || status === 'partial') {
  localStorage.removeItem('currentUploadTask');
}
```

**方法 B**: 查詢最近任務
```javascript
useEffect(() => {
  const tasks = await getUserUploadTasks();
  const runningTask = tasks.find(t => 
    t.status === 'pending' || t.status === 'processing'
  );
  if (runningTask) {
    setUploadTaskId(runningTask.id);
    setCurrentStep(3);
  }
}, []);
```

#### 3. 輪詢機制
```javascript
useEffect(() => {
  let interval;
  if (uploadTaskId && uploading) {
    interval = setInterval(() => {
      fetchUploadProgress();
    }, 1000);
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [uploadTaskId, uploading]);
```

**特點**:
- 持續查詢最新狀態
- 自動停止當任務完成
- 清理機制防止內存洩漏

---

## 🎨 UI/UX 設計

### 步驟指示器
```
┌────┐      ┌────┐      ┌────┐
│ 1  │──────│ 2  │──────│ 3  │
└────┘      └────┘      └────┘
選擇檔案    檢查重複    上傳處理
```

**視覺效果**:
- 當前步驟：紅色圓圈 + 白色文字
- 已完成：紅色連接線
- 未完成：灰色圓圈 + 灰色連接線

### 檔案列表卡片

**步驟 1**:
```
┌────────────────────────────────────────┐
│ 📄 檔案名.pdf                    [分類▼] [🗑]
│ 2.4 MB                                  │
└────────────────────────────────────────┘
```

**步驟 2 - 重複檔案**:
```
┌────────────────────────────────────────┐
│ 📄 檔案名.pdf           [完全重複 🔴]    │
│                                         │
│   ┌─ 現有檔案 ─────────────────────┐   │
│   │ ☑ 檔案名.pdf                    │   │
│   │   2.4 MB · 2025-10-15  [建議刪除]│   │
│   └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

**步驟 2 - 相關檔案**:
```
┌────────────────────────────────────────┐
│ 📄 新版規章.pdf    [找到1個相關檔案 🟡] │
│                                         │
│   ┌─ 可能相關 ─────────────────────┐   │
│   │ ☐ 舊版規章.pdf                  │   │
│   │   1.8 MB · 2025-09-20  [可能相關]│   │
│   └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

### 進度條樣式

**總體進度**:
```
已處理 2 / 5 個檔案                    40%

████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

成功: 2      失敗: 0
```

**單一檔案**:
```
✓ 檔案1.pdf                          完成
⟳ 檔案2.pdf                          60%  ████████░░
⏱ 檔案3.pdf                          等待中
⏱ 檔案4.pdf                          等待中
⏱ 檔案5.pdf                          等待中
```

### 狀態圖標

- ✓ (綠色) - 完成
- ⟳ (藍色旋轉) - 處理中
- ⏱ (灰色) - 等待
- ✗ (紅色) - 失敗
- 🔴 - 完全重複
- 🟡 - 可能相關
- 🟢 - 無重複

---

## 🔐 安全性考量

### 1. 身份驗證
```javascript
// 每個 API 都需要驗證 token
const token = localStorage.getItem('token');
if (!token) {
  return { success: false, message: '未登入' };
}
```

### 2. 任務權限
```javascript
// 使用者只能查看自己的任務
const user = JSON.parse(localStorage.getItem('user'));
const userTasks = uploadTasks.filter(task => task.userId === user.id);
```

### 3. 檔案驗證
```javascript
// 檢查檔案類型
const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.ppt'];

// 檢查檔案大小
const maxSize = 50 * 1024 * 1024; // 50MB
```

### 4. SQL Injection 防護
實際應用中使用參數化查詢：
```javascript
// ❌ 錯誤
const query = `SELECT * FROM files WHERE name = '${fileName}'`;

// ✅ 正確
const query = 'SELECT * FROM files WHERE name = ?';
db.query(query, [fileName]);
```

---

## 🚀 從 Mock 到真實後端

### 切換步驟

#### 1. 移除 Mock 處理邏輯
```javascript
// 在 api.js 中，移除所有模擬延遲和資料
// await delay(800); // 刪除
// mockDatabase.uploadTasks[taskId] = task; // 刪除
```

#### 2. 啟用真實 API 呼叫
```javascript
export const checkDuplicates = async (fileList) => {
  // 取消註解
  const response = await fetch(`${API_BASE_URL}/files/check-duplicates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: fileList })
  });
  
  const data = await response.json();
  return data;
};
```

#### 3. 後端 API 端點實現

**Node.js + Express 範例**:

```javascript
// routes/files.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 檢查重複檔案
router.post('/check-duplicates', authMiddleware, async (req, res) => {
  const { files } = req.body;
  const results = [];
  
  for (const file of files) {
    // 查詢資料庫
    const exactMatch = await File.findOne({ name: file.name });
    
    // 查詢相關檔案
    const relatedFiles = await File.find({
      name: { $regex: extractKeywords(file.name), $options: 'i' }
    });
    
    results.push({
      fileName: file.name,
      isDuplicate: !!exactMatch,
      duplicateFile: exactMatch,
      relatedFiles: relatedFiles.filter(f => f.name !== file.name),
      suggestReplace: relatedFiles.length > 0
    });
  }
  
  res.json({ success: true, data: results });
});

// 批次上傳
router.post('/batch-upload', 
  authMiddleware, 
  upload.array('files'), 
  async (req, res) => {
    const { categories, removeFileIds } = req.body;
    const taskId = `task_${req.user.id}_${Date.now()}`;
    
    // 創建任務記錄
    const task = await UploadTask.create({
      id: taskId,
      userId: req.user.id,
      status: 'pending',
      totalFiles: req.files.length,
      // ... 其他欄位
    });
    
    // 觸發背景處理
    processUploadTaskAsync(taskId, req.files, categories, removeFileIds);
    
    res.json({
      success: true,
      data: { taskId, message: '上傳任務已建立' }
    });
});

// 查詢進度
router.get('/upload-progress/:taskId', authMiddleware, async (req, res) => {
  const task = await UploadTask.findOne({ id: req.params.taskId });
  
  if (!task) {
    return res.json({ success: false, message: '找不到任務' });
  }
  
  res.json({ success: true, data: task });
});

module.exports = router;
```

**背景處理 (Worker/Queue)**:

```javascript
// workers/uploadProcessor.js
const Queue = require('bull');
const uploadQueue = new Queue('file-upload');

uploadQueue.process(async (job) => {
  const { taskId, files, categories, removeFileIds } = job.data;
  
  // 更新任務狀態
  await UploadTask.updateOne(
    { id: taskId },
    { status: 'processing' }
  );
  
  // 刪除舊檔案
  await File.deleteMany({ _id: { $in: removeFileIds } });
  
  // 處理每個檔案
  for (const file of files) {
    try {
      // 1. 移動檔案到永久位置
      // 2. 提取文字內容
      // 3. 建立向量嵌入
      // 4. 儲存到資料庫
      
      await processFile(file, categories[file.originalname]);
      
      // 更新檔案進度
      await UploadTask.updateFileProgress(taskId, file.id, 'completed', 100);
      
    } catch (error) {
      await UploadTask.updateFileProgress(
        taskId, 
        file.id, 
        'failed', 
        0, 
        error.message
      );
    }
  }
  
  // 完成任務
  await UploadTask.updateOne(
    { id: taskId },
    { 
      status: 'completed',
      endTime: new Date()
    }
  );
});
```

---

## 📈 性能優化建議

### 1. 前端優化

**減少輪詢頻率**:
```javascript
// 根據任務狀態調整輪詢間隔
const interval = uploadProgress.processedFiles < 3 ? 500 : 1000;
```

**使用 WebSocket**:
```javascript
// 替代輪詢，實現即時推送
const ws = new WebSocket('ws://localhost:3000/upload-progress');
ws.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  setUploadProgress(progress);
};
```

**虛擬滾動**:
```javascript
// 當檔案列表很長時
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={files.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      {/* 檔案項目 */}
    </div>
  )}
</FixedSizeList>
```

### 2. 後端優化

**使用訊息佇列**:
```javascript
// Redis + Bull
const uploadQueue = new Queue('upload', {
  redis: { host: 'localhost', port: 6379 }
});

// 並發處理
uploadQueue.process(5, processUploadTask);
```

**資料庫索引**:
```javascript
// MongoDB
db.files.createIndex({ name: 1 });
db.files.createIndex({ userId: 1, uploadDate: -1 });
db.uploadTasks.createIndex({ userId: 1, status: 1 });
```

**檔案分塊上傳**:
```javascript
// 大檔案分片上傳
const chunkSize = 1024 * 1024; // 1MB
for (let i = 0; i < file.size; i += chunkSize) {
  const chunk = file.slice(i, i + chunkSize);
  await uploadChunk(chunk, i / chunkSize);
}
```

---

## 🐛 錯誤處理

### 前端錯誤捕獲

```javascript
const handleStartUpload = async () => {
  try {
    setUploading(true);
    const response = await batchUpload(uploadData);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    setUploadTaskId(response.data.taskId);
    
  } catch (error) {
    console.error('上傳失敗:', error);
    alert(`上傳失敗：${error.message}`);
    setUploading(false);
    
    // 回到步驟 1 讓使用者重試
    setCurrentStep(1);
  }
};
```

### 後端錯誤處理

```javascript
// 全域錯誤處理中介軟體
app.use((err, req, res, next) => {
  console.error('錯誤:', err);
  
  // 更新任務狀態為失敗
  if (err.taskId) {
    UploadTask.updateOne(
      { id: err.taskId },
      { 
        status: 'failed',
        error: err.message,
        endTime: new Date()
      }
    );
  }
  
  res.status(500).json({
    success: false,
    message: '伺服器錯誤',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

---

## 📝 測試策略

### 單元測試

```javascript
// checkDuplicates.test.js
describe('checkDuplicates', () => {
  test('應該檢測到完全重複的檔案', async () => {
    const files = [{ name: '人事規章.pdf', size: 1024, type: 'pdf' }];
    const result = await checkDuplicates(files);
    
    expect(result.success).toBe(true);
    expect(result.data[0].isDuplicate).toBe(true);
  });
  
  test('應該找出相關檔案', async () => {
    const files = [{ name: '人事規章2025.pdf', size: 1024, type: 'pdf' }];
    const result = await checkDuplicates(files);
    
    expect(result.data[0].relatedFiles.length).toBeGreaterThan(0);
  });
});
```

### 整合測試

```javascript
// uploadFlow.test.js
describe('上傳流程', () => {
  test('完整上傳流程', async () => {
    // 1. 選擇檔案
    const files = [createMockFile('test.pdf')];
    
    // 2. 檢查重複
    const dupResult = await checkDuplicates(files);
    expect(dupResult.success).toBe(true);
    
    // 3. 批次上傳
    const uploadResult = await batchUpload({
      files,
      categories: { 'test.pdf': '未分類' },
      removeFileIds: []
    });
    expect(uploadResult.success).toBe(true);
    
    // 4. 查詢進度
    const progressResult = await getUploadProgress(uploadResult.data.taskId);
    expect(progressResult.success).toBe(true);
  });
});
```

### E2E 測試

```javascript
// cypress/e2e/upload.cy.js
describe('檔案上傳', () => {
  it('應該能完整上傳檔案', () => {
    cy.login('admin', 'admin123');
    cy.visit('/dashboard');
    cy.contains('上傳檔案').click();
    
    // 選擇檔案
    cy.get('input[type="file"]').attachFile('test.pdf');
    cy.contains('下一步：檢查重複').click();
    
    // 確認上傳
    cy.contains('開始上傳到知識庫').click();
    
    // 等待完成
    cy.contains('全部完成', { timeout: 30000 });
  });
});
```

---

## 🎓 最佳實踐

### 1. 程式碼組織
```
src/
├── components/
│   ├── UploadFiles.jsx          # 主要上傳組件
│   ├── FileSelector.jsx         # 檔案選擇器（可拆分）
│   ├── DuplicateChecker.jsx     # 重複檢查（可拆分）
│   └── ProgressTracker.jsx      # 進度追蹤（可拆分）
├── services/
│   └── api.js                   # API 服務層
├── hooks/
│   ├── useFileUpload.js         # 上傳邏輯 hook
│   └── useUploadProgress.js     # 進度輪詢 hook
└── utils/
    ├── fileValidation.js        # 檔案驗證工具
    └── formatters.js            # 格式化工具
```

### 2. 錯誤訊息國際化
```javascript
const ERROR_MESSAGES = {
  'zh-TW': {
    FILE_TOO_LARGE: '檔案大小超過限制',
    INVALID_TYPE: '不支援的檔案格式',
    NETWORK_ERROR: '網路連線錯誤',
  },
  'en-US': {
    FILE_TOO_LARGE: 'File size exceeds limit',
    INVALID_TYPE: 'Unsupported file format',
    NETWORK_ERROR: 'Network connection error',
  }
};
```

### 3. 日誌記錄
```javascript
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data);
    // 發送到日誌服務
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
    // 發送到錯誤追蹤服務 (如 Sentry)
  }
};

// 使用
logger.info('上傳任務開始', { taskId, fileCount: files.length });
logger.error('上傳失敗', error);
```

---

## 📊 監控指標

### 關鍵指標

1. **上傳成功率**
   ```javascript
   const successRate = (successFiles / totalFiles) * 100;
   ```

2. **平均上傳時間**
   ```javascript
   const avgTime = (endTime - startTime) / totalFiles;
   ```

3. **並發任務數**
   ```javascript
   const concurrentTasks = Object.values(uploadTasks)
     .filter(t => t.status === 'processing').length;
   ```

4. **錯誤類型分布**
   ```javascript
   const errorStats = tasks.reduce((acc, task) => {
     task.files.forEach(file => {
       if (file.error) {
         acc[file.error] = (acc[file.error] || 0) + 1;
       }
     });
     return acc;
   }, {});
   ```

---

## 🔮 未來改進方向

### 短期 (1-2 週)

1. **斷點續傳**
   - 支援大檔案分片上傳
   - 網路中斷後自動恢復

2. **批次操作**
   - 批次刪除任務記錄
   - 批次重試失敗檔案

3. **進度通知**
   - 瀏覽器通知
   - Email 通知（大批量上傳完成時）

### 中期 (1-2 月)

1. **智慧建議優化**
   - 使用 AI 模型提升檔案相似度判斷
   - 學習使用者的刪除偏好

2. **協作功能**
   - 檔案上傳權限管理
   - 審核流程（上傳後需審核才發布）

3. **進階分析**
   - 上傳趨勢圖表
   - 熱門檔案類別分析

### 長期 (3-6 月)

1. **AI 輔助**
   - 自動標籤和分類
   - 自動提取摘要

2. **版本控制**
   - 檔案版本歷史
   - 回滾到舊版本

3. **企業級功能**
   - 配額管理
   - 審計日誌
   - SSO 單點登入

---

## 📚 參考資料

### 技術文檔
- [React Hooks 文檔](https://react.dev/reference/react)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### 相關庫
- [react-dropzone](https://react-dropzone.js.org/) - 檔案拖放
- [bull](https://github.com/OptimalBits/bull) - Redis 訊息佇列
- [multer](https://github.com/expressjs/multer) - Node.js 檔案上傳
- [axios](https://axios-http.com/) - HTTP 客戶端

### 最佳實踐
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals)
- [MDN Web Docs](https://developer.mozilla.org/)
- [React 效能優化](https://react.dev/learn/render-and-commit)

---

## 📞 支援與維護

### 常見問題

**Q: 上傳進度卡住不動？**
A: 檢查瀏覽器控制台是否有錯誤，確認網路連線，重新整理頁面恢復進度。

**Q: 檔案上傳後在列表中看不到？**
A: 確認檔案處理狀態為「完成」，檢查分類篩選是否正確。

**Q: 可以同時上傳多少個檔案？**
A: 建議單次不超過 50 個，每個檔案不超過 50MB。

**Q: 如何取消正在進行的上傳？**
A: 目前不支援取消，但可以關閉頁面，後端會繼續處理。未來版本會加入取消功能。

### 聯絡方式
- GitHub Issues: [專案 Issues 頁面]
- Email: support@example.com
- 文檔: [線上文檔連結]

---

**文檔版本**: v1.0  
**最後更新**: 2025-10-17  
**維護者**: GitHub Copilot  
**狀態**: ✅ 已實現並測試

