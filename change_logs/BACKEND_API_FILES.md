# 📁 檔案管理 API 文件

## 1. 取得檔案列表

### 基本資訊
- **端點**: `GET /api/files`
- **權限**: viewer (1)
- **說明**: 取得知識庫檔案列表，支援篩選、搜尋、排序和分頁

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```
GET /api/files?search=人事&category=規章制度&page=1&pageSize=10&sortBy=uploadDate&sortOrder=desc
```

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| search | string | ❌ | - | 搜尋關鍵字（檔名） |
| category | string | ❌ | - | 分類篩選 |
| page | number | ❌ | 1 | 頁碼 |
| pageSize | number | ❌ | 10 | 每頁筆數 |
| sortBy | string | ❌ | uploadDate | 排序欄位 (uploadDate, name, size) |
| sortOrder | string | ❌ | desc | 排序方向 (asc, desc) |

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": 1,
        "name": "人事規章.pdf",
        "size": "2.4 MB",
        "sizeBytes": 2516582,
        "uploadDate": "2025-10-15T10:30:00Z",
        "category": "規章制度",
        "uploader": "admin",
        "uploaderName": "系統管理員",
        "fileType": "pdf",
        "path": "/uploads/2025/10/abc123-人事規章.pdf",
        "downloadUrl": "/api/files/1/download"
      },
      {
        "id": 2,
        "name": "請假辦法.docx",
        "size": "890 KB",
        "sizeBytes": 911360,
        "uploadDate": "2025-10-14T09:15:00Z",
        "category": "請假相關",
        "uploader": "admin",
        "uploaderName": "系統管理員",
        "fileType": "docx",
        "path": "/uploads/2025/10/def456-請假辦法.docx",
        "downloadUrl": "/api/files/2/download"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 48,
      "totalPages": 5
    },
    "summary": {
      "totalFiles": 48,
      "totalSize": "125.6 MB",
      "categories": {
        "規章制度": 15,
        "請假相關": 12,
        "薪資福利": 18,
        "未分類": 3
      }
    }
  }
}
```

### 實作細節

```sql
-- SQL 查詢範例
SELECT 
  f.id,
  f.name,
  f.size_bytes,
  f.upload_date,
  f.category,
  f.uploader_id,
  u.name as uploader_name,
  f.file_type,
  f.file_path
FROM files f
LEFT JOIN users u ON f.uploader_id = u.id
WHERE 
  (f.name LIKE '%{search}%' OR '{search}' = '')
  AND (f.category = '{category}' OR '{category}' = '')
ORDER BY f.upload_date DESC
LIMIT {pageSize} OFFSET {(page-1) * pageSize};
```

---

## 2. 上傳檔案

### 基本資訊
- **端點**: `POST /api/files/upload`
- **權限**: manager (2)
- **說明**: 上傳單一檔案到知識庫

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData)**:
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('category', '規章制度');
formData.append('description', '人事相關規章說明文件');
```

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| file | File | ✅ | 檔案內容 |
| category | string | ✅ | 分類名稱 |
| description | string | ❌ | 檔案描述 |

### 支援的檔案類型

| 類型 | 副檔名 | 最大大小 |
|------|--------|---------|
| PDF | .pdf | 50 MB |
| Word | .doc, .docx | 20 MB |
| Excel | .xls, .xlsx | 20 MB |
| PowerPoint | .ppt, .pptx | 30 MB |
| 文字檔 | .txt, .md | 5 MB |

### 回應範例

**成功回應 (201)**:
```json
{
  "success": true,
  "data": {
    "file": {
      "id": 123,
      "name": "人事規章.pdf",
      "size": "2.4 MB",
      "sizeBytes": 2516582,
      "uploadDate": "2025-10-18T14:30:00Z",
      "category": "規章制度",
      "uploader": "admin",
      "fileType": "pdf",
      "path": "/uploads/2025/10/abc123-人事規章.pdf",
      "downloadUrl": "/api/files/123/download"
    }
  },
  "message": "檔案上傳成功"
}
```

