# 🔌 API 端點設計

> **重要**: 所有 API 端點必須與前端 `src/services/api/` 模組完全對應

## API 基礎路徑

```
開發環境: http://localhost:8000/api
生產環境: https://your-domain.com/api
```

---

## 1. 認證模組 (Auth)

### POST /api/auth/login
使用者登入

**前端對應**: `api/auth.js` → `login()`

```javascript
// 請求
{
  "username": "admin",
  "password": "admin123"
}

// 回應
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@ncku.edu.tw",
    "fullName": "系統管理員",
    "role": "super_admin",
    "isSuperAdmin": true,
    "department": {
      "id": 1,
      "name": "人事室",
      "code": "HR"
    }
  }
}
```

**FastAPI 實作**:
```python
@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    # 1. 驗證使用者
    user = await user_service.authenticate(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")
    
    # 2. 生成 JWT Token
    token = create_access_token(data={"sub": user.username, "user_id": user.id})
    
    # 3. 儲存 Session (Redis)
    await redis.setex(f"session:{user.id}", 86400, token)
    
    # 4. 記錄登入活動
    await activity_service.log_activity(
        db, user_id=user.id, action="login", 
        description=f"{user.username} 登入系統"
    )
    
    # 5. 更新最後登入時間
    await user_service.update_last_login(db, user.id)
    
    return LoginResponse(token=token, user=UserSchema.from_orm(user))
```

---

### POST /api/auth/logout
使用者登出

**前端對應**: `api/auth.js` → `logout()`

```javascript
// 請求 (需 Authorization Header)
Headers: { Authorization: "Bearer <token>" }

// 回應
{ "message": "登出成功" }
```

**FastAPI 實作**:
```python
@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db)
):
    # 1. 刪除 Redis Session
    await redis.delete(f"session:{current_user.id}")
    
    # 2. 記錄登出活動
    await activity_service.log_activity(
        db, user_id=current_user.id, action="logout",
        description=f"{current_user.username} 登出系統"
    )
    
    return {"message": "登出成功"}
```

---

### GET /api/auth/verify
驗證 Token

**前端對應**: `api/auth.js` → `verifyToken()`

```javascript
// 請求
Headers: { Authorization: "Bearer <token>" }

// 回應
{
  "valid": true,
  "user": { /* 使用者資訊 */ }
}
```

---

## 2. 檔案管理模組 (Files)

### GET /api/files
取得檔案列表

**前端對應**: `api/files.js` → `getFiles()`

```javascript
// 請求 (查詢參數)
?page=1&limit=10&category_id=1&search=規章&sort=created_at&order=desc

// 回應
{
  "items": [
    {
      "id": 1,
      "filename": "personnel_rules_v1.pdf",
      "originalFilename": "人事規章.pdf",
      "fileSize": 2048576,
      "fileType": "pdf",
      "category": {
        "id": 1,
        "name": "人事規章",
        "color": "blue"
      },
      "uploader": {
        "id": 2,
        "username": "hr_admin",
        "fullName": "人事管理員"
      },
      "status": "completed",
      "isVectorized": true,
      "vectorCount": 45,
      "downloadCount": 12,
      "createdAt": "2025-10-15T10:30:00Z",
      "updatedAt": "2025-10-15T10:35:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "pages": 16
}
```

**FastAPI 實作**:
```python
@router.get("/", response_model=FileListResponse)
async def get_files(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    sort: str = Query("created_at", regex="^(filename|created_at|file_size)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. 建立基礎查詢 (自動過濾處室)
    query = select(File).where(File.department_id == current_user.department_id)
    
    # 2. 分類篩選
    if category_id:
        query = query.where(File.category_id == category_id)
    
    # 3. 搜尋
    if search:
        query = query.where(
            or_(
                File.original_filename.ilike(f"%{search}%"),
                File.description.ilike(f"%{search}%")
            )
        )
    
    # 4. 排序
    order_by = desc(getattr(File, sort)) if order == "desc" else asc(getattr(File, sort))
    query = query.order_by(order_by)
    
    # 5. 分頁
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.offset((page - 1) * limit).limit(limit)
    
    # 6. 執行查詢
    result = await db.execute(query)
    files = result.scalars().all()
    
    return FileListResponse(
        items=[FileSchema.from_orm(f) for f in files],
        total=total,
        page=page,
        pages=math.ceil(total / limit)
    )
```

---

### POST /api/files/upload
上傳檔案

**前端對應**: `api/files.js` → `uploadFile()`

