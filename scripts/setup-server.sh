#!/usr/bin/env bash
# setup-server.sh — Chạy 1 lần trên Ubuntu server để chuẩn bị môi trường deploy
# Cách chạy: sudo bash <(curl -fsSL <url>)
set -euo pipefail

# Bắt buộc phải chạy bằng root/sudo
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Script này cần quyền root."
  echo "Chạy lại bằng: sudo bash <(curl -fsSL <url_script>)"
  exit 1
fi

FOXAI_DIR="/opt/foxai"
# SUDO_USER là user gốc khi dùng sudo; nếu chạy thẳng root thì dùng 'ubuntu'
DOCKER_USER="${SUDO_USER:-ubuntu}"

echo "=== FOXAI HDOS — Server Setup ==="

# 1. Cài Docker Engine nếu chưa có
if ! command -v docker &>/dev/null; then
  echo "[1/4] Cài Docker Engine..."
  curl -fsSL https://get.docker.com | sh
else
  echo "[1/4] Docker đã có: $(docker --version)"
fi

# 2. Thêm user vào group docker
echo "[2/4] Thêm $DOCKER_USER vào group docker..."
usermod -aG docker "$DOCKER_USER"

# 3. Tạo thư mục /opt/foxai
echo "[3/4] Tạo $FOXAI_DIR..."
mkdir -p "$FOXAI_DIR"
chown "$DOCKER_USER:$DOCKER_USER" "$FOXAI_DIR"
chmod 750 "$FOXAI_DIR"

# 4. Tạo template .env.production nếu chưa có
ENV_FILE="$FOXAI_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  echo "[4/4] Tạo template $ENV_FILE..."
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
  echo "[4/4] $ENV_FILE đã tồn tại — bỏ qua."
fi

echo ""
echo "=== Setup hoàn tất ==="
echo ""
echo "Bước tiếp theo:"
echo "  1. Điền đúng giá trị: nano $ENV_FILE"
echo "  2. Đăng ký GitHub Actions self-hosted runner:"
echo "     github.com → Settings → Actions → Runners → New self-hosted runner"
echo "  3. Cài runner as service:"
echo "     cd ~/actions-runner && sudo ./svc.sh install && sudo ./svc.sh start"
echo "  4. Logout & login lại (hoặc: newgrp docker) để nhận quyền docker"
echo "  5. Push code lên main để kích hoạt CI/CD"
