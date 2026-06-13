# Tasks

- [x] Task 1: 后端 — 实现 SFG 计算引擎模块
  - [x] 创建 `backend/services/sfg_calculator.py`
  - [x] 实现 `calculate_quartz_refractive_index(wavelength_nm)`: Sellmeier 方程
  - [x] 实现 `calculate_refraction_angle(incident_angle_deg, n1, n2)`: Snell 定律
  - [x] 实现 `calculate_fresnel(n1, n2, theta1_deg, theta2_deg, polarization)`: 三种偏振 (xx/yy/zz)
  - [x] 实现 `calculate_sfg_wavelength(vis_wavelength, ir_wavenumber)`
  - [x] 实现 `calculate_sfg_angle(sfg_wavelength, vis_angle_deg, vis_wavelength, ir_angle_deg, ir_wavelength)`
  - [x] 单元测试验证与参考代码输出一致 (82 tests passed)

- [x] Task 2: 后端 — 实现石英计算 API (`POST /api/calculator/quartz`)
  - [x] 接收参数：vis_angle, ir_angle, vis_wavelength, ir_wavenumber, enable_sweep, sweep_start, sweep_end, sweep_step
  - [x] 单点模式：返回 SFG波长/角度/折射率/相干长度/Fresnel因子/χ²
  - [x] 扫描模式：对每个波数点计算，返回波数数组 + 各因子/χ² 数组
  - [x] 返回 JSON 结构：`{ single: {...}, sweep: {...} }`

- [x] Task 3: 后端 — 实现聚焦计算 API (`POST /api/calculator/focus`)
  - [x] 接收参数：vis_wavelength, ir_wavelength, sfg_wavelength, vis_spot_size, ir_spot_size, vis_focal, ir_focal, sfg_focal, vis_defocus, ir_defocus, spectrometer_focal
  - [x] 计算并返回焦点直径/深度/光斑/狭缝大小

- [x] Task 4: 后端 — 实现 Fresnel 计算 API (`POST /api/calculator/fresnel`)
  - [x] 接收参数：n_sfg, n_vis, n_ir, vis_angle, ir_angle, vis_wavelength, ir_wavenumber
  - [x] 计算并返回完整 Fresnel Lxx/Lyy/Lzz (SFG/VIS/IR) + 非手性/手性组合因子

- [x] Task 5: 前端 — 重写 CalculatorPage 三 Tab 布局
  - [x] Tab 切换组件（石英计算 / 聚焦计算 / Fresnel计算）
  - [x] 石英计算表单：vis_angle, ir_angle, vis_wavelength, ir_wavenumber + 波数扫描参数
  - [x] 聚焦计算表单：11个光学参数输入框
  - [x] Fresnel计算表单：7个参数输入框
  - [x] "计算"按钮触发 API 请求

- [x] Task 6: 前端 — 石英计算结果展示 + 波数扫描图表
  - [x] 单点结果以卡片展示（24个值，2列网格）
  - [x] 扫描模式下渲染 Recharts 折线图，支持复选框选择显示/隐藏曲线
  - [x] 14条曲线可选，胶囊型 toggle 芯片

- [x] Task 7: 前端 — 聚焦计算结果展示 + Fresnel 计算结果展示
  - [x] 聚焦结果：焦点直径、深度、光斑等以只读卡片展示
  - [x] Fresnel结果：4组表格（Fresnel因子 + 非手性 + 手性）

- [x] Task 8: 前端 — CalculatorPage 样式美化
  - [x] Tab 标签样式：选中高亮，匹配暗色主题
  - [x] 表单区域：2列网格、圆角卡片、聚焦边框
  - [x] 结果区域：数据卡片/表格、图表容器
  - [x] 响应式适配 (768px)

# Task Dependencies
- Task 2, 3, 4 均依赖 Task 1（计算引擎模块）
- Task 6 依赖 Task 2 和 Task 5
- Task 7 依赖 Task 3, 4 和 Task 5
- Task 8 依赖 Task 5, 6, 7
