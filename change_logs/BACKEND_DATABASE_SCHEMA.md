# 🗄️ 資料庫 Schema 文件

## 資料庫架構總覽

系統需要以下 7 個主要資料表:

```
📦 RAG Knowledge Base Database
├── users              # 使用者資料表
├── categories         # 分類資料表
├── files              # 檔案資料表
├── settings           # 系統設定表
├── activities         # 活動記錄表
├── upload_tasks       # 上傳任務表
└── backups            # 備份記錄表
```

---

## 1. users - 使用者資料表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 使用者 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 使用者帳號 |
| password | VARCHAR(255) | NOT NULL | 加密後的密碼 (bcrypt) |
| name | VARCHAR(100) | NOT NULL | 使用者姓名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email 地址 |
| role | VARCHAR(20) | NOT NULL | 角色 (admin/manager/viewer) |
| is_active | BOOLEAN | DEFAULT TRUE | 啟用狀態 |
| last_login | TIMESTAMP | NULL | 最後登入時間 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | NULL | 更新時間 |
| deleted_at | TIMESTAMP | NULL | 刪除時間（軟刪除） |

### SQL 建表語句

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### 預設資料

```sql
INSERT INTO users (username, password, name, email, role) VALUES
('admin', '$2b$10$hashed_password_here', '系統管理員', 'admin@ncku.edu.tw', 'admin'),
('hr_manager', '$2b$10$hashed_password_here', '人事主管', 'hr@ncku.edu.tw', 'manager'),
('viewer', '$2b$10$hashed_password_here', '一般檢視者', 'viewer@ncku.edu.tw', 'viewer');
```

---

## 2. categories - 分類資料表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 分類 ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 分類名稱 |
| color | VARCHAR(20) | NOT NULL | 分類顏色 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| created_by | INTEGER | FOREIGN KEY → users(id) | 建立者 |

### SQL 建表語句

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_categories_name ON categories(name);
```

### 預設資料

```sql
INSERT INTO categories (name, color, created_by) VALUES
('規章制度', 'blue', 1),
('請假相關', 'green', 1),
('薪資福利', 'yellow', 1),
('未分類', 'gray', 1);
```

### 顏色選項

```javascript
const ALLOWED_COLORS = [
  'gray', 'red', 'orange', 'yellow', 'green', 
  'teal', 'blue', 'indigo', 'purple', 'pink'
];
```

---

## 3. files - 檔案資料表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 檔案 ID |
| name | VARCHAR(255) | NOT NULL | 檔案名稱 |
| size_bytes | BIGINT | NOT NULL | 檔案大小（位元組） |
| file_type | VARCHAR(10) | NOT NULL | 檔案類型 (pdf, docx, etc.) |
| file_path | VARCHAR(500) | NOT NULL | 檔案儲存路徑 |
| category | VARCHAR(50) | NOT NULL | 分類名稱 |
| description | TEXT | NULL | 檔案描述 |
| uploader_id | INTEGER | FOREIGN KEY → users(id) | 上傳者 ID |
| upload_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 上傳時間 |
| last_accessed | TIMESTAMP | NULL | 最後存取時間 |
| download_count | INTEGER | DEFAULT 0 | 下載次數 |

### SQL 建表語句

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP,
  download_count INTEGER DEFAULT 0
);

-- 索引
CREATE INDEX idx_files_name ON files(name);
CREATE INDEX idx_files_category ON files(category);
CREATE INDEX idx_files_uploader ON files(uploader_id);
CREATE INDEX idx_files_upload_date ON files(upload_date);
CREATE INDEX idx_files_file_type ON files(file_type);

-- 全文搜尋索引（PostgreSQL）
CREATE INDEX idx_files_name_fulltext ON files USING gin(to_tsvector('chinese', name));
```

### 範例資料

```sql
INSERT INTO files (name, size_bytes, file_type, file_path, category, uploader_id) VALUES
('人事規章.pdf', 2516582, 'pdf', '/uploads/2025/10/abc123-人事規章.pdf', '規章制度', 1),
('請假辦法.docx', 911360, 'docx', '/uploads/2025/10/def456-請假辦法.docx', '請假相關', 1),
('薪資計算說明.pdf', 1258291, 'pdf', '/uploads/2025/10/ghi789-薪資計算說明.pdf', '薪資福利', 1);
```

---

