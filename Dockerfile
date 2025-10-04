# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# 复制 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 安装所有依赖（包括开发依赖）
RUN yarn install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN yarn build

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 创建非 root 用户
RUN addgroup -g 1001 -S koishi && \
    adduser -S koishi -u 1001

# 复制 package.json 和 yarn.lock
COPY package.json yarn.lock ./

# 只安装生产依赖
RUN yarn install --frozen-lockfile --production=true && \
    yarn cache clean

# 从构建阶段复制构建产物
COPY --from=builder --chown=koishi:koishi /app/packages ./packages
COPY --from=builder --chown=koishi:koishi /app/plugins ./plugins

# 切换到非 root 用户
USER koishi

# 暴露端口（Koishi 默认端口）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV KOISHI_PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/status', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["node", "packages/koishi/bin.js"]
