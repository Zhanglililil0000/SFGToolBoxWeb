# Tasks

- [x] Task 1: 重写 `deploy.sh`
  - [x] Python 3.10 源码编译（检查已有 → 下载源码 → ./configure → make → make install）
  - [x] Node.js 20 安装（NodeSource RPM）
  - [x] 系统依赖安装（gcc、gcc-gfortran、openblas-devel 等）
  - [x] Python venv 创建 + pip 安装依赖
  - [x] npm install + npm run build
  - [x] 防火墙放行 8000 端口
  - [x] 创建/更新 systemd 服务 + 启动
  - [x] 支持 `--update` 参数跳过系统依赖安装

- [ ] Task 2: 编写 `DEPLOY_CENTOS.md` 操作指南
  - [ ] 前置准备（SSH 登录、安全组放行）
  - [ ] Python 3.10 安装（手动步骤说明）
  - [ ] Node.js 20 安装
  - [ ] 上传代码 + 一键部署
  - [ ] 验证（端口检查、服务状态、浏览器访问）
  - [ ] 排错指南（常见问题 FAQ）
  - [ ] 日常运维（更新代码、查看日志、重启服务）

# Task Dependencies
- Task 1 和 Task 2 可并行进行