## 4. settings - 系統設定表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | INTEGER | PRIMARY KEY | 設定 ID（固定為 1） |
| model | VARCHAR(50) | NOT NULL | AI 模型名稱 |
| temperature | DECIMAL(3,2) | NOT NULL | 溫度參數 (0.0-1.0) |
| max_tokens | INTEGER | NOT NULL | 最大 Token 數 |
| top_p | DECIMAL(3,2) | NOT NULL | Top P 參數 |
| tone | VARCHAR(20) | NOT NULL | 語氣設定 |
| similarity_threshold | DECIMAL(3,2) | NOT NULL | 相似度閾值 |
| max_retrieval_docs | INTEGER | NOT NULL | 最大檢索文件數 |
| auto_cleanup_days | INTEGER | NOT NULL | 自動清理天數 |
| index_update_frequency | VARCHAR(20) | NOT NULL | 索引更新頻率 |
| email_notifications | BOOLEAN | DEFAULT TRUE | Email 通知 |
| upload_success_notif | BOOLEAN | DEFAULT TRUE | 上傳成功通知 |
| upload_fail_notif | BOOLEAN | DEFAULT TRUE | 上傳失敗通知 |
| storage_warning | BOOLEAN | DEFAULT TRUE | 儲存空間警告 |
| weekly_report | BOOLEAN | DEFAULT FALSE | 每週報告 |
| auto_backup | BOOLEAN | DEFAULT TRUE | 自動備份 |
| backup_frequency | VARCHAR(20) | NOT NULL | 備份頻率 |
| backup_retention_days | INTEGER | DEFAULT 30 | 備份保留天數 |
| updated_at | TIMESTAMP | NULL | 更新時間 |

### SQL 建表語句

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  model VARCHAR(50) NOT NULL DEFAULT 'gpt-4',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
  max_tokens INTEGER NOT NULL DEFAULT 2000 CHECK (max_tokens >= 100 AND max_tokens <= 4000),
  top_p DECIMAL(3,2) NOT NULL DEFAULT 0.9 CHECK (top_p >= 0 AND top_p <= 1),
  tone VARCHAR(20) NOT NULL DEFAULT 'professional',
  similarity_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.75 CHECK (similarity_threshold >= 0 AND similarity_threshold <= 1),
  max_retrieval_docs INTEGER NOT NULL DEFAULT 5,
  auto_cleanup_days INTEGER NOT NULL DEFAULT 90,
  index_update_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  email_notifications BOOLEAN DEFAULT TRUE,
  upload_success_notif BOOLEAN DEFAULT TRUE,
  upload_fail_notif BOOLEAN DEFAULT TRUE,
  storage_warning BOOLEAN DEFAULT TRUE,
  weekly_report BOOLEAN DEFAULT FALSE,
  auto_backup BOOLEAN DEFAULT TRUE,
  backup_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly',
  backup_retention_days INTEGER DEFAULT 30,
  updated_at TIMESTAMP,
  CONSTRAINT chk_only_one_row CHECK (id = 1)
);
```

### 預設資料

```sql
INSERT INTO settings (id) VALUES (1);
```

---

## 5. activities - 活動記錄表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 活動 ID |
| type | VARCHAR(50) | NOT NULL | 活動類型 |
| user_id | INTEGER | FOREIGN KEY → users(id) | 使用者 ID |
| file_id | INTEGER | NULL | 相關檔案 ID |
| file_name | VARCHAR(255) | NULL | 檔案名稱 |
| category_name | VARCHAR(50) | NULL | 分類名稱 |
| details | TEXT | NULL | 詳細資訊 |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 時間戳記 |
| ip_address | VARCHAR(45) | NULL | IP 位址 |
| user_agent | VARCHAR(255) | NULL | User Agent |

### 活動類型

```javascript
const ACTIVITY_TYPES = [
  'upload',          // 上傳檔案
  'delete',          // 刪除檔案
  'download',        // 下載檔案
  'batch_upload',    // 批次上傳
  'category_add',    // 新增分類
  'category_delete', // 刪除分類
  'user_add',        // 新增使用者
  'user_update',     // 更新使用者
  'user_delete',     // 刪除使用者
  'settings_update', // 更新系統設定
  'backup_create',   // 建立備份
  'backup_restore',  // 還原備份
  'login',           // 登入
  'logout'           // 登出
];
```

### SQL 建表語句

```sql
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
  file_name VARCHAR(255),
  category_name VARCHAR(50),
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255)
);

