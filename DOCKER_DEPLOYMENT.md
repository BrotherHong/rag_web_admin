# Docker 部署指南

## 📦 架構說明

前端採用 Docker 容器化部署，需要配合後端的 Docker 網路：

```
前端 (rag_web_admin)
└── Frontend 容器 (Nginx + React)
    └── 連接到後端的 rag_network

後端 (rag_web_backend)  
├── PostgreSQL 容器
├── Backend 容器 (FastAPI)
└── Docker Network: rag_network (前後端共用)
```

**重要**：前端容器需要連接到後端創建的 `rag_network` 網路。

---

## 🚀 前端部署

### 前置條件

確保後端已經部署並創建了 `rag_network`：

```bash
# 檢查後端網路是否存在
docker network inspect rag_network

# 如果不存在，先部署後端
cd /path/to/rag_web_backend
docker-compose up -d
```

---

### 1. 環境配置

### 1. 環境配置

編輯 `.env.production` 設定基礎路徑和 API 位址：

```bash
cd /path/to/rag_web_admin
nano .env.production
```

**範例配置**：

```env
# 部署到根路徑 (http://domain.com/)
VITE_BASE_PATH=/
VITE_API_BASE_URL=/api

# 部署到子路徑 (http://domain.com/rag_web/)
VITE_BASE_PATH=/rag_web/
VITE_API_BASE_URL=/rag_web/api
```

### 2. 建置並啟動

```bash
# 建置並啟動前端容器
docker-compose up -d --build

# 查看日誌
docker-compose logs -f

# 檢查狀態
docker-compose ps
```

### 3. 驗證部署

```bash
# 測試前端（映射到 3000 端口）
curl http://localhost:3000

# 檢查是否連接到後端網路
docker network inspect rag_network | grep rag_frontend
```

---

## 🌐 主機 Nginx 配置（可選）

如果在主機上使用 Nginx 反向代理到容器：

```nginx
# /etc/nginx/sites-available/rag_web.conf

server {
    listen 8888;
    server_name your-server.com;

    # 前端和 API 統一入口
    location /rag_web/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

啟用配置：
```bash
sudo ln -s /etc/nginx/sites-available/rag_web.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔧 常用管理指令

### 前端管理

```bash
# 重建前端（環境變數改變後）
docker-compose up -d --build

# 查看日誌
docker-compose logs -f

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down
```

---

## 🐛 故障排除

### 前端無法連接後端

1. 檢查 Docker 網路：
```bash
docker network inspect rag_network
```

2. 檢查後端容器名稱：
```bash
docker ps | grep backend
# 確認名稱是 rag_backend
```

3. 測試網路連通性：
```bash
docker exec -it rag_frontend ping rag_backend
```

### 容器無法啟動

```bash
# 查看詳細錯誤
docker-compose logs

# 重建容器
docker-compose up -d --build --force-recreate
```

### 環境變數未生效

環境變數在建置時注入，修改後需要重建：

```bash
# 修改 .env.production 後
docker-compose up -d --build
```

---

## 📝 環境變數說明

### .env.production

| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_BASE_PATH` | 基礎路徑 | `/` 或 `/rag_web/` |
| `VITE_API_BASE_URL` | API 路徑 | `/api` 或 `/rag_web/api` |

---

## 🔄 更新部署

```bash
# 1. 拉取最新代碼
git pull

# 2. 重建並重啟
docker-compose up -d --build

# 3. 驗證
curl http://localhost:3000
```

---

## 📞 支援

遇到問題請查看：
- 容器日誌：`docker-compose logs -f`
- 健康檢查：`docker ps`
- 網路檢查：`docker network inspect rag_network`
- 後端連接：確認 `rag_backend` 容器正在運行
