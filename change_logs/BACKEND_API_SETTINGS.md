# ⚙️ 系統設定 & 備份 API 文件

## 系統設定 API

### 1. 取得系統設定

#### 基本資訊
- **端點**: `GET /api/settings`
- **權限**: viewer (1)
- **說明**: 取得當前系統設定

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

#### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "aiModel": {
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 2000,
      "topP": 0.9,
      "tone": "professional"
    },
    "knowledgeBase": {
      "similarityThreshold": 0.75,
      "maxRetrievalDocs": 5,
      "autoCleanupDays": 90,
      "indexUpdateFrequency": "daily"
    },
    "notifications": {
      "emailNotifications": true,
      "uploadSuccessNotif": true,
      "uploadFailNotif": true,
      "storageWarning": true,
      "weeklyReport": false
    },
    "backup": {
      "autoBackup": true,
      "backupFrequency": "weekly",
      "backupRetentionDays": 30
    }
  }
}
```

#### 實作細節

```javascript
async function getSettings(req, res) {
  try {
    // 1. 驗證 Token
    await verifyToken(req.headers.authorization);
    
    // 2. 從資料庫讀取設定
    const settings = await db.settings.findOne({ id: 1 });
    
    if (!settings) {
      // 如果沒有設定，返回預設值
      return res.json({
        success: true,
        data: getDefaultSettings()
      });
    }
    
    // 3. 格式化回應
    return res.json({
      success: true,
      data: {
        aiModel: {
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.max_tokens,
          topP: settings.top_p,
          tone: settings.tone
        },
        knowledgeBase: {
          similarityThreshold: settings.similarity_threshold,
          maxRetrievalDocs: settings.max_retrieval_docs,
          autoCleanupDays: settings.auto_cleanup_days,
          indexUpdateFrequency: settings.index_update_frequency
        },
        notifications: {
          emailNotifications: settings.email_notifications,
          uploadSuccessNotif: settings.upload_success_notif,
          uploadFailNotif: settings.upload_fail_notif,
          storageWarning: settings.storage_warning,
          weeklyReport: settings.weekly_report
        },
        backup: {
          autoBackup: settings.auto_backup,
          backupFrequency: settings.backup_frequency,
          backupRetentionDays: settings.backup_retention_days
        }
      }
    });
    
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得系統設定失敗' 
    });
  }
}

// 預設設定
function getDefaultSettings() {
  return {
    aiModel: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 0.9,
      tone: 'professional'
    },
    knowledgeBase: {
      similarityThreshold: 0.75,
      maxRetrievalDocs: 5,
      autoCleanupDays: 90,
      indexUpdateFrequency: 'daily'
    },
    notifications: {
      emailNotifications: true,
      uploadSuccessNotif: true,
      uploadFailNotif: true,
      storageWarning: true,
      weeklyReport: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'weekly',
      backupRetentionDays: 30
    }
  };
}
```

---

### 2. 更新系統設定

#### 基本資訊
- **端點**: `PUT /api/settings`
- **權限**: admin (3)
- **說明**: 更新系統設定

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "model": "gpt-4-turbo",
  "temperature": 0.5,
  "maxTokens": 3000,
  "topP": 0.95,
  "tone": "friendly",
  "similarityThreshold": 0.8,
  "maxRetrievalDocs": 10,
  "autoCleanupDays": 60,
  "indexUpdateFrequency": "hourly",
  "emailNotifications": true,
  "uploadSuccessNotif": false,
  "uploadFailNotif": true,
  "storageWarning": true,
  "weeklyReport": true,
  "autoBackup": true,
  "backupFrequency": "daily"
}
```

#### 設定欄位說明

**AI 模型設定**:
| 欄位 | 類型 | 範圍 | 說明 |
|------|------|------|------|
| model | string | gpt-4, gpt-4-turbo, gpt-3.5-turbo | AI 模型選擇 |
| temperature | number | 0.0 - 1.0 | 生成溫度（創造性） |
| maxTokens | number | 100 - 4000 | 最大 Token 數 |
| topP | number | 0.0 - 1.0 | 核心採樣參數 |
| tone | string | professional, friendly, concise | 回應語氣 |

