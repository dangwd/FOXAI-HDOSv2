#!/usr/bin/env bash
# rollback.sh — Rollback về commit trước hoặc commit SHA cụ thể
# Dùng: ./scripts/rollback.sh [commit-sha]
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
ENV_SOURCE="/opt/foxai/.env.production"

TARGET_SHA="${1:-}"

echo "=== FOXAI HDOS — Rollback ==="

# Xác định commit target
if [ -z "$TARGET_SHA" ]; then
  TARGET_SHA=$(git log --format="%H" -2 | tail -1)
  echo "Target: commit trước ($(git log --oneline -2 | tail -1))"
else
  echo "Target: $TARGET_SHA"
fi

# Verify commit tồn tại
if ! git cat-file -e "${TARGET_SHA}^{commit}" 2>/dev/null; then
  echo "ERROR: Commit $TARGET_SHA không tồn tại"
  exit 1
fi

# Checkout code về commit cũ
echo "[1/4] Checkout về $TARGET_SHA..."
git checkout "$TARGET_SHA" -- .

# Copy env file
echo "[2/4] Copy env file..."
if [ ! -f "$ENV_SOURCE" ]; then
  echo "ERROR: $ENV_SOURCE không tồn tại"
  exit 1
fi
cp "$ENV_SOURCE" .env.production

# Rebuild & restart
echo "[3/4] Rebuild & restart container..."
docker stop foxai-hdos 2>/dev/null || true
docker rm   foxai-hdos 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" build --no-cache
docker compose -f "$COMPOSE_FILE" up -d

# Health check
echo "[4/4] Health check..."
for i in $(seq 1 12); do
  if wget -qO- http://localhost:4000/ > /dev/null 2>&1; then
    echo "Health check passed (attempt $i/12)"
    break
  fi
  if [ "$i" -eq 12 ]; then
    echo "ERROR: App không healthy sau 60s"
    docker compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
  fi
  echo "Attempt $i/12 — retrying in 5s..."
  sleep 5
done

docker image prune -f

echo ""
echo "=== Rollback hoàn tất ==="
echo "Commit: $(git log --oneline -1)"
echo "URL:    http://192.168.100.60:4000"
