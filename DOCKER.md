# Koishi Docker 部署指南

本项目支持通过 Docker 进行容器化部署，提供了完整的 Docker 配置和自动化构建流程。

## 快速开始

### 使用预构建镜像

```bash
# 拉取最新镜像
docker pull ghcr.io/magisk317/koishi:latest

# 运行容器
docker run -d \
  --name koishi \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/magisk317/koishi:latest
```

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 本地构建

```bash
# 构建镜像
docker build -t koishi:latest .

# 运行容器
docker run -d \
  --name koishi \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  koishi:latest
```

## 配置说明

### 环境变量

- `NODE_ENV`: 运行环境，默认为 `production`
- `KOISHI_PORT`: 服务端口，默认为 `3000`

### 挂载目录

- `/app/config`: 配置文件目录
- `/app/data`: 数据存储目录
- `/app/logs`: 日志文件目录

### 端口映射

- `3000`: Koishi 服务端口

## 自动化构建

本项目使用 GitHub Actions 进行自动化构建和发布：

- **触发条件**: 
  - 推送到 `master` 或 `main` 分支
  - 创建版本标签（如 `v1.0.0`）
  - 创建 Pull Request

- **构建平台**: 
  - linux/amd64
  - linux/arm64

- **镜像标签**:
  - `latest`: 最新版本
  - `v1.0.0`: 具体版本号
  - `v1.0`: 主版本号
  - `v1`: 大版本号

## 镜像信息

- **基础镜像**: node:18-alpine
- **多阶段构建**: 优化镜像大小
- **非 root 用户**: 提高安全性
- **健康检查**: 自动监控服务状态
- **信号处理**: 使用 dumb-init 正确处理信号

## 故障排除

### 查看容器日志

```bash
docker logs koishi
```

### 进入容器调试

```bash
docker exec -it koishi sh
```

### 检查健康状态

```bash
docker inspect koishi | grep Health -A 10
```

## 开发模式

如果需要开发模式运行：

```bash
# 构建开发镜像
docker build -t koishi:dev --target builder .

# 运行开发容器
docker run -it --rm \
  --name koishi-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  koishi:dev sh
```

## 贡献

欢迎提交 Issue 和 Pull Request 来改进 Docker 配置！

## 许可证

本项目使用 MIT 许可证，详见 [LICENSE](./LICENSE) 文件。
