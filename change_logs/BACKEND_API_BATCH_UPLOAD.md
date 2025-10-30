# 📦 批次上傳 API 文件

## 1. 批次上傳檔案

### 基本資訊
- **端點**: `POST /api/files/batch-upload`
- **權限**: manager (2)
- **說明**: 批次上傳多個檔案，支援進度追蹤

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData)**:
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('files', file3);
formData.append('categoryMapping', JSON.stringify({
  '人事規章.pdf': '規章制度',
  '請假辦法.docx': '請假相關',
  '薪資說明.pdf': '薪資福利'
}));
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| files | File[] | ✅ | 檔案陣列 |
| categoryMapping | JSON | ✅ | 檔名對應分類的 JSON 字串 |

### 回應範例

**成功回應 (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "taskId": "task-abc123-def456",
    "totalFiles": 15,
    "status": "processing",
    "createdAt": "2025-10-18T14:30:00Z",
    "progressUrl": "/api/upload-tasks/task-abc123-def456"
  },
  "message": "批次上傳任務已建立，正在處理中"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "請至少選擇一個檔案"
}
```

### 實作細節

```javascript
async function batchUpload(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role === 'viewer') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足' 
      });
    }
    
    // 2. 驗證檔案
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '請至少選擇一個檔案' 
      });
    }
    
    // 3. 解析分類對應
    const categoryMapping = JSON.parse(req.body.categoryMapping);
    
    // 4. 建立上傳任務
    const taskId = `task-${uuidv4()}`;
    const task = await db.uploadTasks.create({
      id: taskId,
      user_id: user.id,
      total_files: files.length,
      completed_files: 0,
      failed_files: 0,
      status: 'processing',
      created_at: new Date()
    });
    
    // 5. 立即返回任務 ID（非同步處理）
    res.status(202).json({
      success: true,
      data: {
        taskId: taskId,
        totalFiles: files.length,
        status: 'processing',
        createdAt: task.created_at,
        progressUrl: `/api/upload-tasks/${taskId}`
      },
      message: '批次上傳任務已建立，正在處理中'
    });
    
    // 6. 背景處理上傳（使用 Queue 如 Bull, Kafka）
    processUploadTask(taskId, files, categoryMapping, user);
    
  } catch (error) {
    console.error('Batch upload error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '批次上傳失敗' 
    });
  }
}

