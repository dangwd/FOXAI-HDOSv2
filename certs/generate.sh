#!/usr/bin/env bash
# Usage: bash certs/generate.sh [IP]
# Default IP: 192.168.100.60
set -euo pipefail

IP="${1:-192.168.100.60}"
DAYS=825   # max accepted by modern browsers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

openssl req -x509 -newkey rsa:4096 -sha256 -days "$DAYS" -nodes \
  -keyout key.pem -out cert.pem \
  -subj "/CN=${IP}" \
  -addext "subjectAltName=IP:${IP},IP:127.0.0.1,DNS:localhost"

chmod 600 key.pem
chmod 644 cert.pem

echo "✓ Generated: certs/key.pem & certs/cert.pem (valid ${DAYS} days, IP=${IP})"
echo "→ Để trình duyệt tin tưởng: import cert.pem vào trusted CAs của trình duyệt / hệ điều hành."