**知識庫設定**:
| 欄位 | 類型 | 範圍 | 說明 |
|------|------|------|------|
| similarityThreshold | number | 0.0 - 1.0 | 相似度閾值 |
| maxRetrievalDocs | number | 1 - 20 | 最大檢索文件數 |
| autoCleanupDays | number | 30 - 365 | 自動清理天數 |
| indexUpdateFrequency | string | hourly, daily, weekly | 索引更新頻率 |

**通知設定**:
| 欄位 | 類型 | 說明 |
|------|------|------|
| emailNotifications | boolean | 啟用 Email 通知 |
| uploadSuccessNotif | boolean | 上傳成功通知 |
| uploadFailNotif | boolean | 上傳失敗通知 |
| storageWarning | boolean | 儲存空間警告 |
| weeklyReport | boolean | 每週報告 |

**備份設定**:
| 欄位 | 類型 | 範圍 | 說明 |
|------|------|------|------|
| autoBackup | boolean | - | 自動備份 |
| backupFrequency | string | daily, weekly, monthly | 備份頻率 |

#### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "設定已儲存"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "溫度參數必須在 0.0 到 1.0 之間"
}
```

**失敗回應 (403)**:
```json
{
  "success": false,
  "message": "權限不足，此操作需要更高權限"
}
```

#### 實作細節

```javascript
async function updateSettings(req, res) {
  try {
    // 1. 權限檢查：只有 admin 可以修改設定
    const user = await verifyToken(req.headers.authorization);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 驗證參數
    const settings = req.body;
    const validation = validateSettings(settings);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }
    
    // 3. 更新資料庫
    await db.settings.upsert({
      id: 1,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      tone: settings.tone,
      similarity_threshold: settings.similarityThreshold,
      max_retrieval_docs: settings.maxRetrievalDocs,
      auto_cleanup_days: settings.autoCleanupDays,
      index_update_frequency: settings.indexUpdateFrequency,
      email_notifications: settings.emailNotifications,
      upload_success_notif: settings.uploadSuccessNotif,
      upload_fail_notif: settings.uploadFailNotif,
      storage_warning: settings.storageWarning,
      weekly_report: settings.weeklyReport,
      auto_backup: settings.autoBackup,
      backup_frequency: settings.backupFrequency,
      updated_at: new Date()
    });
    
    // 4. 記錄活動
    await db.activities.create({
      type: 'settings_update',
      user_id: user.id,
      timestamp: new Date()
    });
    
    // 5. 觸發相關服務更新（如果有的話）
    await refreshAIService(settings);
    await updateBackupSchedule(settings.backupFrequency);
    
    return res.json({
      success: true,
      message: '設定已儲存'
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '儲存設定失敗' 
    });
  }
}

