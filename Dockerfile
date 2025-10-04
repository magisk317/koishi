FROM node:18-alpine

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++ git

# 复制文件并构建
COPY package.json ./
COPY . .
RUN NODE_NO_WARNINGS=1 yarn install && NODE_NO_WARNINGS=1 yarn build

# 运行时配置
EXPOSE 3000
ENV NODE_ENV=production
ENV NODE_NO_WARNINGS=1

CMD ["node", "packages/koishi/lib/cli/index.js"]
