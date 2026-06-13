# SFG 数据库 — 记录详情与编辑弹窗 Spec

## Why
当前数据库页面仅在"数据库视图"Tab 中支持卡片内联展开查看详情，且强度序列和光谱视图中无法查看或编辑记录。需要一个统一的记录详情弹窗，支持在三个视图中均可触发，并具备编辑和保存功能。

## What Changes
- 后端新增 `update_record()` 函数和 `PATCH /api/database/records/{id}` 端点
- 前端新增 `RecordDetailModal` 组件：查看模式（只读）+ 编辑模式（可修改并保存）
- 强度序列 Tab：点击条形或名称触发弹窗
- 数据库视图 Tab：点击卡片触发弹窗（替换原来的内联展开）
- 光谱视图 Tab：点击竖线触发弹窗
- 弹窗支持图片重新上传（编辑模式下）

## Impact
- Affected specs: sfg-database
- Affected code: `backend/services/database.py`, `backend/routers/database.py`, `frontend/src/pages/DatabasePage.tsx`, `frontend/src/pages/DatabasePage.css`

## ADDED Requirements

### Requirement: 记录更新 API
后端 SHALL 提供 `PATCH /api/database/records/{id}` 端点，接收 JSON body 中所有需要更新的字段，返回更新后的记录。图片更新可选。

#### Scenario: 更新记录
- **WHEN** 前端发送 PATCH 请求，包含修改后的字段
- **THEN** 数据库中对应记录被更新，返回成功

#### Scenario: 更新时替换图片
- **WHEN** PATCH 请求中包含新图片文件
- **THEN** 旧图片文件被删除，新图片保存

### Requirement: 记录详情弹窗
三个视图（强度序列、数据库视图、光谱视图）中点击记录 SHALL 弹出详情弹窗，展示该记录的所有字段。

#### Scenario: 从强度序列打开弹窗
- **WHEN** 用户点击强度序列中的某个条形或名称
- **THEN** 弹出该记录的详情弹窗（只读模式）

#### Scenario: 从数据库视图打开弹窗
- **WHEN** 用户点击某张卡片
- **THEN** 弹出该记录的详情弹窗（替换原先的内联展开行为）

#### Scenario: 从光谱视图打开弹窗
- **WHEN** 用户点击光谱图中的某个竖线数据点
- **THEN** 弹出该记录的详情弹窗

### Requirement: 弹窗编辑/保存切换
弹窗右上角 SHALL 包含"编辑"和"关闭"两个按钮。点击"编辑"后，所有字段变为可编辑状态，按钮变为"保存"。点击"保存"后调用 PATCH API 更新记录，成功后恢复只读状态。

#### Scenario: 编辑模式切换
- **WHEN** 用户在弹窗只读模式下点击"编辑"
- **THEN** 所有字段变为输入框，编辑按钮变为保存按钮

#### Scenario: 保存修改
- **WHEN** 用户在编辑模式下点击"保存"
- **THEN** 调用 PATCH API，更新成功则弹窗恢复只读模式并刷新列表

#### Scenario: 取消编辑
- **WHEN** 用户在编辑模式下修改了内容但点击了关闭
- **THEN** 弹出确认提示框，确认后放弃修改并关闭

### Requirement: 编辑模式下图片替换
编辑模式 SHALL 允许用户重新上传光谱图图片，替换原有图片。

#### Scenario: 图片替换
- **WHEN** 用户在编辑模式下选择新图片
- **THEN** 显示新图片预览，保存时旧图片被替换
