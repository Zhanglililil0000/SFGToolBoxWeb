# SFG Tool Box

SFG（Sum Frequency Generation，和频振动光谱）数据处理与分析工具箱。提供从原始光谱数据标准化处理、SFG 参数计算（Fresnel 因子、二阶非线性极化率 χ²、聚焦参数）到光谱数据库管理与可视化的一站式 Web 应用。

---

## 功能概览

| 模块 | 路由 | 说明 |
|------|------|------|
| **数据处理** | `/data-processing` | SFG 光谱数据批处理：归一化、去尖峰（spike removal）、波数换算 |
| **SFG 计算器** | `/calculator` | 三个子选项卡：石英计算、聚焦计算、Fresnel 计算 + 红外波数扫描 |
| **数据库** | `/database` | SFG 光谱数据库：上传/编辑/删除、三种可视化视图（强度序列 / 数据库视图 / 光谱视图） |

### 数据处理

- 上传四个 CSV 文件（样品信号、样品背景、石英信号、石英背景）
- 可选去尖峰功能（滑动窗口 + MAD 算法）
- 输出归一化 SFG 强度与波数，生成 CSV 和 PNG 图表
- 图表使用 Recharts 渲染，支持可配置颜色和标题

### SFG 计算器

| 子标签 | 输入 | 输出 |
|--------|------|------|
| **石英计算** | 可见/红外入射角、可见波长、红外波数 | SFG 波长/角度、石英折射率、相干长度、Fresnel 因子（Lxx/Lyy）、χ²（SSP/SPS/PSS/PPP）及 \|χ²\|² |
| **聚焦计算** | 波长、光束直径、透镜焦距、离焦距离、光谱仪焦距 | 焦点直径（μm）、焦点深度（mm）、离焦光斑直径、SFG 光斑尺寸、狭缝焦点大小 |
| **Fresnel 计算** | SFG/Vis/IR 折射率、角度、波长、波数 | 完整 Fresnel Lxx/Lyy/Lzz + 7 个非手性组合 + 6 个手性组合 |

- 石英计算支持**红外波数扫描**：设置范围后绘制 Fresnel 因子 / χ² 随波数变化曲线
- 所有公式源自文献 Sellmeier 方程与 Shen 等人的 SFG 理论

### 数据库

| 视图 | 说明 |
|------|------|
| **强度序列** | 水平条形图，按归一化强度或有效 χ² 从高到低排列，支持强度上下限筛选 |
| **数据库视图** | 卡片列表 + 模糊搜索（名称/分子式/分子基团）+ 点击查看/编辑详情 |
| **光谱视图** | 波数 vs 强度竖线图，自定义 X/Y 轴范围，悬停显示记录名称和峰信息 |

- **记录字段**：名称、分子式、归一化强度、有效 χ²、峰位置、峰宽度、振动模式归属、分子基团、可见/红外入射角、实验能量、测试仪器、相关文献、上传者、光谱图
- 支持单条上传（Modal 表单 + 图片文件）和 TXT 批量导入
- 点击任意视图中的条目可打开详情弹窗，支持编辑和保存（PATCH API）
- 完整的数据导出为 TXT 字典格式，方便备份和分享

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite + React Router + Recharts |
| 后端 | Python 3.10+ + FastAPI + Uvicorn |
| 科学计算 | NumPy + SciPy |
| 数据库 | SQLite（本地文件存储） |
| 图片存储 | 文件系统（`backend/uploads/`） |

---

## 快速开始

### 环境要求

- **Python** 3.10+（推荐 Anaconda 环境 `D:\Anaconda\envs\py310`）
- **Node.js** 18+
- Windows / Linux / macOS

### Windows 本地运行

```batch
# 双击项目根目录下的 run.bat
run.bat
```

`run.bat` 会自动检查环境（Python/Node.js）、安装依赖、启动后端（FastAPI，端口 8000）和前端（Vite Dev Server，端口 5173）。

启动后访问：
- 前端开发：http://localhost:5173
- 后端 API 文档：http://localhost:8000/docs

### Linux / macOS 本地运行

```bash
# 后端
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### 生产模式

生产环境下 FastAPI 直接托管前端构建产物，只需运行一个 Python 进程：

```bash
cd frontend && npm run build && cd ..
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000 即可使用完整应用。

---

## 项目结构

