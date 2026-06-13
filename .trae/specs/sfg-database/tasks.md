# Tasks

- [x] Task 1: 后端 — 创建 SQLite 数据库服务模块
  - [x] 创建 `backend/services/database.py`：数据库初始化、记录 CRUD、图片文件管理
  - [x] 实现 `init_db()`：创建 records 表和 uploads/ 目录
  - [x] 实现 `get_all_records()`、`add_record()`、`delete_record()`、`save_image()`、`delete_image()`
  - [x] 验证：运行测试脚本确认数据库创建和 CRUD 正常

- [x] Task 2: 后端 — 实现数据库 API 端点
  - [x] 重写 `backend/routers/database.py`
  - [x] `GET /api/database/records` — 返回所有记录 JSON 数组
  - [x] `POST /api/database/records` — multipart/form-data 新增记录
  - [x] `DELETE /api/database/records/{id}` — 删除记录和关联图片
  - [x] `GET /api/database/images/{filename}` — 返回图片文件
  - [x] 在 `backend/main.py` 中调用 `init_db()` 启动初始化

- [x] Task 3: 前端 — 实现上传 Modal 组件
  - [x] 创建上传悬浮窗口，包含所有字段输入（名称、分子式、强度、χ²、峰位置/宽度、振动模式、分子基团、角度×2、能量、仪器、文献、图片文件选择器）
  - [x] 图片预览功能
  - [x] 表单验证（必填字段检查）
  - [x] 提交后 FormData POST 到后端，上传成功刷新列表

- [x] Task 4: 前端 — 重写 DatabasePage 三 Tab 布局
  - [x] Tab 切换组件（强度序列 / 数据库视图 / 光谱图）
  - [x] 页面加载时 fetch 获取所有记录
  - [x] 删除操作触发数据刷新
  - [x] 上传按钮（触发 Modal）

- [x] Task 5: 前端 — 强度序列视图 (Tab 1)
  - [x] 可切换排序指标（归一化强度 / 有效 χ²）
  - [x] Recharts 水平条形图，从高到低排列
  - [x] 条形图颜色渐变表示强度差异
  - [x] 点击条形可查看记录详情

- [x] Task 6: 前端 — 数据库视图 (Tab 2)
  - [x] 搜索框：按名称/分子式/基团实时筛选
  - [x] 卡片列表展示核心字段
  - [x] 点击卡片展开/折叠详细信息（含光谱图预览）
  - [x] 每条记录包含删除按钮

- [x] Task 7: 前端 — 光谱图视图 (Tab 3)
  - [x] 自定义散点/竖线图：X=波数，Y=强度
  - [x] 鼠标悬停 Tooltip：名称、峰位置、强度、振动模式
  - [x] X/Y 轴范围可配置输入框
  - [x] 使用 Recharts 自定义渲染

- [x] Task 8: 前端 — DatabasePage 样式美化
  - [x] Tab 样式（复用 CalculatorPage 风格）
  - [x] Modal 样式：暗色主题、圆角、遮罩层
  - [x] 卡片样式：紧凑布局、hover 效果
  - [x] 响应式适配

# Task Dependencies
- Task 2 依赖 Task 1（API 需要数据库服务模块）
- Task 3、4 可并行（Modal 和 Tab 布局独立）
- Task 5、6、7 依赖 Task 4（需要 Tab 框架和数据加载）
- Task 8 依赖 Task 3-7（样式覆盖所有组件）
