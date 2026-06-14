#!/bin/bash
# ============================================================
#  SFG Tool Box — CentOS 7.9 Cloud Server Deploy
#
#  Full deploy   : chmod +x deploy.sh && sudo ./deploy.sh
#  Update only   : sudo ./deploy.sh --update
# ============================================================
set -e

APP_DIR="/opt/sfg-toolbox"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
SERVICE_FILE="/etc/systemd/system/sfg-toolbox.service"
PYTHON_BIN="/usr/local/bin/python3.10"
PYTHON_VERSION="3.10.14"
PORT=8000
IS_UPDATE=false

if [ "$1" = "--update" ]; then
    IS_UPDATE=true
fi

echo "============================================"
echo "  SFG Tool Box — Deploy to CentOS 7.9"
[ "$IS_UPDATE" = true ] && echo "  Mode: UPDATE (skip system deps)"
echo "============================================"
echo ""

# ──────────────────────────────────────────────
# 0. Ensure running as root
# ──────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root (sudo)."
    exit 1
fi

# ──────────────────────────────────────────────
# 1. Verify source code exists
# ──────────────────────────────────────────────
echo "[0/6] Verifying source code..."
if [ ! -f "$BACKEND_DIR/main.py" ]; then
    echo "  -> Source code NOT found at $BACKEND_DIR"
    echo "  -> Upload files first:"
    echo "     scp -r ./* root@<SERVER_IP>:/opt/sfg-toolbox/"
    exit 1
fi
echo "  -> Source code OK"
mkdir -p "$BACKEND_DIR/uploads"
echo ""

# ──────────────────────────────────────────────
# 2. System packages & build tools
# ──────────────────────────────────────────────
if [ "$IS_UPDATE" = false ]; then

echo "[1/6] Installing system build tools..."
yum groupinstall -y "Development Tools"
yum install -y epel-release
yum install -y \
    openssl-devel bzip2-devel libffi-devel zlib-devel \
    openblas-devel lapack-devel \
    wget curl git \
    sqlite-devel readline-devel xz-devel
echo "  -> Build tools OK"
echo ""

fi  # end IS_UPDATE skip

# ──────────────────────────────────────────────
# 3. Python 3.10 (source compile)
# ──────────────────────────────────────────────
if [ -x "$PYTHON_BIN" ]; then
    echo "[2/6] Python 3.10 — already installed at $PYTHON_BIN"
else
    if [ "$IS_UPDATE" = true ]; then
        echo "ERROR: Python 3.10 not found. Run full deploy first."
        exit 1
    fi

    echo "[2/6] Compiling Python $PYTHON_VERSION from source..."
    echo "      (this takes ~5–10 min on 2-core VM)"

    cd /tmp
    if [ ! -f "Python-$PYTHON_VERSION.tgz" ]; then
        wget -q "https://www.python.org/ftp/python/$PYTHON_VERSION/Python-$PYTHON_VERSION.tgz"
    fi
    tar xzf "Python-$PYTHON_VERSION.tgz"
    cd "Python-$PYTHON_VERSION"

    ./configure \
        --prefix=/usr/local \
        --enable-optimizations \
        --enable-shared \
        --with-system-ffi \
        --with-ensurepip=install \
        LDFLAGS="-Wl,-rpath /usr/local/lib"

    make -j"$(nproc)"
    make altinstall

    # Register shared library
    echo "/usr/local/lib" > /etc/ld.so.conf.d/python3.10.conf
    ldconfig

    cd /tmp
    rm -rf "Python-$PYTHON_VERSION"

    echo "  -> Python $PYTHON_VERSION installed at $PYTHON_BIN"
fi

"$PYTHON_BIN" --version
echo ""

# ──────────────────────────────────────────────
# 4. Node.js 20
# ──────────────────────────────────────────────
if [ "$IS_UPDATE" = false ]; then

echo "[3/6] Installing Node.js 20..."
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo "  -> Node.js already installed: $NODE_VER"
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
    echo "  -> Node.js 20 installed"
fi
node --version
npm --version
echo ""

fi  # end IS_UPDATE skip

# ──────────────────────────────────────────────
# 5. Python venv & pip deps
# ──────────────────────────────────────────────
echo "[4/6] Setting up Python virtual environment..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    "$PYTHON_BIN" -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt
deactivate
echo "  -> Python packages OK"
echo ""

# ──────────────────────────────────────────────
# 6. Build frontend
# ──────────────────────────────────────────────
echo "[5/6] Building frontend (React + Vite)..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build
echo "  -> Frontend built at $FRONTEND_DIR/dist"
echo ""

# ──────────────────────────────────────────────
# 7. Firewall
# ──────────────────────────────────────────────
if [ "$IS_UPDATE" = false ]; then

echo "[6/6] Configuring firewall..."
if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-port=$PORT/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "  -> Port $PORT/tcp opened in firewalld"
else
    echo "  -> firewalld not running; skipping."
    echo "  -> If using iptables, manually allow port $PORT"
fi
echo ""

fi

# ──────────────────────────────────────────────
# 8. systemd service
# ──────────────────────────────────────────────
echo "Creating systemd service..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=SFG Tool Box
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port $PORT
Restart=always
RestartSec=3
Environment=LD_LIBRARY_PATH=/usr/local/lib

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sfg-toolbox
systemctl restart sfg-toolbox

# ──────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Deploy Complete!"
echo "============================================"
echo ""
echo "  Site:    http://<YOUR_SERVER_IP>:$PORT"
echo "  Status:  systemctl status sfg-toolbox"
echo "  Logs:    journalctl -u sfg-toolbox -f"
echo "  Restart: systemctl restart sfg-toolbox"
echo ""
