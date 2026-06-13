# Checklist

- [x] `update_record()` 正确更新数据库记录，且支持部分字段更新
- [x] `PATCH /api/database/records/{id}` 端点接收 JSON + 可选图片，返回更新成功
- [x] 更新时传入新图片会删除旧图片文件
- [x] RecordDetailModal 只读模式展示所有字段
- [x] 点击"编辑"后所有字段变为输入框
- [x] 编辑模式下可重新选择光谱图片
- [x] 点击"保存"调用 PATCH API，成功后恢复只读
- [x] 关闭弹窗时有未保存修改则确认提示
- [x] 强度序列 Tab 点击条形/名称可打开弹窗
- [x] 数据库视图 Tab 点击卡片打开弹窗（不再内联展开）
- [x] 光谱视图 Tab 点击竖线打开弹窗
- [x] 弹窗编辑/保存/关闭按钮与暗色主题一致
- [x] `npm run build` 无报错
