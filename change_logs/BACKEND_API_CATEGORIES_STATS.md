# 🏷️ 分類管理 & 📊 統計活動 API 文件

## 分類管理 API

### 1. 取得分類列表

#### 基本資訊
- **端點**: `GET /api/categories`
- **權限**: viewer (1)
- **說明**: 取得所有分類及其檔案數量統計

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
    "categories": [
      {
        "id": 1,
        "name": "規章制度",
        "color": "blue",
        "fileCount": 15,
        "createdAt": "2025-10-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "請假相關",
        "color": "green",
        "fileCount": 12,
        "createdAt": "2025-10-01T00:00:00Z"
      },
      {
        "id": 3,
        "name": "薪資福利",
        "color": "yellow",
        "fileCount": 18,
        "createdAt": "2025-10-01T00:00:00Z"
      },
      {
        "id": 4,
        "name": "未分類",
        "color": "gray",
        "fileCount": 3,
        "createdAt": "2025-10-01T00:00:00Z"
      }
    ],
    "total": 4
  }
}
```

#### 實作細節

```javascript
async function getCategories(req, res) {
  try {
    // 1. 驗證 Token
    await verifyToken(req.headers.authorization);
    
    // 2. 查詢分類並統計檔案數
    const categories = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.color,
        c.created_at,
        COUNT(f.id) as file_count
      FROM categories c
      LEFT JOIN files f ON c.name = f.category
      GROUP BY c.id
      ORDER BY c.id ASC
    `);
    
    // 3. 返回結果
    return res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          fileCount: cat.file_count,
          createdAt: cat.created_at
        })),
        total: categories.length
      }
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得分類失敗' 
    });
  }
}
```

---

### 2. 新增分類

#### 基本資訊
- **端點**: `POST /api/categories`
- **權限**: manager (2)
- **說明**: 建立新的分類

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "教育訓練",
  "color": "purple"
}
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| name | string | ✅ | 分類名稱 |
| color | string | ❌ | 分類顏色 (預設 'gray') |

#### 支援的顏色

```javascript
const ALLOWED_COLORS = [
  'gray', 'red', 'orange', 'yellow', 'green', 
  'teal', 'blue', 'indigo', 'purple', 'pink'
];
```

#### 回應範例

**成功回應 (201)**:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": 5,
      "name": "教育訓練",
      "color": "purple",
      "fileCount": 0,
      "createdAt": "2025-10-18T14:30:00Z"
    }
  },
  "message": "分類已建立"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "分類名稱已存在"
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
async function addCategory(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role === 'viewer') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 驗證參數
    const { name, color } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: '分類名稱不能為空' 
      });
    }
    
    // 3. 檢查重複
    const existing = await db.categories.findOne({ name: name });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: '分類名稱已存在' 
      });
    }
    
    // 4. 驗證顏色
    const allowedColors = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink'];
    const categoryColor = allowedColors.includes(color) ? color : 'gray';
    
    // 5. 建立分類
    const category = await db.categories.create({
      name: name,
      color: categoryColor,
      created_at: new Date()
    });
    
    // 6. 記錄活動
    await db.activities.create({
      type: 'category_add',
      user_id: user.id,
      category_name: name,
      timestamp: new Date()
    });
    
    // 7. 返回結果
    return res.status(201).json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          color: category.color,
          fileCount: 0,
          createdAt: category.created_at
        }
      },
      message: '分類已建立'
    });
    
  } catch (error) {
    console.error('Add category error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '建立分類失敗' 
    });
  }
}
```

---

### 3. 刪除分類

#### 基本資訊
- **端點**: `DELETE /api/categories/:id`
- **權限**: manager (2)
- **說明**: 刪除指定分類（會將該分類的檔案移至「未分類」）

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
DELETE /api/categories/5
```

#### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "分類已刪除，相關檔案已移至「未分類」"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "無法刪除「未分類」分類"
}
```

**失敗回應 (404)**:
```json
{
  "success": false,
  "message": "找不到指定的分類"
}
```

#### 實作細節

```javascript
async function deleteCategory(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role === 'viewer') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足，此操作需要更高權限' 
      });
    }
    
    // 2. 查詢分類
    const category = await db.categories.findOne({ id: req.params.id });
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的分類' 
      });
    }
    
    // 3. 防止刪除「未分類」
    if (category.name === '未分類') {
      return res.status(400).json({ 
        success: false, 
        message: '無法刪除「未分類」分類' 
      });
    }
    
    // 4. 使用 Transaction 確保資料一致性
    await db.transaction(async (trx) => {
      // 4.1 將該分類的所有檔案移至「未分類」
      await trx.files.update(
        { category: category.name },
        { category: '未分類' }
      );
      
      // 4.2 刪除分類
      await trx.categories.delete({ id: req.params.id });
    });
    
    // 5. 記錄活動
    await db.activities.create({
      type: 'category_delete',
      user_id: user.id,
      category_name: category.name,
      timestamp: new Date()
    });
    
    // 6. 返回結果
    return res.json({
      success: true,
      message: '分類已刪除，相關檔案已移至「未分類」'
    });
    
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '刪除分類失敗' 
    });
  }
}
```

---

## 統計與活動 API

### 4. 取得統計資料

#### 基本資訊
- **端點**: `GET /api/statistics`
- **權限**: viewer (1)
- **說明**: 取得系統統計資料（檔案數、查詢數等）

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
    "totalFiles": 48,
    "totalSize": "125.6 MB",
    "totalSizeBytes": 131727360,
    "monthlyQueries": 1234,
    "monthlyUploads": 18,
    "activeUsers": 12,
    "categoryBreakdown": {
      "規章制度": 15,
      "請假相關": 12,
      "薪資福利": 18,
      "未分類": 3
    },
    "recentTrend": {
      "thisMonth": 18,
      "lastMonth": 15,
      "growth": "+20%"
    },
    "systemStatus": "running",
    "lastBackup": "2025-10-17T02:00:00Z",
    "storageUsage": {
      "used": "125.6 MB",
      "total": "10 GB",
      "percentage": 1.23
    }
  }
}
```