```javascript
// 請求 (multipart/form-data)
FormData {
  file: File,
  category_id: 1,
  description: "2025年人事規章"
}

// 回應
{
  "id": 123,
  "filename": "20251031_123456_personnel_rules.pdf",
  "originalFilename": "人事規章.pdf",
  "fileSize": 2048576,
  "status": "pending",
  "message": "檔案上傳成功，正在處理中..."
}
```

**FastAPI 實作**:
```python
@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    category_id: int = Form(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    # 1. 驗證檔案
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="檔案過大")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="不支援的檔案格式")
    
    # 2. 生成唯一檔名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}_{file.filename}"
    
    # 3. 儲存實體檔案
    file_path = os.path.join(settings.UPLOAD_DIR, str(current_user.department_id), unique_filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # 4. 建立資料庫記錄
    db_file = File(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file.size,
        file_type=ext[1:],
        mime_type=file.content_type,
        category_id=category_id,
        department_id=current_user.department_id,
        uploader_id=current_user.id,
        description=description,
        status="pending"
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    # 5. 觸發背景處理任務 (Celery)
    process_file_task.delay(db_file.id)
    
    # 6. 記錄活動
    await activity_service.log_activity(
        db, user_id=current_user.id, action="upload",
        entity_type="file", entity_id=db_file.id,
        description=f"上傳檔案: {file.filename}"
    )
    
    return FileUploadResponse.from_orm(db_file)
```

---

### GET /api/files/{file_id}
取得檔案詳情

**前端對應**: `api/files.js` → `getFile()`

---

### PUT /api/files/{file_id}
更新檔案資訊

**前端對應**: `api/files.js` → `updateFile()`

---

### DELETE /api/files/{file_id}
刪除檔案

**前端對應**: `api/files.js` → `deleteFile()`

```python
@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. 取得檔案
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="檔案不存在")
    
    # 2. 權限檢查
    if file.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="無權限刪除此檔案")
    
    # 3. 刪除實體檔案
    if os.path.exists(file.file_path):
        os.remove(file.file_path)
    
    # 4. 刪除 Qdrant 向量
    if file.is_vectorized:
        await qdrant_service.delete_vectors(file_id)
    
    # 5. 刪除資料庫記錄
    await db.delete(file)
    await db.commit()
    
    # 6. 記錄活動
    await activity_service.log_activity(
        db, user_id=current_user.id, action="delete",
        entity_type="file", entity_id=file_id,
        description=f"刪除檔案: {file.original_filename}"
    )
    
    return {"message": "檔案已刪除"}
```

---

### GET /api/files/{file_id}/download
下載檔案

**前端對應**: `api/files.js` → `downloadFile()`

```python
@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. 取得檔案
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="檔案不存在")
    
    # 2. 權限檢查
    if file.department_id != current_user.department_id and not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="無權限下載此檔案")
    
    # 3. 更新下載次數
    file.download_count += 1
    file.last_accessed = datetime.now()
    await db.commit()
    
    # 4. 記錄活動
    await activity_service.log_activity(
        db, user_id=current_user.id, action="download",
        entity_type="file", entity_id=file_id,
        description=f"下載檔案: {file.original_filename}"
    )
    
    # 5. 返回檔案
    return FileResponse(
        path=file.file_path,
        filename=file.original_filename,
        media_type=file.mime_type
    )
```

---

## 3. 分類管理模組 (Categories)

### GET /api/categories
取得分類列表

**前端對應**: `api/categories.js` → `getCategories()`

```javascript
// 回應
{
  "items": [
    {
      "id": 1,
      "name": "人事規章",
      "color": "blue",
      "fileCount": 23,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /api/categories
新增分類

**前端對應**: `api/categories.js` → `createCategory()`

---

### PUT /api/categories/{category_id}
更新分類

**前端對應**: `api/categories.js` → `updateCategory()`

---

### DELETE /api/categories/{category_id}
刪除分類

**前端對應**: `api/categories.js` → `deleteCategory()`

---

### GET /api/categories/stats
分類統計

**前端對應**: `api/categories.js` → `getCategoryStats()`

```javascript
// 回應
{
  "stats": [
    {
      "id": 1,
      "name": "人事規章",
      "color": "blue",
      "fileCount": 23,
      "totalSize": 52428800,
      "percentage": 35.5
    }
  ]
}
```

---

## 4. 活動記錄模組 (Activities)

### GET /api/activities
取得活動記錄

**前端對應**: `api/activities.js` → `getActivities()`

```javascript
// 請求
?page=1&limit=20&action=upload&start_date=2025-10-01

