# Checklist

- [x] `services/database.py` SQLite 正确初始化，records 表包含所有字段
- [x] `GET /api/database/records` 返回所有记录 JSON 数组
- [x] `POST /api/database/records` multipart 上传成功，图片保存到 uploads/
- [x] `DELETE /api/database/records/{id}` 删除记录和关联图片
- [x] `GET /api/database/images/{filename}` 正确返回图片文件
- [x] `backend/main.py` 启动时调用 init_db()
- [x] 上传 Modal 包含所有字段，表单验证正常
- [x] Modal 图片选择后预览正常
- [x] DatabasePage 三个 Tab 可正常切换
- [x] 强度序列视图按强度从高到低排列，可切换指标
- [x] 数据库视图搜索框实时筛选记录
- [x] 数据库视图卡片可展开详情，含删除按钮
- [x] 光谱图视图正确渲染峰位竖线，Tooltip 显示信息
- [x] 光谱图 X/Y 轴范围可调整
- [x] 删除操作后三个 Tab 数据同步刷新
- [x] 页面样式与暗色主题一致
- [x] `npm run build` 无报错
