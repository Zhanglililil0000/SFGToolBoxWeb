# SFG Tool Box 项目初始化 Spec

## Why
构建一个面向 Sum Frequency Generation（和频产生光谱）研究领域的在线工具箱，提供数据处理、计算和数据库管理功能。采用前后端分离架构，支持本地开发和未来服务器部署。

## What Changes
- 初始化 FastAPI 后端项目结构
- 初始化 React 前端项目结构（使用 Vite 构建）
- 实现主页：顶部导航栏 + 项目名称（点击回主页）+ 功能入口按钮
- 实现三个功能模块的空白占位页面：SFG数据处理、SFG计算器、SFG数据库
- 实现前后端路由和页面跳转

## Impact
- Affected specs: 无（全新项目）
- Affected code: 整个项目为新建，参考 ReferenceCode/ 下的现有 SFG 代码

## ADDED Requirements

### Requirement: 项目结构
系统 SHALL 采用前后端分离的项目结构，后端使用 Python FastAPI，前端使用 React + Vite + TypeScript。

#### Scenario: 项目目录结构
- **WHEN** 项目初始化完成
- **THEN** 根目录下存在 `backend/` 和 `frontend/` 两个子目录，分别包含后端和前端的完整项目结构

### Requirement: 后端服务
后端 SHALL 提供 FastAPI 服务，包含基础的 API 路由和静态文件服务（生产模式下托管前端构建产物）。

#### Scenario: 启动后端服务
- **WHEN** 在后端目录执行启动命令
- **THEN** FastAPI 服务在 `http://localhost:8000` 启动，访问 `/api/health` 返回健康状态

### Requirement: 前端主页
前端主页 SHALL 包含顶部导航栏，导航栏左侧显示项目名称 "SFG Tool Box"，点击可返回主页。导航栏中横向排列各功能入口链接。

#### Scenario: 访问主页
- **WHEN** 用户访问前端开发服务器（默认 `http://localhost:5173`）
- **THEN** 显示主页，包含顶部导航栏和功能入口按钮区域

#### Scenario: 点击项目名称返回主页
- **WHEN** 用户在任意子页面点击导航栏中的 "SFG Tool Box" 项目名称
- **THEN** 页面跳转回主页

### Requirement: 顶部导航菜单
顶部导航栏 SHALL 横向排列三个功能入口：SFG数据处理、SFG计算器、SFG数据库，点击可跳转到对应页面。

#### Scenario: 导航跳转
- **WHEN** 用户点击导航栏中的任一功能入口
- **THEN** 页面跳转到对应的功能页面（初始为空白占位页面）

### Requirement: 功能占位页面
每个功能模块 SHALL 有一个独立的 React 路由页面，初始状态下显示功能名称和"即将推出"的占位内容。

#### Scenario: 访问 SFG数据处理页面
- **WHEN** 用户通过导航或 URL 访问 `/data-processing`
- **THEN** 显示 "SFG数据处理" 标题及占位内容

#### Scenario: 访问 SFG计算器页面
- **WHEN** 用户通过导航或 URL 访问 `/calculator`
- **THEN** 显示 "SFG计算器" 标题及占位内容

#### Scenario: 访问 SFG数据库页面
- **WHEN** 用户通过导航或 URL 访问 `/database`
- **THEN** 显示 "SFG数据库" 标题及占位内容

### Requirement: 前/后端开发联调
前端开发模式下 SHALL 通过 Vite 代理将 `/api` 请求转发到后端 FastAPI 服务。

#### Scenario: 前端调用后端 API
- **WHEN** 前端在开发模式下发起 `/api/*` 请求
- **THEN** 请求被代理到 `http://localhost:8000` 后端服务