```
SFG Tool Box/
├── backend/
│   ├── main.py                    # FastAPI 入口，lifespan 初始化 DB
│   ├── requirements.txt           # Python 依赖
│   ├── routers/
│   │   ├── health.py              # /api/health
│   │   ├── data_processing.py     # /api/data-processing/process
│   │   ├── calculator.py          # /api/calculator/quartz|focus|fresnel
│   │   └── database.py            # /api/database/records|export|import|images
│   ├── services/
│   │   ├── spike_remove.py        # 去尖峰算法（滑动窗口 + MAD）
│   │   ├── sfg_calculator.py      # SFG 光学计算引擎（Sellmeier/Fresnel/χ²）
│   │   └── database.py            # SQLite CRUD + 图片文件管理
│   ├── sfg_database.db            # SQLite 数据库（自动创建）
│   └── uploads/                   # 光谱图图片存储目录
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar、Footer
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # 主页（功能入口卡片）
│   │   │   ├── DataProcessingPage.tsx  # 数据处理页面
│   │   │   ├── CalculatorPage.tsx      # SFG 计算器（三子 Tab）
│   │   │   └── DatabasePage.tsx        # SFG 数据库（三子 Tab + Modal）
│   │   ├── App.tsx                # React Router 路由配置
│   │   └── index.css              # CSS 变量与全局样式
│   ├── package.json
│   └── vite.config.ts             # Vite 配置（含 API 代理）
├── run.bat                        # Windows 一键启动脚本
├── deploy.sh                      # Linux 服务器一键部署脚本
├── sfg-toolbox.service            # Systemd 服务模板
└── .gitignore
```

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/data-processing/process` | SFG 数据处理（CSV 上传、归一化、去尖峰） |
| POST | `/api/calculator/quartz` | 石英计算（支持单点和波数扫描） |
| POST | `/api/calculator/focus` | 聚焦参数计算 |
| POST | `/api/calculator/fresnel` | Fresnel 因子完整计算 |
| GET | `/api/database/records` | 获取所有数据库记录 |
| POST | `/api/database/records` | 新增记录（multipart，JSON + 图片） |
| PATCH | `/api/database/records/{id}` | 更新记录 |
| DELETE | `/api/database/records/{id}` | 删除记录 |
| GET | `/api/database/images/{filename}` | 获取光谱图片 |
| GET | `/api/database/export` | 导出全部记录为 TXT |
| POST | `/api/database/import` | 从 TXT 批量导入记录 |

---

## 数据库导入/导出

### 导出格式

点击"导出数据"按钮下载 `sfg_backup.txt`，每行一条记录，字典格式：

```
{名称:DMSO, 分子式:C2H6OS, 归一化强度:0.5000, 有效χ²:1.2300e-04, 峰位置:2900, 峰宽度:50, 振动模式:CH3 stretch, 分子基团:methyl, 可见入射角:45, 红外入射角:55, 实验能量:10μJ, 测试仪器:SFG setup, 相关文献:Ref 1, 上传者:Zhang}
```

### 导入格式

准备相同格式的 TXT 文件，点击"导入数据"选择文件即可批量导入。空行和 `#` 开头的注释行会被忽略。图片需单独通过编辑弹窗上传。

---

## 部署到云服务器

推荐腾讯云轻量应用服务器（2核2G，约 60-80 元/月）。购买后：

1. 安全组放行端口 `22`、`80`、`443`、`8000`
2. 上传代码：`scp -r ./* root@IP:/opt/sfg-toolbox/`
3. 一键部署：`cd /opt/sfg-toolbox && chmod +x deploy.sh && sudo ./deploy.sh`

部署后访问 `http://服务器IP:8000`，服务开机自启、崩溃自动重启。

详细步骤见项目内的 `deploy.sh` 脚本注释和 `sfg-toolbox.service` 配置。

---

## 开发

```bash
# 前端开发（带 HMR）
cd frontend && npm run dev

# 后端开发（带自动重载）
cd backend && python -m uvicorn main:app --reload --port 8000

# 构建前端
cd frontend && npm run build

# TypeScript 类型检查
cd frontend && tsc -b
```

---

## 规范与设计文档

所有功能模块的详细规范文档位于 `.trae/specs/` 目录下：

| 目录 | 内容 |
|------|------|
| `sfg-toolbox-setup/` | 项目初始化、路由、导航栏 |
| `sfg-data-processing/` | 数据处理页面功能设计 |
| `sfg-calculator/` | SFG 计算器三 Tab + 波数扫描 |
| `sfg-database/` | SQLite 数据库、三视图、上传 Modal |
| `sfg-database-edit/` | 记录详情弹窗、编辑/保存、导入/导出 |