// 驗證設定
function validateSettings(settings) {
  // 驗證溫度
  if (settings.temperature !== undefined) {
    if (settings.temperature < 0 || settings.temperature > 1) {
      return { valid: false, message: '溫度參數必須在 0.0 到 1.0 之間' };
    }
  }
  
  // 驗證 topP
  if (settings.topP !== undefined) {
    if (settings.topP < 0 || settings.topP > 1) {
      return { valid: false, message: 'Top P 參數必須在 0.0 到 1.0 之間' };
    }
  }
  
  // 驗證 maxTokens
  if (settings.maxTokens !== undefined) {
    if (settings.maxTokens < 100 || settings.maxTokens > 4000) {
      return { valid: false, message: 'Max Tokens 必須在 100 到 4000 之間' };
    }
  }
  
  // 驗證相似度閾值
  if (settings.similarityThreshold !== undefined) {
    if (settings.similarityThreshold < 0 || settings.similarityThreshold > 1) {
      return { valid: false, message: '相似度閾值必須在 0.0 到 1.0 之間' };
    }
  }
  
  // 驗證模型
  if (settings.model !== undefined) {
    const allowedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    if (!allowedModels.includes(settings.model)) {
      return { valid: false, message: '無效的模型選擇' };
    }
  }
  
  // 驗證頻率
  if (settings.indexUpdateFrequency !== undefined) {
    const allowedFrequencies = ['hourly', 'daily', 'weekly'];
    if (!allowedFrequencies.includes(settings.indexUpdateFrequency)) {
      return { valid: false, message: '無效的索引更新頻率' };
    }
  }
  
  if (settings.backupFrequency !== undefined) {
    const allowedFrequencies = ['daily', 'weekly', 'monthly'];
    if (!allowedFrequencies.includes(settings.backupFrequency)) {
      return { valid: false, message: '無效的備份頻率' };
    }
  }
  
  return { valid: true };
}
```

---

## 備份管理 API

### 3. 取得備份記錄

#### 基本資訊
- **端點**: `GET /api/backups`
- **權限**: admin (3)
- **說明**: 取得系統備份記錄

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
GET /api/backups?limit=10
```

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| limit | number | ❌ | 10 | 返回數量 |

#### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "id": 1,
        "fileName": "backup-2025-10-18-02-00.zip",
        "size": "45.2 MB",
        "sizeBytes": 47398912,
        "createdAt": "2025-10-18T02:00:00Z",
        "type": "auto",
        "status": "completed",
        "fileCount": 48,
        "downloadUrl": "/api/backups/1/download"
      },
      {
        "id": 2,
        "fileName": "backup-2025-10-11-02-00.zip",
        "size": "42.8 MB",
        "sizeBytes": 44892160,
        "createdAt": "2025-10-11T02:00:00Z",
        "type": "auto",
        "status": "completed",
        "fileCount": 45,
        "downloadUrl": "/api/backups/2/download"
      }
    ],
    "total": 2,
    "totalSize": "88.0 MB"
  }
}
```

#### 實作細節

```javascript
async function getBackupHistory(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 查詢備份記錄
    const limit = parseInt(req.query.limit) || 10;
    const backups = await db.backups.find({})
      .sort({ created_at: 'desc' })
      .limit(limit);
    
    // 3. 格式化回應
    const formattedBackups = backups.map(backup => ({
      id: backup.id,
      fileName: backup.file_name,
      size: formatBytes(backup.size_bytes),
      sizeBytes: backup.size_bytes,
      createdAt: backup.created_at,
      type: backup.type,
      status: backup.status,
      fileCount: backup.file_count,
      downloadUrl: `/api/backups/${backup.id}/download`
    }));
    
    // 4. 計算總大小
    const totalSize = backups.reduce((sum, b) => sum + b.size_bytes, 0);
    
    return res.json({
      success: true,
      data: {
        backups: formattedBackups,
        total: formattedBackups.length,
        totalSize: formatBytes(totalSize)
      }
    });
    
  } catch (error) {
    console.error('Get backup history error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得備份記錄失敗' 
    });
  }
}
```

---

### 4. 建立備份

#### 基本資訊
- **端點**: `POST /api/backups`
- **權限**: admin (3)
- **說明**: 手動建立系統備份

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**: 無

#### 回應範例

**成功回應 (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "backupId": 3,
    "status": "processing",
    "message": "備份任務已建立，正在處理中"
  }
}
```

#### 實作細節

```javascript
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

async function createBackup(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 建立備份記錄
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.zip`;
    
    const backup = await db.backups.create({
      file_name: fileName,
      type: 'manual',
      status: 'processing',
      created_at: new Date(),
      created_by: user.id
    });
    
    // 3. 立即返回（非同步處理）
    res.status(202).json({
      success: true,
      data: {
        backupId: backup.id,
        status: 'processing',
        message: '備份任務已建立，正在處理中'
      }
    });
    
    // 4. 背景處理備份
    processBackup(backup.id, fileName, user.id);
    
  } catch (error) {
    console.error('Create backup error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '建立備份失敗' 
    });
  }
}