-- 索引
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
```

---

## 6. upload_tasks - 上傳任務表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | VARCHAR(100) | PRIMARY KEY | 任務 ID |
| user_id | INTEGER | FOREIGN KEY → users(id) | 使用者 ID |
| total_files | INTEGER | NOT NULL | 總檔案數 |
| completed_files | INTEGER | DEFAULT 0 | 已完成數 |
| failed_files | INTEGER | DEFAULT 0 | 失敗數 |
| status | VARCHAR(20) | NOT NULL | 狀態 |
| progress | INTEGER | DEFAULT 0 | 進度百分比 |
| current_file | VARCHAR(255) | NULL | 當前處理檔案 |
| results | TEXT | NULL | 結果詳情（JSON） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| completed_at | TIMESTAMP | NULL | 完成時間 |

### 狀態值

```javascript
const TASK_STATUS = [
  'processing',  // 處理中
  'completed',   // 已完成
  'failed'       // 失敗
];
```

### SQL 建表語句

```sql
CREATE TABLE upload_tasks (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_files INTEGER NOT NULL,
  completed_files INTEGER DEFAULT 0,
  failed_files INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_file VARCHAR(255),
  results TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_upload_tasks_user ON upload_tasks(user_id);
CREATE INDEX idx_upload_tasks_status ON upload_tasks(status);
CREATE INDEX idx_upload_tasks_created ON upload_tasks(created_at DESC);
```

---

## 7. backups - 備份記錄表

### 欄位定義

| 欄位名稱 | 資料型別 | 約束 | 說明 |
|---------|---------|------|------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | 備份 ID |
| file_name | VARCHAR(255) | NOT NULL | 備份檔案名稱 |
| file_path | VARCHAR(500) | NULL | 備份檔案路徑 |
| size_bytes | BIGINT | NULL | 檔案大小 |
| type | VARCHAR(20) | NOT NULL | 備份類型 (auto/manual) |
| status | VARCHAR(20) | NOT NULL | 狀態 |
| file_count | INTEGER | NULL | 檔案數量 |
| error_message | TEXT | NULL | 錯誤訊息 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| created_by | INTEGER | FOREIGN KEY → users(id) | 建立者 |
| completed_at | TIMESTAMP | NULL | 完成時間 |

### SQL 建表語句

```sql
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  size_bytes BIGINT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('auto', 'manual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  file_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_status ON backups(status);
CREATE INDEX idx_backups_created ON backups(created_at DESC);
```

---

## 資料庫關係圖

```
┌─────────────┐
│   users     │
│             │◄─────────┐
│ • id        │          │
│ • username  │          │ uploader_id
│ • password  │          │
│ • role      │          │
└─────────────┘          │
      ▲                  │
      │                  │
      │ user_id     ┌────┴────────┐
      │             │   files     │
      │             │             │
      │             │ • id        │
      │             │ • name      │
      │             │ • category ─┼─┐
      │             │ • uploader_id│ │
      │             └─────────────┘ │
      │                             │
      │ user_id                     │ name
      │                             │
┌─────┴──────────┐           ┌─────▼────────┐
│  activities    │           │ categories   │
│                │           │              │
│ • id           │           │ • id         │
│ • type         │           │ • name       │
│ • user_id      │           │ • color      │
│ • file_id      │           └──────────────┘
└────────────────┘

┌─────────────────┐
│ upload_tasks    │
│                 │
│ • id            │
│ • user_id       │◄──── users
│ • status        │
└─────────────────┘

┌─────────────────┐
│   backups       │
│                 │
│ • id            │
│ • created_by    │◄──── users
│ • status        │
└─────────────────┘

┌─────────────────┐
│   settings      │
│                 │
│ • id (固定為1)  │
│ • model         │
│ • temperature   │
└─────────────────┘
```

---

## 資料庫維護

### 定期清理

```sql
-- 清理舊活動記錄（保留 90 天）
DELETE FROM activities 
WHERE timestamp < CURRENT_DATE - INTERVAL '90 days';

-- 清理舊上傳任務（保留 30 天）
DELETE FROM upload_tasks 
WHERE status = 'completed' 
AND completed_at < CURRENT_DATE - INTERVAL '30 days';

-- 清理舊備份（根據設定保留天數）
DELETE FROM backups 
WHERE created_at < CURRENT_DATE - INTERVAL '30 days';
```

### 效能優化

```sql
-- 分析查詢效能
EXPLAIN ANALYZE SELECT * FROM files WHERE category = '規章制度';

-- 更新統計資訊
ANALYZE files;
ANALYZE activities;

-- 重建索引
REINDEX TABLE files;
```

---

**文件版本**: 1.0.0  
**更新日期**: 2025-10-18
