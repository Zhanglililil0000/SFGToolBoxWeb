# Tasks

- [x] Task 1: 后端 — 实现峰刺去除计算模块
  - [x] 创建 `backend/services/` 目录和 `__init__.py`
  - [x] 创建 `backend/services/spike_remove.py`：实现 `remove_spikes(intensity, window_size, threshold_mult)` 函数
  - [x] 单元测试：用测试数据验证峰刺去除效果

- [x] Task 2: 后端 — 实现数据处理 API 接口
  - [x] 更新 `backend/routers/data_processing.py`：新增 `POST /api/data-processing/process` 端点
  - [x] 实现数据解析：接收4组CSV数据（base64字符串）、参数
  - [x] 实现处理管线：解析CSV → 峰刺去除 → 背景扣除 → 归一化 → 波长→波数转换
  - [x] 返回 `{ wavenumber, intensity, name }` JSON

- [x] Task 3: 前端 — 安装 Recharts 图表库
  - [x] 在 `frontend/` 安装 `recharts` 依赖

- [x] Task 4: 前端 — 重写 DataProcessingPage 页面布局与表单
  - [x] 创建参数输入区域：可见光中心波长、样品曝光时间、石英曝光时间、数据名称
  - [x] 创建文件上传区域：四个文件选择器（样品信号/背景、石英信号/背景）
  - [x] 创建"启用宇宙射线去除"勾选框 + 折叠高级选项（窗口大小、阈值倍数）
  - [x] 创建"开始处理"按钮和结果展示区域
  - [x] 通过 fetch POST 将数据发送到后端

- [x] Task 5: 前端 — 实现文件上传后小预览图
  - [x] 前端用 FileReader 读取 CSV，解析数据
  - [x] 对每个已上传文件，在旁边渲染一个小尺寸 Recharts 折线图

- [x] Task 6: 前端 — 实现结果大图和 CSV 下载
  - [x] 收到后端结果后，渲染大尺寸 Recharts 折线图（波数 vs 归一化强度）
  - [x] 实现"下载 CSV"按钮：生成 Blob 并触发下载

- [x] Task 7: 前端 — 页面样式美化
  - [x] 表单区域样式：标签/输入框对齐、圆角卡片背景
  - [x] 文件上传区域样式：卡片式槽位，预览图内嵌
  - [x] 结果区域样式：大图居中、按钮醒目
  - [x] 加载状态与错误提示

# Task Dependencies
- Task 2 依赖 Task 1（后端处理管线需要峰刺去除模块）
- Task 4 依赖 Task 3（前端需要 Recharts）
- Task 5、6、7 依赖 Task 4（页面布局完成后添加交互功能）
- Task 5 和 Task 2 可以并行（前后端独立开发）
