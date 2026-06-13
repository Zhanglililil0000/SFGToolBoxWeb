# Tasks

- [x] Task 1: 后端 — 实现记录更新功能
  - [x] 在 `backend/services/database.py` 新增 `update_record(record_id, data)` 函数
  - [x] 在 `backend/routers/database.py` 新增 `PATCH /api/database/records/{id}` 端点
  - [x] 更新时若传入新图片则替换旧图片文件

- [x] Task 2: 前端 — 创建 RecordDetailModal 组件
  - [x] 在 DatabasePage.tsx 中实现弹窗组件（查看模式 + 编辑模式）
  - [x] 只读模式：所有字段以标签+值展示，右上角"编辑"和"关闭"按钮
  - [x] 编辑模式：所有字段变为输入框，图片可重新选择，"编辑"按钮变为"保存"按钮
  - [x] 保存时调用 PATCH API，成功后恢复只读并刷新列表
  - [x] 关闭时若有未保存修改则确认提示

- [x] Task 3: 前端 — 强度序列 Tab 接入弹窗
  - [x] BarChart 的 Bar 添加 onClick 事件，传递记录 ID
  - [x] 点击后打开 RecordDetailModal

- [x] Task 4: 前端 — 数据库视图 Tab 接入弹窗
  - [x] 移除现有的内联展开/折叠逻辑（expandedId）
  - [x] 点击卡片改为打开 RecordDetailModal
  - [x] 保留搜索筛选功能

- [x] Task 5: 前端 — 光谱视图 Tab 接入弹窗
  - [x] BarChart 的 Bar 添加 onClick 事件
  - [x] 点击后打开 RecordDetailModal

- [x] Task 6: 样式调整
  - [x] Modal 编辑模式输入框样式
  - [x] 编辑/保存/关闭按钮样式
  - [x] 弹窗内图片预览样式
  - [x] 构建验证 `npm run build`

# Task Dependencies
- Task 2 依赖 Task 1（弹窗保存需要后端 PATCH API）
- Task 3、4、5 依赖 Task 2（三个 Tab 均依赖弹窗组件）
- Task 6 可在 Task 2 完成后并行进行
