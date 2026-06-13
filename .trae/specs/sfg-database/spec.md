# SFG 数据库 Spec

## Why
为 SFG Tool Box 提供可搜索、可排序的 SFG 光谱数据库，支持记录的上传/删除，以及三种可视化浏览方式（强度序列、数据库视图、光谱图），帮助研究人员管理和对比 SFG 实验数据。

## What Changes
- 后端使用 SQLite 持久化存储，新建 `backend/sfg_database.db`
- 后端新增 `backend/services/database.py`：记录 CRUD + 图片文件管理
- 后端新增 REST API：GET/POST/DELETE `/api/database/records`，GET `/api/database/images/{filename}`
- 前端 DatabasePage 重写为三 Tab 布局（强度序列 / 数据库视图 / 光谱图）
- 前端新增上传 Modal 悬浮窗口
- 图片存储于 `backend/uploads/` 目录

## Impact
- Affected specs: sfg-toolbox-setup（初始化项目）
- Affected code: `backend/routers/database.py`, `backend/main.py`, `frontend/src/pages/DatabasePage.tsx`

## ADDED Requirements

### Requirement: SQLite 数据库
后端 SHALL 使用 SQLite 数据库 `backend/sfg_database.db` 存储 SFG 记录，包含自增 ID 和创建时间戳。

#### Scenario: 数据库自动初始化
- **WHEN** 后端首次启动
- **THEN** 自动创建数据库文件和 records 表（如不存在）

### Requirement: 记录数据模型
每条记录 SHALL 包含：名称、分子式、对石英归一化强度、有效二阶非线性极化率、光谱峰位置(cm⁻¹)、光谱峰宽度(cm⁻¹)、振动模式归属、分子基团、可见入射角、红外入射角、实验能量、测试仪器系统、相关文献、上传者、光谱图路径。

#### Scenario: 记录字段完整性
- **WHEN** 用户通过 API 上传记录
- **THEN** 所有字段被正确存储到数据库

### Requirement: 图片文件存储
光谱图 SHALL 以文件形式存储于 `backend/uploads/` 目录，数据库仅保存文件名路径。API 支持通过文件名获取图片。

#### Scenario: 图片上传和获取
- **WHEN** 用户上传 JPG/PNG 图片
- **THEN** 文件保存到 uploads/ 目录，GET `/api/database/images/{filename}` 可访问

### Requirement: 记录 CRUD
后端 SHALL 提供 GET（全量列表）、POST（新增）、DELETE（按ID删除）三个操作端点。

#### Scenario: 获取所有记录
- **WHEN** 前端请求 GET `/api/database/records`
- **THEN** 返回所有记录的 JSON 数组

#### Scenario: 新增记录
- **WHEN** 前端 POST multipart/form-data（含 JSON data 字段 + 图片文件）
- **THEN** 记录写入数据库，图片保存到 uploads/，返回新记录 ID

#### Scenario: 删除记录
- **WHEN** 前端 DELETE `/api/database/records/{id}`
- **THEN** 对应记录从数据库删除，关联图片文件一并删除

### Requirement: 上传悬浮窗口 (Modal)
前端 SHALL 提供 Modal 悬浮窗口，包含所有字段的输入控件和图片文件选择器，点击确认后调用 API 上传。

#### Scenario: 打开和提交 Modal
- **WHEN** 用户点击"上传记录"按钮
- **THEN** Modal 弹出，填写完毕后提交，记录被上传，Modal 关闭并刷新列表

### Requirement: 强度序列视图 (Tab 1)
以垂直柱状图展示所有记录，按 `normalized_intensity` 或 `effective_chi2` 从高到低排序，可视化强度差别。支持切换排序指标。

#### Scenario: 强度序列渲染
- **WHEN** 用户切换到"强度序列"Tab
- **THEN** 所有记录以条形图从高到低排列，X=记录名，Y=所选强度指标

### Requirement: 数据库视图 (Tab 2)
以卡片列表展示所有记录，支持按名称/分子式/分子基团关键词搜索，显示每条记录的核心字段信息。

#### Scenario: 搜索和查看
- **WHEN** 用户在搜索框中输入关键词
- **THEN** 卡片列表实时筛选匹配的记录

#### Scenario: 查看详情
- **WHEN** 用户点击某张卡片
- **THEN** 展开或弹出查看完整字段（含光谱图预览）

### Requirement: 光谱图视图 (Tab 3)
以波数为 X 轴、归一化强度为 Y 轴绘制散点/竖线图，每条记录在其峰位置处显示一条竖线（高度=强度）。鼠标悬停显示简要信息。支持自定义 X/Y 轴范围。

#### Scenario: 光谱图渲染
- **WHEN** 用户切换到"光谱图"Tab
- **THEN** 所有记录在图表中显示为峰位竖线

#### Scenario: 轴范围调整
- **WHEN** 用户修改 X 轴或 Y 轴范围输入值
- **THEN** 图表更新显示指定范围内的数据

### Requirement: 三 Tab 与数据同步
三个 Tab 的数据 SHALL 保持同步：在任何 Tab 执行删除操作后，其他 Tab 的数据自动刷新。

#### Scenario: 删除同步
- **WHEN** 用户在数据库视图中删除一条记录
- **THEN** 强度序列和光谱图中的对应数据同步移除
