# CentOS 7.9 云服务器部署 Spec

## Why
项目目前仅在 Windows 本地运行（run.bat），需要部署到已订阅的 CentOS 7.9 云服务器（2核2GB，50GB 系统盘），使公网可访问。

## What Changes
- **重写 `deploy.sh`**：适配 CentOS 7.9（yum + firewalld + 源码编译 Python 3.10）
- **新增 `DEPLOY_CENTOS.md`**：详细的中文部署操作指南（面向有基础运维经验的科研人员）
- 应用代码**无需修改**（main.py 已支持生产模式托管前端）

## Impact
- Affected specs: sfg-toolbox-setup（初始化项目）
- Affected code: `deploy.sh`（重写）, `DEPLOY_CENTOS.md`（新增）
- 不修改任何 Python/React 应用代码

## ADDED Requirements

### Requirement: CentOS 7.9 部署脚本
`deploy.sh` SHALL 在 CentOS 7.9 上自动完成全部部署：安装系统依赖 → 编译 Python 3.10 → 安装 Node.js → 构建前端 → 创建 systemd 服务 → 启动。

#### Scenario: 一键部署
- **WHEN** 用户执行 `sudo ./deploy.sh`
- **THEN** 所有依赖安装完毕，服务运行在 8000 端口，防火墙已放行

#### Scenario: 增量部署（仅更新代码）
- **WHEN** 用户执行 `sudo ./deploy.sh --update`
- **THEN** 跳过系统依赖安装，仅拉取最新代码、重新构建前端、重启服务

### Requirement: Python 3.10 源码编译
部署脚本 SHALL 从源码编译 Python 3.10.14（启用 optimizations 和 shared library）。

#### Scenario: Python 已安装
- **WHEN** `/usr/local/bin/python3.10` 已存在
- **THEN** 跳过编译步骤

### Requirement: Node.js 20 安装
部署脚本 SHALL 通过 NodeSource RPM 仓库安装 Node.js 20，确保 `npm` 可用。

### Requirement: 防火墙配置
部署脚本 SHALL 通过 `firewall-cmd` 放行 8000 端口。

### Requirement: systemd 服务
部署脚本 SHALL 创建 `sfg-toolbox.service`，配置为开机自启、崩溃自动重启。

## MODIFIED Requirements
无。

## REMOVED Requirements
无。