// 背景處理備份
async function processBackup(backupId, fileName, userId) {
  try {
    const backupPath = path.join(__dirname, '../backups', fileName);
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', async () => {
      // 備份完成
      const stats = fs.statSync(backupPath);
      
      await db.backups.update({ id: backupId }, {
        status: 'completed',
        size_bytes: stats.size,
        file_count: await db.files.count({}),
        completed_at: new Date()
      });
      
      // 記錄活動
      await db.activities.create({
        type: 'backup_create',
        user_id: userId,
        details: `建立備份: ${fileName}`,
        timestamp: new Date()
      });
      
      // 清理舊備份（根據保留設定）
      await cleanupOldBackups();
    });
    
    archive.on('error', async (err) => {
      console.error('Archive error:', err);
      
      await db.backups.update({ id: backupId }, {
        status: 'failed',
        error_message: err.message
      });
    });
    
    archive.pipe(output);
    
    // 添加檔案到備份
    const files = await db.files.find({});
    for (const file of files) {
      const filePath = path.join(__dirname, '..', file.file_path);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file.name });
      }
    }
    
    // 添加資料庫備份
    const dbBackup = await createDatabaseBackup();
    archive.append(JSON.stringify(dbBackup, null, 2), { name: 'database.json' });
    
    // 完成打包
    await archive.finalize();
    
  } catch (error) {
    console.error('Process backup error:', error);
    
    await db.backups.update({ id: backupId }, {
      status: 'failed',
      error_message: error.message
    });
  }
}

// 建立資料庫備份
async function createDatabaseBackup() {
  return {
    users: await db.users.find({}),
    categories: await db.categories.find({}),
    files: await db.files.find({}),
    settings: await db.settings.findOne({ id: 1 }),
    activities: await db.activities.find({}).limit(1000),
    exportDate: new Date().toISOString()
  };
}
```

---

### 5. 還原備份

#### 基本資訊
- **端點**: `POST /api/backups/:id/restore`
- **權限**: admin (3)
- **說明**: 從備份還原系統

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
POST /api/backups/1/restore
```

#### 回應範例

**成功回應 (202 Accepted)**:
```json
{
  "success": true,
  "message": "還原任務已建立，系統將在完成後自動重啟"
}
```

**警告**: 還原操作會覆蓋現有資料，建議在執行前先建立當前備份。

#### 實作細節

```javascript
async function restoreBackup(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 查詢備份
    const backup = await db.backups.findOne({ id: req.params.id });
    if (!backup) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的備份' 
      });
    }
    
    if (backup.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: '此備份未完成或已損壞' 
      });
    }
    
    // 3. 立即返回
    res.status(202).json({
      success: true,
      message: '還原任務已建立，系統將在完成後自動重啟'
    });
    
    // 4. 背景處理還原
    processRestore(backup.id, backup.file_name, user.id);
    
  } catch (error) {
    console.error('Restore backup error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '還原備份失敗' 
    });
  }
}
```

---

### 6. 取得系統資訊

#### 基本資訊
- **端點**: `GET /api/system/info`
- **權限**: admin (3)
- **說明**: 取得系統運行資訊

#### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "uptime": "15 天 3 小時",
    "serverTime": "2025-10-18T14:30:00Z",
    "database": {
      "type": "PostgreSQL",
      "version": "14.5",
      "size": "256 MB"
    },
    "storage": {
      "total": "10 GB",
      "used": "125.6 MB",
      "available": "9.88 GB",
      "percentage": 1.23
    },
    "performance": {
      "avgResponseTime": "120ms",
      "requestsPerMinute": 45,
      "errorRate": "0.02%"
    }
  }
}
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