// 背景處理函數
async function processUploadTask(taskId, files, categoryMapping, user) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // 1. 驗證檔案
      const validation = validateFile(file);
      if (!validation.valid) {
        results.push({
          fileName: file.originalname,
          status: 'failed',
          error: validation.error
        });
        
        // 更新失敗計數
        await db.uploadTasks.update(taskId, {
          failed_files: { increment: 1 }
        });
        continue;
      }
      
      // 2. 上傳檔案
      const uuid = uuidv4();
      const fileName = `${uuid}-${file.originalname}`;
      const filePath = `/uploads/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`;
      
      await uploadToStorage(file.buffer, filePath);
      
      // 3. 儲存到資料庫
      const fileRecord = await db.files.create({
        name: file.originalname,
        size_bytes: file.size,
        category: categoryMapping[file.originalname] || '未分類',
        uploader_id: user.id,
        file_type: file.originalname.split('.').pop().toLowerCase(),
        file_path: filePath,
        upload_date: new Date()
      });
      
      results.push({
        fileName: file.originalname,
        status: 'success',
        fileId: fileRecord.id
      });
      
      // 4. 更新完成計數
      await db.uploadTasks.update(taskId, {
        completed_files: { increment: 1 }
      });
      
    } catch (error) {
      console.error(`Upload failed for ${file.originalname}:`, error);
      
      results.push({
        fileName: file.originalname,
        status: 'failed',
        error: error.message
      });
      
      await db.uploadTasks.update(taskId, {
        failed_files: { increment: 1 }
      });
    }
    
    // 5. 更新進度
    const progress = Math.round(((i + 1) / files.length) * 100);
    await db.uploadTasks.update(taskId, {
      progress: progress
    });
  }
  
  // 6. 完成任務
  await db.uploadTasks.update(taskId, {
    status: 'completed',
    results: JSON.stringify(results),
    completed_at: new Date()
  });
  
  // 7. 記錄活動
  await db.activities.create({
    type: 'batch_upload',
    user_id: user.id,
    details: `上傳 ${results.filter(r => r.status === 'success').length}/${files.length} 個檔案`,
    timestamp: new Date()
  });
}
```

---

## 2. 取得上傳進度

### 基本資訊
- **端點**: `GET /api/upload-tasks/:taskId`
- **權限**: manager (2)
- **說明**: 查詢批次上傳任務的進度

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
GET /api/upload-tasks/task-abc123-def456
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| taskId | string | ✅ | 任務 ID |

### 回應範例

**處理中 (200)**:
```json
{
  "success": true,
  "data": {
    "taskId": "task-abc123-def456",
    "status": "processing",
    "progress": 60,
    "totalFiles": 15,
    "completedFiles": 9,
    "failedFiles": 0,
    "currentFile": "薪資計算說明.pdf",
    "createdAt": "2025-10-18T14:30:00Z",
    "estimatedTimeRemaining": "2分鐘"
  }
}
```

**已完成 (200)**:
```json
{
  "success": true,
  "data": {
    "taskId": "task-abc123-def456",
    "status": "completed",
    "progress": 100,
    "totalFiles": 15,
    "completedFiles": 14,
    "failedFiles": 1,
    "createdAt": "2025-10-18T14:30:00Z",
    "completedAt": "2025-10-18T14:35:00Z",
    "duration": "5分鐘",
    "results": [
      {
        "fileName": "人事規章.pdf",
        "status": "success",
        "fileId": 123
      },
      {
        "fileName": "損壞檔案.pdf",
        "status": "failed",
        "error": "檔案已損壞"
      }
    ]
  }
}
```

**失敗回應 (404)**:
```json
{
  "success": false,
  "message": "找不到指定的上傳任務"
}
```

### 實作細節

```javascript
async function getUploadProgress(req, res) {
  try {
    // 1. 驗證 Token
    const user = await verifyToken(req.headers.authorization);
    
    // 2. 查詢任務
    const task = await db.uploadTasks.findOne({ 
      id: req.params.taskId 
    });
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的上傳任務' 
      });
    }
    
    // 3. 檢查權限（只能查詢自己的任務，除非是 admin）
    if (task.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '無權查看此任務' 
      });
    }
    
    // 4. 計算進度
    const progress = Math.round((task.completed_files + task.failed_files) / task.total_files * 100);
    
    // 5. 返回結果
    const response = {
      taskId: task.id,
      status: task.status,
      progress: progress,
      totalFiles: task.total_files,
      completedFiles: task.completed_files,
      failedFiles: task.failed_files,
      createdAt: task.created_at
    };
    
    if (task.status === 'completed') {
      response.completedAt = task.completed_at;
      response.duration = formatDuration(task.created_at, task.completed_at);
      response.results = JSON.parse(task.results);
    } else {
      response.currentFile = task.current_file;
      response.estimatedTimeRemaining = estimateTimeRemaining(task);
    }
    
    return res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '查詢失敗' 
    });
  }
}
```

---

## 3. 取得使用者上傳任務

### 基本資訊
- **端點**: `GET /api/upload-tasks`
- **權限**: manager (2)
- **說明**: 取得當前使用者的所有上傳任務

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
GET /api/upload-tasks?status=completed&limit=10
```

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| status | string | ❌ | - | 任務狀態篩選 (processing, completed, failed) |
| limit | number | ❌ | 20 | 返回數量限制 |

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "task-abc123",
        "status": "completed",
        "totalFiles": 15,
        "completedFiles": 14,
        "failedFiles": 1,
        "progress": 100,
        "createdAt": "2025-10-18T14:30:00Z",
        "completedAt": "2025-10-18T14:35:00Z"
      },
      {
        "taskId": "task-def456",
        "status": "processing",
        "totalFiles": 20,
        "completedFiles": 12,
        "failedFiles": 0,
        "progress": 60,
        "createdAt": "2025-10-18T15:00:00Z"
      }
    ],
    "summary": {
      "total": 2,
      "processing": 1,
      "completed": 1,
      "failed": 0
    }
  }
}
```

### 實作細節

```javascript
async function getUserUploadTasks(req, res) {
  try {
    // 1. 驗證 Token
    const user = await verifyToken(req.headers.authorization);
    
    // 2. 建立查詢條件
    const query = { user_id: user.id };
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // 3. 查詢任務
    const tasks = await db.uploadTasks.find(query)
      .sort({ created_at: 'desc' })
      .limit(req.query.limit || 20);
    
    // 4. 格式化回應
    const formattedTasks = tasks.map(task => ({
      taskId: task.id,
      status: task.status,
      totalFiles: task.total_files,
      completedFiles: task.completed_files,
      failedFiles: task.failed_files,
      progress: Math.round((task.completed_files + task.failed_files) / task.total_files * 100),
      createdAt: task.created_at,
      completedAt: task.completed_at
    }));
    
    // 5. 統計資訊
    const summary = {
      total: tasks.length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length
    };
    
    return res.json({
      success: true,
      data: {
        tasks: formattedTasks,
        summary: summary
      }
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '查詢失敗' 
    });
  }
}
```

---

## 4. 刪除上傳任務

### 基本資訊
- **端點**: `DELETE /api/upload-tasks/:taskId`
- **權限**: manager (2)
- **說明**: 刪除已完成的上傳任務記錄

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
DELETE /api/upload-tasks/task-abc123-def456
```

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "上傳任務已刪除"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "無法刪除進行中的任務"
}
```

### 實作細節

```javascript
async function deleteUploadTask(req, res) {
  try {
    // 1. 驗證 Token
    const user = await verifyToken(req.headers.authorization);
    
    // 2. 查詢任務
    const task = await db.uploadTasks.findOne({ 
      id: req.params.taskId 
    });
    
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的上傳任務' 
      });
    }
    
    // 3. 檢查權限
    if (task.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '無權刪除此任務' 
      });
    }
    
    // 4. 檢查任務狀態
    if (task.status === 'processing') {
      return res.status(400).json({ 
        success: false, 
        message: '無法刪除進行中的任務' 
      });
    }
    
    // 5. 刪除任務
    await db.uploadTasks.delete({ id: req.params.taskId });
    
    return res.json({
      success: true,
      message: '上傳任務已刪除'
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '刪除失敗' 
    });
  }
}
```

---

## 批次上傳最佳實踐

### 1. 使用訊息佇列

建議使用訊息佇列來處理批次上傳，避免阻塞主要請求:

```javascript
// 使用 Bull Queue (Redis-based)
const Queue = require('bull');
const uploadQueue = new Queue('file-upload', {
  redis: { host: 'localhost', port: 6379 }
});

