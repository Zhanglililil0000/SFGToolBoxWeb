# SFG 计算器 Spec

## Why
将 ReferenceCode 中的 PyQt6 桌面版 SFG 计算器迁移为 Web 版，集成到 SFG Tool Box 中，提供石英计算、聚焦计算、Fresnel 计算三个子功能，并额外支持红外波数扫描和曲线绘制。

## What Changes
- 后端新增 4 个计算 API 端点：`/api/calculator/quartz`、`/api/calculator/focus`、`/api/calculator/fresnel`、`/api/calculator/sweep`
- 后端新增 `services/sfg_calculator.py` 计算引擎模块：折射率、Fresnel 因子、χ²、聚焦计算等核心公式
- 前端 CalculatorPage 重写为三 Tab 布局（石英计算 / 聚焦计算 / Fresnel计算）
- 前端支持红外波数扫描，扫描结果用 Recharts 曲线图展示
- 计算逻辑全在后端，前端仅负责参数输入和结果展示

## Impact
- Affected specs: sfg-toolbox-setup（初始化项目）, sfg-data-processing（数据处理页面）
- Affected code: `backend/routers/calculator.py`, `frontend/src/pages/CalculatorPage.tsx`

## ADDED Requirements

### Requirement: 三个子 Tab 布局
计算器页面 SHALL 包含三个横向 Tab：石英计算、聚焦计算、Fresnel计算，用户可点击切换。

#### Scenario: Tab 切换
- **WHEN** 用户点击任一 Tab
- **THEN** 显示对应的输入参数表单和输出结果区域

### Requirement: 石英计算
石英计算 Tab SHALL 接收：可见入射角(°)、红外入射角(°)、可见波长(nm)、红外波数(cm⁻¹)，计算并输出：SFG波长、SFG反射角、红外波长、石英折射率(n_vis/n_IR/n_SFG)、折射角、相干长度、Fresnel因子(Lxx/Lyy for SFG/VIS/IR)、χ²(SSP/SPS/PSS/PPP)及|χ²|²。

#### Scenario: 石英计算
- **WHEN** 用户输入参数并提交（或自动计算）
- **THEN** 所有输出值正确显示；支持波数扫描拓展模式

### Requirement: 聚焦计算
聚焦计算 Tab SHALL 接收：可见/红外/SFG波长、光束直径(mm)、透镜焦距(mm)、离焦距离(mm)、光谱仪焦距(mm)，计算并输出：可见/红外焦点直径(μm)、焦点深度(mm)、离焦光斑直径(μm)、SFG光斑直径(mm)、狭缝焦点大小(μm)。

#### Scenario: 聚焦计算
- **WHEN** 用户输入光学参数并提交
- **THEN** 焦点直径、深度、光斑大小等结果正确显示

### Requirement: Fresnel 计算
Fresnel计算 Tab SHALL 接收：SFG/Vis/IR折射率、可见/红外入射角、可见波长、红外波数，计算并输出：相干长度、完整 Fresnel 因子 Lxx/Lyy/Lzz（SFG/VIS/IR 各三个）、非手性组合(SSP/SPS/PSS/PPP)、手性组合(PSP/SPP/PPS)。

#### Scenario: Fresnel 计算
- **WHEN** 用户输入折射率和角度参数并提交
- **THEN** 所有 Fresnel 因子和组合因子正确显示

### Requirement: 红外波数扫描
石英计算 Tab SHALL 支持勾选启用波数扫描模式，输入起始波数、终止波数、步长，后端对每个波数点计算 Fresnel/Local Factor/χ²，返回数组数据，前端用 Recharts 绘制多条曲线。

#### Scenario: 波数扫描
- **WHEN** 用户勾选"启用波数扫描"，设置范围并提交
- **THEN** 结果区域显示一条或多条 Fresnel 因子 / χ² 随波数变化的曲线图

### Requirement: 后端计算引擎
后端 SHALL 提供 `services/sfg_calculator.py` 模块，包含以下纯函数：
- `calculate_quartz_refractive_index(wavelength_nm)` → 浮点数
- `calculate_refraction_angle(incident_angle_deg, n1, n2)` → 浮点数(度)
- `calculate_fresnel(n1, n2, theta1_deg, theta2_deg, polarization)` → 浮点数
- `calculate_sfg_wavelength(vis_wavelength, ir_wavenumber)` → 浮点数
- `calculate_sfg_angle(sfg_wavelength, vis_angle_deg, vis_wavelength, ir_angle_deg, ir_wavelength)` → 浮点数(度)

#### Scenario: 引擎函数独立可测
- **WHEN** 调用任一引擎函数
- **THEN** 返回正确的计算结果，与参考代码 Matlab/Main.py 一致

### Requirement: Recharts 图表扫描展示
波数扫描模式下，前端 SHALL 使用 Recharts 渲染可配置的折线图，用户可通过复选框选择显示/隐藏不同曲线（如 Lxx_SFG, Lyy_SFG, SSP_YYZ 等）。

#### Scenario: 图表交互
- **WHEN** 扫描结果返回
- **THEN** 图表显示所选曲线，带图例、Tooltip、网格线
