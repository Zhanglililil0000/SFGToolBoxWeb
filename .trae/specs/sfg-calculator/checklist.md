# Checklist

- [x] `services/sfg_calculator.py` 石英折射率计算与参考代码一致（Sellmeier 方程）
- [x] Fresnel 因子 (xx/yy/zz) 计算与 Matlab/Python 参考代码一致
- [x] `POST /api/calculator/quartz` 单点模式返回正确结果
- [x] `POST /api/calculator/quartz` 扫描模式返回波数数组和因子/χ²数组
- [x] `POST /api/calculator/focus` 返回焦点直径/深度/光斑/狭缝大小
- [x] `POST /api/calculator/fresnel` 返回完整 Fresnel 因子和手性/非手性组合
- [x] CalculatorPage 三个 Tab 可正常切换
- [x] 石英计算表单包含所有输入参数，计算后可显示所有输出值
- [x] 聚焦计算输入和输出均正常
- [x] Fresnel计算输入和输出均正常
- [x] 波数扫描勾选后显示范围参数，提交后渲染 Recharts 折线图
- [x] 扫描图表支持复选框切换显示/隐藏不同曲线
- [x] 页面样式与整体暗色主题一致
- [x] `npm run build` 无报错