// 添加任務到佇列
uploadQueue.add('batch-upload', {
  taskId: taskId,
  files: files,
  categoryMapping: categoryMapping,
  userId: user.id
});

// 處理任務
uploadQueue.process('batch-upload', async (job) => {
  const { taskId, files, categoryMapping, userId } = job.data;
  
  for (let i = 0; i < files.length; i++) {
    // 處理每個檔案
    await processFile(files[i], categoryMapping, userId);
    
    // 更新進度
    await job.progress((i + 1) / files.length * 100);
  }
  
  return { completed: true };
});
```

### 2. WebSocket 即時進度更新

```javascript
// 伺服器端
io.on('connection', (socket) => {
  socket.on('subscribe-task', (taskId) => {
    socket.join(`task-${taskId}`);
  });
});

// 上傳進度更新時
io.to(`task-${taskId}`).emit('progress-update', {
  progress: 60,
  currentFile: 'file.pdf'
});

// 前端
socket.on('progress-update', (data) => {
  console.log(`進度: ${data.progress}%`);
});
```

### 3. 錯誤重試機制

```javascript
const MAX_RETRY = 3;

async function uploadWithRetry(file, retries = 0) {
  try {
    return await uploadFile(file);
  } catch (error) {
    if (retries < MAX_RETRY) {
      console.log(`重試 ${retries + 1}/${MAX_RETRY}`);
      await delay(1000 * Math.pow(2, retries)); // 指數退避
      return uploadWithRetry(file, retries + 1);
    }
    throw error;
  }
}
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