**失敗回應 (400)**:
```json
{
  "success": false,
  "message": "不支援的檔案類型"
}
```

**失敗回應 (413)**:
```json
{
  "success": false,
  "message": "檔案大小超過限制 (最大 50 MB)"
}
```

### 實作細節

```javascript
// 後端處理流程
async function uploadFile(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role === 'viewer') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足' 
      });
    }
    
    // 2. 檔案驗證
    const file = req.file;
    const allowedTypes = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'md'];
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      return res.status(400).json({ 
        success: false, 
        message: '不支援的檔案類型' 
      });
    }
    
    // 3. 大小檢查
    const maxSizes = {
      pdf: 50 * 1024 * 1024,    // 50 MB
      docx: 20 * 1024 * 1024,   // 20 MB
      doc: 20 * 1024 * 1024,
      xlsx: 20 * 1024 * 1024,
      xls: 20 * 1024 * 1024,
      pptx: 30 * 1024 * 1024,
      ppt: 30 * 1024 * 1024,
      txt: 5 * 1024 * 1024,     // 5 MB
      md: 5 * 1024 * 1024
    };
    
    if (file.size > maxSizes[fileExt]) {
      return res.status(413).json({ 
        success: false, 
        message: `檔案大小超過限制 (最大 ${maxSizes[fileExt] / 1024 / 1024} MB)` 
      });
    }
    
    // 4. 病毒掃描（建議）
    const isSafe = await scanFile(file.buffer);
    if (!isSafe) {
      return res.status(400).json({ 
        success: false, 
        message: '檔案包含惡意內容' 
      });
    }
    
    // 5. 生成唯一檔名
    const uuid = uuidv4();
    const fileName = `${uuid}-${file.originalname}`;
    const filePath = `/uploads/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${fileName}`;
    
    // 6. 上傳到儲存服務 (S3, Azure Blob, etc.)
    await uploadToStorage(file.buffer, filePath);
    
    // 7. 儲存到資料庫
    const fileRecord = await db.files.create({
      name: file.originalname,
      size_bytes: file.size,
      category: req.body.category,
      uploader_id: user.id,
      file_type: fileExt,
      file_path: filePath,
      description: req.body.description,
      upload_date: new Date()
    });
    
    // 8. 記錄活動
    await db.activities.create({
      type: 'upload',
      user_id: user.id,
      file_id: fileRecord.id,
      file_name: file.originalname,
      timestamp: new Date()
    });
    
    // 9. 返回結果
    return res.status(201).json({
      success: true,
      data: { file: formatFileResponse(fileRecord) },
      message: '檔案上傳成功'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '上傳失敗' 
    });
  }
}
```

---

## 3. 刪除檔案

### 基本資訊
- **端點**: `DELETE /api/files/:id`
- **權限**: manager (2)
- **說明**: 從知識庫刪除指定檔案

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
DELETE /api/files/123
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | number | ✅ | 檔案 ID |

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "message": "檔案已刪除"
}
```

**失敗回應 (404)**:
```json
{
  "success": false,
  "message": "找不到指定的檔案"
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
async function deleteFile(req, res) {
  try {
    // 1. 權限檢查
    const user = await verifyToken(req.headers.authorization);
    if (user.role === 'viewer') {
      return res.status(403).json({ 
        success: false, 
        message: '權限不足' 
      });
    }
    
    // 2. 查詢檔案
    const file = await db.files.findOne({ id: req.params.id });
    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的檔案' 
      });
    }
    
    // 3. 從儲存服務刪除實體檔案
    await deleteFromStorage(file.file_path);
    
    // 4. 從資料庫刪除記錄
    await db.files.delete({ id: req.params.id });
    
    // 5. 記錄活動
    await db.activities.create({
      type: 'delete',
      user_id: user.id,
      file_name: file.name,
      timestamp: new Date()
    });
    
    // 6. 返回結果
    return res.json({
      success: true,
      message: '檔案已刪除'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '刪除失敗' 
    });
  }
}
```

---

## 4. 下載檔案

### 基本資訊
- **端點**: `GET /api/files/:id/download`
- **權限**: viewer (1)
- **說明**: 下載指定檔案

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
```
GET /api/files/123/download
```

### 回應範例

**成功回應 (200)**:
```
Content-Type: application/pdf (或其他檔案類型)
Content-Disposition: attachment; filename="人事規章.pdf"
Content-Length: 2516582

