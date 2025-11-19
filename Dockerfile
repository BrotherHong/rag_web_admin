# Multi-stage build for frontend

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci

# 複製源碼
COPY . .

# 建置應用（使用環境變數設定基礎路徑）
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL=/api
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# 複製建置產物
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
