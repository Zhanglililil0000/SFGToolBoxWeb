# SFG 光谱数据预处理 Spec

## Why
为 SFG Tool Box 提供 SFG 光谱数据预处理功能：将实验采集的样品/石英信号和背景数据进行背景扣除、宇宙射线去除、波长→波数转换、信号归一化，生成可直接用于分析的归一化光谱数据。

## What Changes
- 后端新增 `/api/data-processing/process` POST 接口，实现完整的数据处理管线
- 后端新增峰刺去除（宇宙射线去除）计算模块，复用 SpikeRemove 算法
- 前端 DataProcessingPage 替换占位内容：参数表单 + 4文件上传 + 小预览图 + 结果大图 + CSV下载
- 前端使用 Recharts 渲染小预览图和结果大图

## Impact
- Affected specs: sfg-toolbox-setup（初始化项目）
- Affected code: `backend/routers/data_processing.py`, `frontend/src/pages/DataProcessingPage.tsx`

## ADDED Requirements

### Requirement: 参数输入表单
用户 SHALL 能够输入处理所需参数：可见光中心波长（nm）、样品曝光时间（s）、石英曝光时间（s）、自定义数据名称。

#### Scenario: 输入参数
- **WHEN** 用户在表单中填写可见光中心波长、样品曝光时间、石英曝光时间和数据名称
- **THEN** 参数被正确记录并随处理请求发送到后端

### Requirement: 四文件上传
用户 SHALL 能够分别上传四个 CSV 数据文件：样品信号、样品背景、石英信号、石英背景。上传后 SHALL 显示小的预览图。

#### Scenario: 上传并预览文件
- **WHEN** 用户选择并上传一个 CSV 文件
- **THEN** 前端读取 CSV 内容，在对应的文件槽位旁渲染一个小尺寸折线图预览

#### Scenario: 自动检测表头
- **WHEN** CSV 文件第一行包含非数值内容
- **THEN** 系统自动将其识别为表头并跳过；若第一行是数值，则视为无表头

### Requirement: 宇宙射线去除控制
用户 SHALL 能够通过勾选框选择是否启用宇宙射线去除。高级参数（窗口大小、阈值倍数）默认折叠。

#### Scenario: 启用峰刺去除
- **WHEN** 用户勾选"启用宇宙射线去除"并提交处理
- **THEN** 后端对四组数据分别执行峰刺去除后，再进行后续计算

#### Scenario: 调整高级参数
- **WHEN** 用户展开高级选项并修改窗口大小或阈值倍数
- **THEN** 修改后的参数随处理请求发送到后端

### Requirement: 数据处理管线
后端 SHALL 按顺序执行以下处理步骤：
1. 若启用峰刺去除，对四组二维数据分别处理
2. 计算归一化强度：`Y = ((S_sig - S_bg) / T_sample) / ((Q_sig - Q_bg) / T_quartz)`
3. 生成波数 X 轴：`wavenumber = (1/λ_quartz - 1/λ_visible) * 10^7`
4. 返回处理后的波数和归一化强度数组

#### Scenario: 完整处理流程
- **WHEN** 前端发送包含四个文件数据和参数的 POST 请求
- **THEN** 后端返回 `{ wavenumber: [...], intensity: [...], name: "..." }` JSON

### Requirement: 结果展示与下载
处理后 SHALL 显示波数 vs 归一化强度的大尺寸图表，并提供 CSV 数据下载按钮（文件名为用户自定义名称）。

#### Scenario: 查看和下载结果
- **WHEN** 后端返回处理结果
- **THEN** 页面下方渲染大尺寸结果图表，用户可点击下载按钮导出 CSV（两列：wavenumber, intensity）

### Requirement: 峰刺去除算法
峰刺去除模块 SHALL 使用滑动窗口中位数+绝对偏差（MAD）方法检测异常值，并用线性插值替换。

#### Scenario: 峰刺去除流程
- **WHEN** 接收一维强度数组、窗口大小、阈值倍数
- **THEN** 对每个点计算其邻域窗口内的中位数和 MAD，超过 `median + threshold * 1.4826 * MAD` 的点被标记为异常，用邻域线性插值替换
