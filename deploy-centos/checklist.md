# Checklist

- [ ] `deploy.sh` 在 CentOS 7.9 上可执行（`bash -n deploy.sh` 语法检查通过）
- [ ] 脚本检查 Python 3.10 已安装时跳过编译
- [ ] 脚本安装 gcc/gcc-gfortran/openblas-devel 编译依赖
- [ ] Python 3.10 编译选项包含 `--enable-optimizations --enable-shared`
- [ ] Node.js 20 通过 NodeSource RPM 仓库正确安装
- [ ] venv 创建并安装 fastapi/uvicorn/numpy/scipy
- [ ] `npm run build` 成功生成 `frontend/dist/`
- [ ] `firewall-cmd` 放行 8000/tcp
- [ ] systemd 服务创建并 enable
- [ ] `--update` 模式跳过系统依赖安装
- [ ] `DEPLOY_CENTOS.md` 覆盖全部 7 个章节
- [ ] 文档中的命令可逐行复制执行
