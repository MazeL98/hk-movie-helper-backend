FROM node:20-alpine AS builder

WORKDIR /app

COPY  package*.json  ./

RUN npm ci --omit=dev

COPY .  .

ENV NODE_ENV=production

# 构建项目（产出 dist/main.js）
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]