[檔案二進位內容]
```

**失敗回應 (404)**:
```json
{
  "success": false,
  "message": "找不到指定的檔案"
}
```

### 實作細節

```javascript
async function downloadFile(req, res) {
  try {
    // 1. 驗證 Token
    const user = await verifyToken(req.headers.authorization);
    
    // 2. 查詢檔案
    const file = await db.files.findOne({ id: req.params.id });
    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: '找不到指定的檔案' 
      });
    }
    
    // 3. 從儲存服務取得檔案
    const fileBuffer = await getFromStorage(file.file_path);
    
    // 4. 設定 Content-Type
    const contentTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      txt: 'text/plain',
      md: 'text/markdown'
    };
    
    // 5. 設定回應 Headers
    res.setHeader('Content-Type', contentTypes[file.file_type]);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', file.size_bytes);
    
    // 6. 記錄下載活動
    await db.activities.create({
      type: 'download',
      user_id: user.id,
      file_id: file.id,
      file_name: file.name,
      timestamp: new Date()
    });
    
    // 7. 返回檔案
    return res.send(fileBuffer);
    
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '下載失敗' 
    });
  }
}
```

---

## 5. 檢查重複檔案

### 基本資訊
- **端點**: `POST /api/files/check-duplicates`
- **權限**: manager (2)
- **說明**: 檢查上傳的檔案是否已存在

### 請求參數

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "files": [
    {
      "name": "人事規章.pdf",
      "size": 2516582,
      "lastModified": 1697462400000
    },
    {
      "name": "請假辦法.docx",
      "size": 911360,
      "lastModified": 1697548800000
    }
  ]
}
```

### 回應範例

**成功回應 (200)**:
```json
{
  "success": true,
  "data": {
    "duplicates": [
      {
        "name": "人事規章.pdf",
        "isDuplicate": true,
        "existingFile": {
          "id": 1,
          "name": "人事規章.pdf",
          "uploadDate": "2025-10-15T10:30:00Z",
          "uploader": "admin"
        }
      },
      {
        "name": "請假辦法.docx",
        "isDuplicate": false
      }
    ],
    "summary": {
      "total": 2,
      "duplicateCount": 1,
      "newCount": 1
    }
  }
}
```

### 實作細節

```javascript
async function checkDuplicates(req, res) {
  try {
    const { files } = req.body;
    const results = [];
    
    for (const file of files) {
      // 檢查檔名和大小是否相同
      const existing = await db.files.findOne({
        name: file.name,
        size_bytes: file.size
      });
      
      results.push({
        name: file.name,
        isDuplicate: !!existing,
        existingFile: existing ? {
          id: existing.id,
          name: existing.name,
          uploadDate: existing.upload_date,
          uploader: existing.uploader_name
        } : undefined
      });
    }
    
    return res.json({
      success: true,
      data: {
        duplicates: results,
        summary: {
          total: files.length,
          duplicateCount: results.filter(r => r.isDuplicate).length,
          newCount: results.filter(r => !r.isDuplicate).length
        }
      }
    });
    
  } catch (error) {
    console.error('Check duplicates error:', error);
    return res.status(500).json({ 
      success: false, 
      message: '檢查失敗' 
    });
  }
}
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
