# ---------------------
# Build Stage
# ---------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 拷贝依赖文件并安装所有依赖（包含 devDependencies）
COPY  package*.json  ./
RUN npm ci

# 拷贝源码并构建
COPY .  .
ENV NODE_ENV=production
RUN npm run build

# ---------------------
# Production Stage
# ---------------------
FROM node:20-alpine

WORKDIR /app
# 拷贝仅运行所需的依赖（不含 devDependencies）
COPY package*.json ./
RUN npm ci --omit=dev

# 拷贝构建产物（非源码）
COPY --from=builder /app/dist ./dist
COPY .env.production .env

EXPOSE 3033

CMD ["node", "dist/main.js"]