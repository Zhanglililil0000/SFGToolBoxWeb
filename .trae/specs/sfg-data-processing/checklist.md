# Checklist

- [x] 后端 `services/spike_remove.py` 正确实现 MAD 峰刺去除算法，与参考代码逻辑一致
- [x] `POST /api/data-processing/process` 接口接收参数和4组CSV数据，返回正确的波数和归一化强度
- [x] 前端安装 `recharts` 依赖，`npm run build` 无报错
- [x] DataProcessingPage 包含完整的参数输入表单（波长、曝光时间×2、数据名称）
- [x] DataProcessingPage 包含四个文件上传槽位，上传后显示小预览图
- [x] "启用宇宙射线去除"勾选框可用，高级参数（窗口大小、阈值倍数）折叠/展开正常
- [x] CSV 文件自动检测表头（第一行非数值则跳过）
- [x] 点击"开始处理"后，后端正确处理数据并返回结果
- [x] 结果区域渲染大尺寸图表（波数 vs 归一化强度）
- [x] "下载 CSV"按钮可触发浏览器下载，文件名正确
- [x] 归一化公式正确：`((S_sig - S_bg) / T_sample) / ((Q_sig - Q_bg) / T_quartz)`
- [x] 波数公式正确：`(1/λ_quartz - 1/λ_visible) * 10^7`
- [x] 页面有加载状态指示和错误提示