// 回應
{
  "items": [
    {
      "id": 1001,
      "username": "hr_admin",
      "action": "upload",
      "description": "上傳檔案: 人事規章.pdf",
      "entityType": "file",
      "entityId": 123,
      "ipAddress": "192.168.1.100",
      "createdAt": "2025-10-31T14:30:00Z"
    }
  ],
  "total": 5432,
  "page": 1,
  "pages": 272
}
```

---

### GET /api/activities/stats
活動統計

**前端對應**: `api/activities.js` → `getActivityStats()`

```javascript
// 回應
{
  "totalActivities": 5432,
  "todayActivities": 87,
  "actionBreakdown": {
    "upload": 2345,
    "download": 1876,
    "delete": 234,
    "update": 543,
    "login": 434
  },
  "recentActivities": [ /* 最近 10 筆 */ ]
}
```

---

## 5. 批次上傳模組 (Upload)

### POST /api/upload/batch
批次上傳檔案

**前端對應**: `api/upload.js` → `batchUpload()`

```javascript
// 請求 (multipart/form-data)
FormData {
  files: [File, File, File],
  category_id: 1
}

// 回應
{
  "batchId": "batch_20251031_143000",
  "totalFiles": 3,
  "message": "批次上傳已開始處理"
}
```

**FastAPI 實作**:
```python
@router.post("/batch", response_model=BatchUploadResponse)
async def batch_upload(
    files: List[UploadFile] = File(...),
    category_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
):
    batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # 初始化進度
    await redis.hset(f"upload_progress:{batch_id}", mapping={
        "total": len(files),
        "completed": 0,
        "failed": 0,
        "status": "processing"
    })
    
    # 逐個處理檔案
    for idx, file in enumerate(files):
        try:
            # 上傳邏輯 (同單檔上傳)
            # ...
            
            # 更新進度
            await redis.hincrby(f"upload_progress:{batch_id}", "completed", 1)
            await redis.hset(f"upload_progress:{batch_id}", 
                           f"file_{idx}", f"success:{file.filename}")
        except Exception as e:
            await redis.hincrby(f"upload_progress:{batch_id}", "failed", 1)
            await redis.hset(f"upload_progress:{batch_id}", 
                           f"file_{idx}", f"error:{str(e)}")
    
    # 設定過期時間 (1 小時)
    await redis.expire(f"upload_progress:{batch_id}", 3600)
    
    return BatchUploadResponse(
        batch_id=batch_id,
        total_files=len(files),
        message="批次上傳已開始處理"
    )
```

---

### GET /api/upload/progress/{batch_id}
查詢上傳進度

**前端對應**: `api/upload.js` → `getUploadProgress()`

```javascript
// 回應
{
  "batchId": "batch_20251031_143000",
  "total": 10,
  "completed": 7,
  "failed": 1,
  "status": "processing",
  "files": [
    { "filename": "file1.pdf", "status": "success" },
    { "filename": "file2.pdf", "status": "success" },
    { "filename": "file3.pdf", "status": "error", "error": "檔案格式不支援" }
  ]
}
```

---

## 6. 使用者管理模組 (Users)

### GET /api/users
取得使用者列表 (僅超級管理員)

**前端對應**: `api/users.js` → `getUsers()`

---

### POST /api/users
新增使用者

**前端對應**: `api/users.js` → `createUser()`

---

### PUT /api/users/{user_id}
更新使用者

**前端對應**: `api/users.js` → `updateUser()`

---

### DELETE /api/users/{user_id}
刪除使用者

**前端對應**: `api/users.js` → `deleteUser()`

---

## 7. 處室管理模組 (Departments)

### GET /api/departments
取得處室列表

**前端對應**: `api/departments.js` → `getDepartments()`

---

### POST /api/departments
新增處室

**前端對應**: `api/departments.js` → `createDepartment()`

---

## 8. 系統設定模組 (Settings)

### GET /api/settings
取得系統設定

**前端對應**: `api/settings.js` → `getSettings()`

---

### PUT /api/settings
更新系統設定

**前端對應**: `api/settings.js` → `updateSettings()`

---

### POST /api/settings/backup
建立備份

**前端對應**: `api/settings.js` → `createBackup()`

---

## API 錯誤處理

### 標準錯誤格式
```json
{
  "detail": "錯誤訊息",
  "error_code": "FILE_TOO_LARGE",
  "status_code": 400
}
```

### HTTP 狀態碼
- **200**: 成功
- **201**: 建立成功
- **400**: 請求錯誤
- **401**: 未認證
- **403**: 無權限
- **404**: 資源不存在
- **413**: 檔案過大
- **500**: 伺服器錯誤

---

**下一步**: 閱讀 [05_FOLDER_STRUCTURE.md](./05_FOLDER_STRUCTURE.md) 了解專案結構
