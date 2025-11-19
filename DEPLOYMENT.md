# 🚀 部署指南 (Deployment Guide)

本文檔提供 RAG Admin Frontend 的完整部署指南。

---

## 📋 目錄

- [前置需求](#前置需求)
- [建構專案](#建構專案)
- [部署方式](#部署方式)
  - [Nginx 部署](#nginx-部署)
  - [Docker 部署](#docker-部署)
  - [Netlify 部署](#netlify-部署)
  - [Vercel 部署](#vercel-部署)
- [環境配置](#環境配置)
- [常見問題](#常見問題)

---

## 📦 前置需求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **後端 API**: 已部署並正常運行

---

## 🏗️ 建構專案

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 文件
nano .env
```

**生產環境配置**:
```env
# 設定實際的後端 API 地址
VITE_API_BASE_URL=https://api.your-domain.com/api
```

### 3. 建構生產版本

```bash
npm run build
```

建構完成後，產物會輸出到 `dist/` 目錄。

---

## 🚢 部署方式

### 1️⃣ Nginx 部署

#### 步驟 1: 上傳建構產物

```bash
# 將 dist/ 目錄上傳到伺服器
scp -r dist/* user@your-server:/var/www/rag_admin/
```

#### 步驟 2: 配置 Nginx

創建 Nginx 配置文件 `/etc/nginx/sites-available/rag-admin`:

```nginx
server {
    listen 80;
    server_name admin.your-domain.com;

    # 靜態文件目錄
    root /var/www/rag_admin;
    index index.html;

    # 日誌
    access_log /var/log/nginx/rag-admin-access.log;
    error_log /var/log/nginx/rag-admin-error.log;

    # SPA 路由支援
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 靜態資源快取
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 壓縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_vary on;
    gzip_min_length 1000;

    # 安全標頭
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 步驟 3: 啟用配置

```bash
# 創建符號連結
sudo ln -s /etc/nginx/sites-available/rag-admin /etc/nginx/sites-enabled/

# 測試配置
sudo nginx -t

# 重載 Nginx
sudo systemctl reload nginx
```

#### 步驟 4: 配置 HTTPS (Let's Encrypt)

```bash
# 安裝 Certbot
sudo apt install certbot python3-certbot-nginx

# 獲取 SSL 證書
sudo certbot --nginx -d admin.your-domain.com

# 自動續期
sudo certbot renew --dry-run
```

---

### 2️⃣ Docker 部署

#### Dockerfile

創建 `Dockerfile`:

```dockerfile
# 第一階段: 建構
FROM node:18-alpine AS builder

WORKDIR /app

# 複製依賴文件
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 建構應用
RUN npm run build

# 第二階段: 運行
FROM nginx:alpine

# 複製建構產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

創建 `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

#### docker-compose.yml

創建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

#### 建構與運行

```bash
# 建構映像
docker build -t rag-admin-frontend .

# 運行容器
docker run -d -p 80:80 --name rag-admin rag-admin-frontend

# 或使用 docker-compose
docker-compose up -d
```

---

### 3️⃣ Netlify 部署

#### 方式 1: CLI 部署

```bash
# 安裝 Netlify CLI
npm install -g netlify-cli

# 登入 Netlify
netlify login

# 建構專案
npm run build

# 部署
netlify deploy --prod --dir=dist
```

#### 方式 2: Git 整合

1. 推送代碼到 GitHub/GitLab
2. 登入 [Netlify](https://netlify.com)
3. 點擊 "New site from Git"
4. 選擇倉庫並設定:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **環境變數**: 設定 `VITE_API_BASE_URL`

#### netlify.toml

創建 `netlify.toml` 配置文件:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

### 4️⃣ Vercel 部署

#### 方式 1: CLI 部署

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 部署
vercel --prod
```

#### 方式 2: Git 整合

1. 推送代碼到 GitHub/GitLab
2. 登入 [Vercel](https://vercel.com)
3. 點擊 "Import Project"
4. 選擇倉庫並設定環境變數

#### vercel.json

創建 `vercel.json` 配置文件:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## ⚙️ 環境配置

### 環境變數

| 變數名 | 說明 | 範例 |
|--------|------|------|
| `VITE_API_BASE_URL` | 後端 API 地址 | `https://api.your-domain.com/api` |

### 多環境配置

創建不同環境的 `.env` 文件:

```bash
# 開發環境
.env.development
VITE_API_BASE_URL=http://localhost:8000/api

# 測試環境
.env.staging
VITE_API_BASE_URL=https://api-staging.your-domain.com/api

# 生產環境
.env.production
VITE_API_BASE_URL=https://api.your-domain.com/api
```

使用指定環境建構:

```bash
# 開發環境
npm run dev

# 測試環境建構
npm run build -- --mode staging

# 生產環境建構
npm run build -- --mode production
```

---

## 🔒 安全性建議

### 1. 環境變數保護

- ❌ **切勿** 將 `.env` 提交到 Git
- ✅ 使用 CI/CD 平台的環境變數管理
- ✅ 定期輪換敏感金鑰

### 2. HTTPS 配置

- ✅ 生產環境**必須**使用 HTTPS
- ✅ 啟用 HSTS (HTTP Strict Transport Security)
- ✅ 配置正確的 SSL 證書

### 3. 安全標頭

在 Nginx 或 CDN 配置中添加:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## 📊 性能優化

### 1. 啟用壓縮

Nginx 配置:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. 靜態資源快取

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN 加速

- 使用 Cloudflare / AWS CloudFront
- 啟用自動壓縮和快取
- 配置正確的快取規則

---

## 🔍 監控與日誌

### 健康檢查端點

確保前端可訪問，可使用 Nginx 配置:

```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### 日誌收集

```bash
# 查看 Nginx 訪問日誌
tail -f /var/log/nginx/rag-admin-access.log

# 查看錯誤日誌
tail -f /var/log/nginx/rag-admin-error.log
```

---

## ❓ 常見問題

### Q1: 部署後頁面刷新出現 404

**A**: 需要配置 SPA 路由支援，將所有路由重定向到 `index.html`。

Nginx:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q2: API 請求跨域錯誤

**A**: 檢查後端 CORS 設定，或使用 Nginx 代理:

```nginx
location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Q3: 建構失敗

**A**: 確認:
- Node.js 版本 >= 18
- 依賴安裝完整 (`npm install`)
- 環境變數正確設定

### Q4: 靜態資源載入失敗

**A**: 檢查:
- `vite.config.js` 的 `base` 設定
- Nginx 靜態文件權限
- CDN 路徑配置

---

## 📞 技術支援

如有部署問題，請：
- 📧 提交 Issue
- 💬 聯繫開發團隊
- 📚 查看官方文檔

---

**Happy Deploying! 🎉**
