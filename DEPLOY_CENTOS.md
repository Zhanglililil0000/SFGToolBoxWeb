# SFG Tool Box — CentOS 7.9 云服务器部署操作指南

> **面向读者**：有基础运维经验的科研人员  
> **适用环境**：CentOS 7.9 64bit，2核 2GB 内存，50GB 系统盘  
> **预计耗时**：首次部署约 30–45 分钟（含 Python 源码编译）；后续更新 2–5 分钟

---

## 目录

1. [前置准备](#1-前置准备)
2. [上传代码到服务器](#2-上传代码到服务器)
3. [一键自动部署](#3-一键自动部署)
4. [验证部署是否成功](#4-验证部署是否成功)
5. [排错指南（FAQ）](#5-排错指南faq)
6. [日常运维](#6-日常运维)
7. [附录：部署脚本执行流程详解](#7-附录部署脚本执行流程详解)

---

## 1. 前置准备

### 1.1 云服务器安全组放行端口

登录云服务商控制台 → 安全组规则 → 添加入方向规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH 远程登录 |
| TCP | 8000 | 0.0.0.0/0 | SFG Tool Box Web 服务 |

> 生产环境建议将来源 IP 限制为公司/校园网 IP 段，而不是 `0.0.0.0/0`。

### 1.2 SSH 登录服务器

在你的本地电脑打开终端（Windows 用 PowerShell 或 CMD，Mac/Linux 用 Terminal）：

```bash
ssh root@<服务器公网IP>
```

CentOS 7.9 默认防火墙 `firewalld` 通常已开启。可以先检查一下状态：

```bash
systemctl status firewalld
# 如果显示 "Active: inactive (dead)"，可以启动：
systemctl start firewalld
systemctl enable firewalld
```

---

## 2. 上传代码到服务器

### 2.1 打包项目文件（在本地电脑执行）

将整个项目目录（排除不需要的文件）上传。**在项目根目录 `d:\TraeProject\Project10SFGToolBox\` 执行**：

```bash
# Windows (PowerShell) — 打包为 tar.gz
tar -czf sfg-toolbox.tar.gz `
  --exclude='node_modules' `
  --exclude='dist' `
  --exclude='__pycache__' `
  --exclude='*.pyc' `
  --exclude='.git' `
  --exclude='venv' `
  --exclude='sfg_database.db' `
  .
```

> **注意**：`sfg_database.db` 是本地数据库文件，默认不打包上传。如果你想保留本地测试数据，移除 `--exclude='sfg_database.db'` 这一行。

### 2.2 上传文件

```bash
scp sfg-toolbox.tar.gz root@<服务器公网IP>:/opt/
```

### 2.3 在服务器上解压

SSH 到服务器后执行：

```bash
mkdir -p /opt/sfg-toolbox
cd /opt
tar -xzf sfg-toolbox.tar.gz -C /opt/sfg-toolbox/
rm sfg-toolbox.tar.gz
```

验证代码已上传：

```bash
ls /opt/sfg-toolbox/backend/main.py
# 输出: /opt/sfg-toolbox/backend/main.py  ← 文件存在即为成功
```

---

## 3. 一键自动部署

项目根目录已经准备好了全自动部署脚本 `deploy.sh`。

```bash
cd /opt/sfg-toolbox
chmod +x deploy.sh
sudo ./deploy.sh
```

脚本会自动完成以下步骤（约 20–35 分钟）：

| 步骤 | 操作 | 预计耗时 |
|------|------|----------|
| 0/6 | 验证代码存在 | < 1 秒 |
| 1/6 | 安装系统编译工具（gcc、openblas-devel 等） | 2–5 分钟 |
| 2/6 | 从源码编译 Python 3.10.14 | **5–10 分钟** |
| 3/6 | 安装 Node.js 20 | 1–2 分钟 |
| 4/6 | 创建 Python venv + pip 安装依赖 | 2–5 分钟 |
| 5/6 | 构建 React 前端 | 1–3 分钟 |
| 6/6 | 防火墙放行 8000 端口 + 创建 systemd 服务 | < 30 秒 |

> **首次部署建议**：在终端保持 SSH 连接稳定，编译 Python 期间不要断开。

### 后续更新（增量部署）

当你修改了代码，需要更新服务器时：

```bash
# 本地重新打包上传（步骤同 2.1–2.3）后，在服务器上执行：
cd /opt/sfg-toolbox
sudo ./deploy.sh --update
```

增量模式会**跳过**系统依赖安装、Python 编译、Node.js 安装，仅执行：

- Python venv 重建依赖
- 前端重新构建
- 重启 systemd 服务

耗时约 2–5 分钟。

---

## 4. 验证部署是否成功

### 4.1 检查 systemd 服务状态

```bash
systemctl status sfg-toolbox
```

正常输出示例：

```
● sfg-toolbox.service - SFG Tool Box
   Loaded: loaded (/etc/systemd/system/sfg-toolbox.service; enabled)
   Active: active (running) since ...
```

| 状态 | 含义 |
|------|------|
| `active (running)` | ✅ 正常运行 |
| `active (exited)` | ❌ 进程立即退出，查看日志排错 |
| `inactive (dead)` | ❌ 未启动，执行 `systemctl start sfg-toolbox` |

### 4.2 检查端口监听

```bash
ss -tlnp | grep 8000
```

应看到类似 `LISTEN 0 2048 *:8000` 的输出。

### 4.3 本地 curl 测试

```bash
curl -s http://localhost:8000/api/health
```

应返回 JSON：

```json
{"status":"ok"}
```

### 4.4 浏览器访问

在浏览器中打开：

```
http://<服务器公网IP>:8000
```

应该能看到 SFG Tool Box 主页。API 文档地址：

```
http://<服务器公网IP>:8000/docs
```

### 4.5 检查防火墙状态

```bash
firewall-cmd --list-ports
```

应看到 `8000/tcp` 在列表中。

---

## 5. 排错指南（FAQ）

### 5.1 浏览器访问超时 / 无法连接

| 排查项 | 命令 |
|--------|------|
| 服务器是否在运行 | `systemctl status sfg-toolbox` |
| 端口是否监听 | `ss -tlnp \| grep 8000` |
| 防火墙是否放行 | `firewall-cmd --list-ports` |
| 云安全组是否放行 | 登录云控制台 → 安全组规则 |

如果 `firewalld` 没有放行，手动执行：

```bash
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --reload
```

### 5.2 systemd 服务 `active (exited)` / 启动失败

查看详细日志：

```bash
journalctl -u sfg-toolbox -n 50 --no-pager
```

常见原因：

| 日志关键字 | 原因 | 解决 |
|------------|------|------|
| `ModuleNotFoundError: No module named 'fastapi'` | venv 依赖未安装 | 重新执行 `deploy.sh` |
| `sqlite3.OperationalError: no such table` | 数据库未初始化 | 自动修复（FastAPI lifespan 会执行 `init_db()`） |
| `Address already in use` | 8000 端口已被占用 | `kill` 旧进程 或 `systemctl restart sfg-toolbox` |
| `libpython3.10.so.1.0: cannot open shared object file` | Python 共享库未注册 | 检查 `/etc/ld.so.conf.d/python3.10.conf`，执行 `ldconfig` |

### 5.3 numpy / scipy 安装失败

通常是缺少线性代数库：

```bash
yum install -y openblas-devel lapack-devel
# 然后重新安装 Python 包
cd /opt/sfg-toolbox/backend
source venv/bin/activate
pip install -r requirements.txt
```

如果还是有编译错误，尝试不加网络优化：

```bash
pip install --no-cache-dir -r requirements.txt
```

### 5.4 Python 编译失败

确保已安装所有编译依赖：

```bash
yum groupinstall -y "Development Tools"
yum install -y openssl-devel bzip2-devel libffi-devel zlib-devel \
    sqlite-devel readline-devel xz-devel
```

如果 `make` 报 `fatal error: Python.h: No such file or directory`，通常是依赖未完整安装，重新执行上述 yum 命令。

### 5.5 页面能打开但加载不出数据 / API 返回 500

检查后端日志：

```bash
journalctl -u sfg-toolbox -f
```

通常是数据库写入权限问题：

```bash
chown -R root:root /opt/sfg-toolbox/backend
chmod -R 755 /opt/sfg-toolbox/backend/uploads
```

### 5.6 内存不足（2GB 内存编译 Python 可能 OOM）

- 编译 Python 时避免同时运行其他服务
- 添加 swap 作为缓冲：

```bash
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
```

---

## 6. 日常运维

### 6.1 查看服务状态

```bash
systemctl status sfg-toolbox
```

### 6.2 查看实时日志

```bash
journalctl -u sfg-toolbox -f
```

按 `Ctrl+C` 退出。

### 6.3 重启服务

```bash
systemctl restart sfg-toolbox
```

### 6.4 停止 / 启动服务

```bash
systemctl stop sfg-toolbox      # 停止
systemctl start sfg-toolbox     # 启动
```

### 6.5 更新代码后部署

```bash
# 本地打包 → 上传 → 解压（参考第 2 节），然后在服务器上：
cd /opt/sfg-toolbox
sudo ./deploy.sh --update
```

### 6.6 备份数据库

服务器上的数据库文件位于：

```
/opt/sfg-toolbox/backend/sfg_database.db
```

定期备份：

```bash
cp /opt/sfg-toolbox/backend/sfg_database.db ~/backup/sfg_database_$(date +%Y%m%d).db
```

### 6.7 磁盘空间监控

```bash
df -h /opt/sfg-toolbox
# 注意 uploads/ 目录中的图片文件大小
du -sh /opt/sfg-toolbox/backend/uploads
```

---

## 7. 附录：部署脚本执行流程详解

执行 `sudo ./deploy.sh` 时，脚本按以下流程自动执行：

```
                    开始
                     │
              ┌──────▼──────┐
              │ 0. 验证代码   │
              │ backend/main.py 存在?  │
              └──────┬──────┘
                     │ 是
              ┌──────▼──────────────┐
              │ 1. yum 安装编译工具链  │ ← --update 模式跳过
              │   Development Tools   │
              │   openblas-devel...   │
              └──────┬──────────────┘
                     │
              ┌──────▼──────────────┐
              │ 2. 检查 Python 3.10? │
              │   是 → 跳过          │
              │   否 → 下载源码编译    │ ← --update 模式若 Python 不存在则报错
              │   ./configure        │
              │   make -j$(nproc)    │
              │   make altinstall    │
              └──────┬──────────────┘
                     │
              ┌──────▼──────────────┐
              │ 3. 检查 Node.js?     │ ← --update 模式跳过
              │   是 → 跳过          │
              │   否 → NodeSource RPM │
              │   yum install nodejs │
              └──────┬──────────────┘
                     │
              ┌──────▼──────────────┐
              │ 4. Python venv 创建  │
              │   pip install deps   │
              │   (fastapi, uvicorn, │
              │    numpy, scipy)     │
              └──────┬──────────────┘
                     │
              ┌──────▼──────────────┐
              │ 5. npm install      │
              │   npm run build     │
              │   → 生成 dist/      │
              └──────┬──────────────┘
                     │
              ┌──────▼──────────────┐
              │ 6. 防火墙放行 8000   │ ← --update 模式跳过
              │   创建 systemd 服务   │
              │   systemctl enable   │
              │   systemctl restart  │
              └──────┬──────────────┘
                     │
                  完成 🎉
```

### 关键配置说明

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Python 安装路径 | `/usr/local/bin/python3.10` | 使用 `altinstall` 避免覆盖系统 Python |
| venv 路径 | `/opt/sfg-toolbox/backend/venv` | 隔离依赖 |
| 前端构建产物 | `/opt/sfg-toolbox/frontend/dist` | FastAPI 在 `main.py` 中直接托管 |
| 数据库文件 | `/opt/sfg-toolbox/backend/sfg_database.db` | SQLite，首次启动自动创建 |
| 上传图片 | `/opt/sfg-toolbox/backend/uploads/` | 用户上传的光谱图 |
| 服务端口 | `8000` | 可在 `deploy.sh` 顶部修改 `PORT` 变量 |
| systemd 服务 | `/etc/systemd/system/sfg-toolbox.service` | 开机自启、崩溃自动重启 |

### systemd 服务配置

部署脚本自动生成的 `/etc/systemd/system/sfg-toolbox.service`：

```ini
[Unit]
Description=SFG Tool Box
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sfg-toolbox/backend
ExecStart=/opt/sfg-toolbox/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3
Environment=LD_LIBRARY_PATH=/usr/local/lib

[Install]
WantedBy=multi-user.target
```

- `Restart=always`：进程崩溃后 3 秒自动重启
- `WantedBy=multi-user.target`：系统启动时自动运行
- `Environment=LD_LIBRARY_PATH`：确保能找到 Python 编译出的共享库

---

> **部署完成后**，访问 `http://<服务器IP>:8000` 即可使用 SFG Tool Box。如需 HTTPS，建议在服务器前配置 Nginx 反向代理 + Let's Encrypt 证书（超出本文档范围，可另行咨询）。
