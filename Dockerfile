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

# 复制 package.json
COPY package.json ./

# 复制源代码
COPY . .

# 安装所有依赖（包括开发依赖）
RUN yarn install

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

# 复制 package.json
COPY package.json ./

# 只安装生产依赖
RUN yarn install --production=true && \
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

# 健康检查 - 检查进程是否运行
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD pgrep -f "node.*koishi" > /dev/null || exit 1

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["node", "packages/koishi/lib/cli/index.js"]