#### 實作細節

```javascript
async function getStatistics(req, res) {
  try {
    // 1. 驗證 Token
    await verifyToken(req.headers.authorization);
    
    // 2. 查詢統計資料
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(size_bytes) as total_size
      FROM files
    `);
    
    const categoryStats = await db.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM files
      GROUP BY category
    `);
    
    const monthlyUploads = await db.query(`
      SELECT COUNT(*) as count
      FROM files
      WHERE upload_date >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const monthlyQueries = await db.query(`
      SELECT COUNT(*) as count
      FROM query_logs
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    
    const activeUsers = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM activities
      WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    // 3. 格式化資料
    const categoryBreakdown = {};
    categoryStats.forEach(cat => {
      categoryBreakdown[cat.category] = cat.count;
    });
    
    // 4. 返回結果
    return res.json({
      success: true,
      data: {
        totalFiles: stats[0].total_files,
        totalSize: formatBytes(stats[0].total_size),
        totalSizeBytes: stats[0].total_size,
        monthlyQueries: monthlyQueries[0].count,
        monthlyUploads: monthlyUploads[0].count,
        activeUsers: activeUsers[0].count,
        categoryBreakdown: categoryBreakdown,
        systemStatus: 'running',
        lastBackup: await getLastBackupTime(),
        storageUsage: await getStorageUsage()
      }
    });
    
  } catch (error) {
    console.error('Get statistics error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得統計資料失敗' 
    });
  }
}
```

---

### 5. 取得活動記錄

#### 基本資訊
- **端點**: `GET /api/activities`
- **權限**: viewer (1)
- **說明**: 取得最近的系統活動記錄

#### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
GET /api/activities?limit=20&type=upload
```

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| limit | number | ❌ | 10 | 返回數量 |
| type | string | ❌ | - | 活動類型篩選 |

#### 活動類型

```javascript
const ACTIVITY_TYPES = {
  'upload': '上傳檔案',
  'delete': '刪除檔案',
  'download': '下載檔案',
  'batch_upload': '批次上傳',
  'category_add': '新增分類',
  'category_delete': '刪除分類',
  'user_add': '新增使用者',
  'user_update': '更新使用者',
  'user_delete': '刪除使用者',
  'settings_update': '更新系統設定',
  'backup_create': '建立備份',
  'backup_restore': '還原備份'
};
```

#### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "type": "upload",
        "typeName": "上傳檔案",
        "user": "admin",
        "userName": "系統管理員",
        "fileName": "人事規章.pdf",
        "timestamp": "2025-10-18T14:30:00Z",
        "details": {
          "fileId": 123,
          "category": "規章制度",
          "size": "2.4 MB"
        }
      },
      {
        "id": 2,
        "type": "category_add",
        "typeName": "新增分類",
        "user": "admin",
        "userName": "系統管理員",
        "categoryName": "教育訓練",
        "timestamp": "2025-10-18T14:25:00Z"
      },
      {
        "id": 3,
        "type": "batch_upload",
        "typeName": "批次上傳",
        "user": "hr_manager",
        "userName": "人事主管",
        "details": "上傳 14/15 個檔案",
        "timestamp": "2025-10-18T14:20:00Z"
      }
    ],
    "total": 3
  }
}
```

#### 實作細節

```javascript
async function getRecentActivities(req, res) {
  try {
    // 1. 驗證 Token
    await verifyToken(req.headers.authorization);
    
    // 2. 建立查詢條件
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type;
    
    let query = `
      SELECT 
        a.id,
        a.type,
        a.timestamp,
        a.file_name,
        a.category_name,
        a.details,
        u.username,
        u.name as user_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    
    if (type) {
      query += ` WHERE a.type = '${type}'`;
    }
    
    query += ` ORDER BY a.timestamp DESC LIMIT ${limit}`;
    
    // 3. 查詢活動
    const activities = await db.query(query);
    
    // 4. 活動類型對應
    const activityTypeNames = {
      'upload': '上傳檔案',
      'delete': '刪除檔案',
      'download': '下載檔案',
      'batch_upload': '批次上傳',
      'category_add': '新增分類',
      'category_delete': '刪除分類',
      'user_add': '新增使用者',
      'user_update': '更新使用者',
      'user_delete': '刪除使用者',
      'settings_update': '更新系統設定',
      'backup_create': '建立備份',
      'backup_restore': '還原備份'
    };
    
    // 5. 格式化回應
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      typeName: activityTypeNames[activity.type] || activity.type,
      user: activity.username,
      userName: activity.user_name,
      fileName: activity.file_name,
      categoryName: activity.category_name,
      timestamp: activity.timestamp,
      details: activity.details
    }));
    
    return res.json({
      success: true,
      data: {
        activities: formattedActivities,
        total: formattedActivities.length
      }
    });
    
  } catch (error) {
    console.error('Get activities error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '取得活動記錄失敗' 
    });
  }
}
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
