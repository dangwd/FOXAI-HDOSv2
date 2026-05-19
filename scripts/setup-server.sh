#!/usr/bin/env bash
# setup-server.sh — Chạy 1 lần trên Ubuntu server để chuẩn bị môi trường deploy
# Cách chạy: sudo bash scripts/setup-server.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Script này cần quyền root. Chạy: sudo bash scripts/setup-server.sh"
  exit 1
fi

FOXAI_DIR="/opt/foxai"
DOCKER_USER="${SUDO_USER:-ubuntu}"

echo "=== FOXAI HDOS — Server Setup ==="
echo "User: $DOCKER_USER"
echo ""

# 1. Cài Docker Engine + Compose plugin
if ! command -v docker &>/dev/null; then
  echo "[1/5] Cài Docker Engine..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "[1/5] Docker đã có: $(docker --version)"
fi

# Đảm bảo Docker Compose plugin có (docker compose, không phải docker-compose)
if ! docker compose version &>/dev/null; then
  echo "      Cài Docker Compose plugin..."
  apt-get update -qq
  apt-get install -y docker-compose-plugin
fi
echo "      Compose: $(docker compose version --short)"

# 2. Thêm user vào group docker (để runner không cần sudo)
echo "[2/5] Thêm $DOCKER_USER vào group docker..."
usermod -aG docker "$DOCKER_USER"

# 3. Tạo thư mục /opt/foxai
echo "[3/5] Tạo $FOXAI_DIR..."
mkdir -p "$FOXAI_DIR"
chown "$DOCKER_USER:$DOCKER_USER" "$FOXAI_DIR"
chmod 750 "$FOXAI_DIR"

# 4. Tạo template .env.production nếu chưa có
ENV_FILE="$FOXAI_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  echo "[4/5] Tạo template $ENV_FILE..."
  cat > "$ENV_FILE" <<'EOF'
NEXT_PUBLIC_API_URL=http://192.168.100.60:5000
NEXT_PUBLIC_SIGNALR_URL=http://192.168.100.60:5000/notifications/hubs/notifications
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
EOF
  chown "$DOCKER_USER:$DOCKER_USER" "$ENV_FILE"
  chmod 640 "$ENV_FILE"
  echo "      → Tạo xong. Hãy edit: nano $ENV_FILE"
else
  echo "[4/5] $ENV_FILE đã tồn tại — bỏ qua."
fi

# 5. Verify prerequisites cho GitHub Actions runner
echo "[5/5] Kiểm tra prerequisites cho self-hosted runner..."
MISSING=0
for cmd in git curl wget docker; do
  if command -v "$cmd" &>/dev/null; then
    echo "      ✓ $cmd"
  else
    echo "      ✗ $cmd — THIẾU"
    MISSING=1
  fi
done
if [ "$MISSING" -eq 1 ]; then
  echo "      Cài dependencies còn thiếu: apt-get install -y git curl wget"
fi

echo ""
echo "=== Setup hoàn tất ==="
echo ""
echo "Bước tiếp theo:"
echo "  1. Điền đúng giá trị:   nano $ENV_FILE"
echo "  2. Đăng ký GitHub Actions self-hosted runner:"
echo "     github.com → Repo → Settings → Actions → Runners → New self-hosted runner"
echo "     Chọn: Linux / X64 — làm theo hướng dẫn tải & configure runner"
echo "  3. Cài runner as service (chạy bằng user $DOCKER_USER, KHÔNG phải root):"
echo "     cd ~/actions-runner && sudo ./svc.sh install $DOCKER_USER && sudo ./svc.sh start"
echo "  4. Logout & login lại để nhận quyền docker group:"
echo "     logout   # hoặc: newgrp docker"
echo "  5. Verify runner online trên GitHub, sau đó push code lên main"
echo ""
echo "Port production: 4000  →  http://192.168.100.60:4000"
