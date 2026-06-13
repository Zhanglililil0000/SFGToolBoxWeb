#!/bin/bash
# ==============================================
#  SFG Tool Box - Linux Cloud Server Deploy
#  Usage:  chmod +x deploy.sh && sudo ./deploy.sh
# ==============================================
set -e

APP_DIR="/opt/sfg-toolbox"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
SERVICE_FILE="/etc/systemd/system/sfg-toolbox.service"
PYTHON="python3"
PORT=8000

echo "============================================"
echo "  SFG Tool Box - Deploy to Server"
echo "============================================"
echo ""

# --------------------------------------------------
# 1. System dependencies
# --------------------------------------------------
echo "[1/5] Installing system packages..."
if command -v apt &> /dev/null; then
    apt update -y
    apt install -y $PYTHON $PYTHON-pip $PYTHON-venv curl
elif command -v yum &> /dev/null; then
    yum install -y $PYTHON $PYTHON-pip curl
else
    echo "ERROR: Unsupported package manager"
    exit 1
fi
echo "  -> System packages OK"

# --------------------------------------------------
# 2. Create app directory (if not already cloned)
# --------------------------------------------------
echo "[2/5] Setting up application..."
mkdir -p "$APP_DIR"
mkdir -p "$BACKEND_DIR/uploads"
touch "$BACKEND_DIR/uploads/.gitkeep"

if [ ! -f "$BACKEND_DIR/main.py" ]; then
    echo "  -> Source code not found at $BACKEND_DIR"
    echo "  -> Please upload files first: scp -r ./* root@IP:/opt/sfg-toolbox/"
    exit 1
fi
echo "  -> Directory structure OK"

# --------------------------------------------------
# 3. Install Python dependencies
# --------------------------------------------------
echo "[3/5] Installing Python dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
    $PYTHON -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
echo "  -> Python packages OK"

# --------------------------------------------------
# 4. Install Node.js & build frontend
# --------------------------------------------------
echo "[4/5] Building frontend..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null
fi
cd "$FRONTEND_DIR"
npm install
npm run build
echo "  -> Frontend built OK"

# --------------------------------------------------
# 5. Create systemd service
# --------------------------------------------------
echo "[5/5] Creating systemd service..."
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

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sfg-toolbox
systemctl restart sfg-toolbox

echo ""
echo "============================================"
echo "  Deploy Complete!"
echo "============================================"
echo ""
echo "  Site:  http://$(curl -s ifconfig.me):$PORT"
echo "  Status: systemctl status sfg-toolbox"
echo "  Logs:   journalctl -u sfg-toolbox -f"
echo ""
