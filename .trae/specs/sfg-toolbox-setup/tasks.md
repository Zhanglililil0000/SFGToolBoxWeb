# Tasks

- [x] Task 1: 初始化 FastAPI 后端项目
  - [x] 创建 `backend/` 目录结构
  - [x] 创建 `requirements.txt`（fastapi, uvicorn）
  - [x] 创建 `main.py`：FastAPI 应用入口，包含 `/api/health` 健康检查接口
  - [x] 创建路由模块 `routers/`，预留功能路由文件
  - [x] 验证：`uvicorn main:app --reload` 可启动，`/api/health` 返回 `{"status": "ok"}`

- [x] Task 2: 初始化 React 前端项目
  - [x] 使用 Vite 创建 React + TypeScript 项目于 `frontend/` 目录
  - [x] 安装依赖：react-router-dom
  - [x] 配置 Vite 代理，将 `/api` 请求转发到 `http://localhost:8000`
  - [x] 验证：`npm run dev` 可启动，访问 `http://localhost:5173` 看到默认页面

- [x] Task 3: 实现前端路由与导航布局
  - [x] 创建页面组件目录 `src/pages/`，包含 HomePage、DataProcessingPage、CalculatorPage、DatabasePage
  - [x] 配置 React Router 路由表（`/`, `/data-processing`, `/calculator`, `/database`）
  - [x] 实现顶部导航栏组件 Navbar：左侧 "SFG Tool Box" 品牌名（点击跳转 `/`），右侧横向排列三个功能链接
  - [x] 实现底部版权信息 Footer（简约）
  - [x] 验证：各路由可正常跳转，点击品牌名返回主页

- [x] Task 4: 实现主页与占位页面 UI
  - [x] HomePage：展示三个功能入口卡片/按钮，点击跳转到对应功能页面
  - [x] DataProcessingPage、CalculatorPage、DatabasePage：显示功能名称标题和"功能即将推出"占位内容
  - [x] 验证：所有页面正常渲染，导航和按钮跳转正常

- [x] Task 5: 整体样式美化
  - [x] 使用 CSS 变量定义设计系统（颜色、字体、间距）
  - [x] 导航栏样式：固定顶部、深色背景、白色文字、hover 高亮
  - [x] 主页布局：居中内容区，卡片式功能入口
  - [x] 响应式布局：移动端导航折叠或简化
  - [x] 验证：视觉效果统一、美观

# Task Dependencies
- Task 2 在 Task 1 完成后可并行（仅安装依赖无关联）
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 4
