# FOXAI HDOS v3 — Deploy Briefing (Ubuntu Server)

> Tài liệu này chứa toàn bộ thông tin cần thiết để dựng hạ tầng CI/CD + Docker cho project FOXAI HDOS v3 lên server Ubuntu. Đọc hết trước khi bắt đầu.

---

## 1. Tổng quan project

| Mục | Giá trị |
|---|---|
| Tên app | FOXAI HDOS v3 |
| Package name | `hdos-v3` (version `3.0.0`) |
| Framework | Next.js 15.3.1 (App Router) |
| Runtime | Node.js 20 (Alpine) |
| React | 19.0.0 |
| TypeScript | 5.7.3 |
| Port production | **4000** |
| Port development | 3000 |
| Next.js output mode | `standalone` (bắt buộc để Docker chạy được) |
| Repo | `github.com/dangwd/FOXAI-HDOSv1` |
| Branch chính | `main` |
| Server IP | `192.168.100.60` |

---

## 2. Kiến trúc CI/CD

```
Push to main
    │
    ▼
┌─────────────────────────────────────────────────┐
│  CI  (GitHub cloud — ubuntu-latest)             │
│  Job 1: Lint & Type Check                       │
│    ① npm ci                                     │
│    ② npm run lint    (ESLint)                   │
│    ③ npm run type-check  (tsc --noEmit)         │
│  Job 2: Build (chỉ chạy nếu Job 1 pass)        │
│    ① npm ci                                     │
│    ② npm run build  (Next.js production bundle) │
└──────────────────────┬──────────────────────────┘
                       │ CI pass
                       ▼
┌─────────────────────────────────────────────────┐
│  CD  (Self-hosted runner tại 192.168.100.60)    │
│  ① Checkout code (đúng SHA đã pass CI)         │
│  ② cp /opt/foxai/.env.production → workspace   │
│  ③ docker stop/rm container cũ (nếu có)        │
│  ④ docker compose -f docker-compose.prod.yml   │
│     build --no-cache && up -d                  │
│  ⑤ Health check :4000 (12 lần × 5s = 60s)     │
│  ⑥ docker image prune -f                       │
│  ⑦ Print deployment summary                    │
└─────────────────────────────────────────────────┘
                       │
                       ▼
          http://192.168.100.60:4000
```

**Concurrency:**
- CI: `cancel-in-progress: true` — push mới hủy CI cũ cùng nhánh
- CD: `cancel-in-progress: false` — CD không bao giờ bị hủy giữa chừng (tránh deployment dở dang)

---

## 3. Cấu trúc file liên quan đến infra

```
project-root/
├── Dockerfile                    # Multi-stage build (4 stage)
├── docker-compose.yml            # Profile-based: --profile dev | prod
├── docker-compose.prod.yml       # File riêng cho production deploy (CD dùng cái này)
├── docker-compose.dev.yml        # File riêng cho dev local
├── .dockerignore
├── .env.local.example            # Template cho dev
├── .env.production               # Env production (commit vào git — chỉ có NEXT_PUBLIC_*)
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI: lint + type-check + build
│       └── cd.yml                # CD: self-hosted runner deploy
└── scripts/
    ├── setup-server.sh           # Cài Docker + tạo /opt/foxai + tạo .env.production
    └── rollback.sh               # Rollback về commit trước
```

---

## 4. Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Development (source mounted, hot reload)
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 3: Build production bundle
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public && npm run build

# Stage 4: Production runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && mkdir -p /app/public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

EXPOSE 4000
CMD ["node", "server.js"]
```

**Lưu ý:** Stage `runner` chỉ chứa `.next/standalone/` + `.next/static/` + `public/` trên base `node:20-alpine` (~50MB). Image rất gọn, không có node_modules đầy đủ.

---

## 5. docker-compose.prod.yml

```yaml
name: hdos-prod

services:
  app:
    image: foxai-hdos:latest
    container_name: foxai-hdos
    build:
      context: .
      target: runner
    ports:
      - "4000:4000"
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512m
```

---

## 6. GitHub Actions Workflows

### ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL || 'http://localhost:5000' }}
          NEXT_PUBLIC_SIGNALR_URL: ${{ vars.NEXT_PUBLIC_SIGNALR_URL || 'http://localhost:5000/notifications/hubs/notifications' }}
          NEXT_PUBLIC_APP_VERSION: ${{ github.sha }}
          NEXT_PUBLIC_APP_ENV: production
```

### cd.yml

```yaml
name: CD

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

concurrency:
  group: cd-production
  cancel-in-progress: false

jobs:
  deploy:
    name: Deploy to Production
    runs-on: [self-hosted, Linux, X64]
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.workflow_run.head_sha }}

      - name: Copy env file
        run: |
          if [ ! -f /opt/foxai/.env.production ]; then
            echo "::error::File /opt/foxai/.env.production không tồn tại trên server."
            echo "::error::Chạy scripts/setup-server.sh trước rồi edit file env."
            exit 1
          fi
          cp /opt/foxai/.env.production .env.production
          echo "env file ready"

      - name: Build & start container
        run: |
          docker stop foxai-hdos 2>/dev/null || true
          docker rm foxai-hdos 2>/dev/null || true
          docker compose -f docker-compose.prod.yml build --no-cache
          docker compose -f docker-compose.prod.yml up -d

      - name: Health check
        run: |
          echo "Waiting for app to be healthy..."
          for i in $(seq 1 12); do
            if wget -qO- http://localhost:4000/ > /dev/null 2>&1; then
              echo "Health check passed (attempt $i/12)"
              exit 0
            fi
            echo "Attempt $i/12 — retrying in 5s..."
            sleep 5
          done
          echo "::error::App không healthy sau 60s"
          docker compose -f docker-compose.prod.yml logs --tail=100
          exit 1

      - name: Prune old images
        if: success()
        run: docker image prune -f

      - name: Deployment summary
        if: always()
        run: |
          echo "========================================"
          echo "Result:  ${{ job.status }}"
          echo "Commit:  ${{ github.event.workflow_run.head_sha }}"
          echo "Message: ${{ github.event.workflow_run.head_commit.message }}"
          echo "Time:    $(date '+%Y-%m-%d %H:%M:%S %Z')"
          echo "URL:     http://192.168.100.60:4000"
          echo "========================================"
```

---

## 7. Environment Variables

### Biến bắt buộc (tất cả là `NEXT_PUBLIC_*` — inline vào bundle lúc build)

| Biến | Ví dụ | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://192.168.100.60:5000` | Base URL của backend API |
| `NEXT_PUBLIC_SIGNALR_URL` | `http://192.168.100.60:5000/notifications/hubs/notifications` | URL SignalR/Socket.IO real-time |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | Version app (CI tự ghi bằng `${{ github.sha }}`) |
| `NEXT_PUBLIC_APP_ENV` | `production` | Environment label |

### Biến tuỳ chọn (Keycloak — nếu dùng SSO)

| Biến | Ví dụ |
|---|---|
| `NEXT_PUBLIC_KEYCLOAK_URL` | `https://192.168.100.60:8443` |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | `hdos` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | `hdos-frontend` |

### Nơi lưu file env

- **Dev local**: `.env.local` (gitignore'd, copy từ `.env.local.example`)
- **Production trên server**: `/opt/foxai/.env.production` — **KHÔNG commit lên git**
- CD workflow tự `cp /opt/foxai/.env.production .env.production` mỗi lần deploy

> **Quan trọng:** `NEXT_PUBLIC_*` được Next.js inline cứng vào JS bundle lúc `npm run build`. Muốn đổi URL phải rebuild image — CI/CD làm tự động.

---

## 8. Setup server lần đầu (step-by-step)

### Bước 1 — Yêu cầu server

| Thành phần | Yêu cầu |
|---|---|
| OS | Ubuntu 20.04+ / 22.04 LTS |
| RAM | Tối thiểu 1GB (container limit 512MB) |
| Disk | Tối thiểu 10GB free |
| Docker | Engine >= 24 + Compose plugin >= 2.20 |
| GitHub Actions Runner | Self-hosted, labels: `self-hosted, Linux, X64` |
| Port cần mở | `4000` (app), `22` (SSH) |

### Bước 2 — Chạy setup script

```bash
ssh ubuntu@192.168.100.60

# Chạy script setup tự động
bash <(curl -fsSL https://raw.githubusercontent.com/dangwd/FOXAI-HDOSv1/main/scripts/setup-server.sh)
```

Script tự động:
- Cài Docker Engine (nếu chưa có)
- Thêm user `ubuntu` vào group `docker`
- Tạo `/opt/foxai/` với quyền phù hợp
- Tạo template `/opt/foxai/.env.production`

### Bước 3 — Điền env production trên server

```bash
nano /opt/foxai/.env.production
```

```env
NEXT_PUBLIC_API_URL=http://192.168.100.60:5000
NEXT_PUBLIC_SIGNALR_URL=http://192.168.100.60:5000/notifications/hubs/notifications
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

> Nếu dùng Keycloak, thêm 3 biến Keycloak vào đây.

### Bước 4 — Cài GitHub Actions self-hosted runner

```bash
# Trên GitHub: Settings → Actions → Runners → New self-hosted runner
# Chọn: Linux / X64
# Làm theo hướng dẫn GitHub tạo ra (download, config, run)

# Cài runner as service (để auto-start khi reboot)
cd ~/actions-runner
sudo ./svc.sh install
sudo ./svc.sh start
sudo systemctl status "actions.runner.*"
```

Runner cần có labels: `self-hosted`, `Linux`, `X64`

### Bước 5 — Thiết lập GitHub Actions Variables (tuỳ chọn)

Vào: `github.com/dangwd/FOXAI-HDOSv1 → Settings → Secrets and variables → Actions → Variables`

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://192.168.100.60:5000` |
| `NEXT_PUBLIC_SIGNALR_URL` | `http://192.168.100.60:5000/notifications/hubs/notifications` |

> Nếu không set, CI vẫn build với `localhost:5000` placeholder (chỉ kiểm tra compile được hay không).

### Bước 6 — Logout & login lại (bắt buộc nếu vừa thêm docker group)

```bash
# Hoặc chạy lệnh này thay cho logout
newgrp docker

# Verify
docker ps
```

### Bước 7 — Push code kích hoạt pipeline

```bash
git push origin main
```

---

## 9. Quản lý container trên server

```bash
# Xem container đang chạy
docker ps

# Xem logs real-time
docker compose -f docker-compose.prod.yml logs -f

# Xem logs 200 dòng cuối
docker compose -f docker-compose.prod.yml logs --tail=200

# Vào shell trong container
docker compose -f docker-compose.prod.yml exec app sh

# Restart thủ công
docker compose -f docker-compose.prod.yml restart

# Dừng app
docker compose -f docker-compose.prod.yml down

# Xem dung lượng image
docker images | grep foxai
```

---

## 10. Rollback

### Cách 1 — Script tự động (khuyến nghị)

```bash
ssh ubuntu@192.168.100.60
cd ~/actions-runner/_work/FOXAI-HDOSv1/FOXAI-HDOSv1

# Rollback về commit trước (tự detect)
./scripts/rollback.sh

# Rollback về commit cụ thể
./scripts/rollback.sh abc1234
```

### Cách 2 — Revert trên GitHub

```bash
git revert HEAD --no-edit
git push origin main
# CI/CD tự chạy lại với code revert
```

### Cách 3 — Thủ công trên server

```bash
ssh ubuntu@192.168.100.60
cd ~/actions-runner/_work/FOXAI-HDOSv1/FOXAI-HDOSv1

git log --oneline -5
git checkout <commit-sha> -- .
cp /opt/foxai/.env.production .env.production
docker compose -f docker-compose.prod.yml up --build -d
```

---

## 11. Troubleshooting

### CD ở trạng thái "Queued" mãi không chạy

Runner offline. Kiểm tra:

```bash
sudo systemctl status "actions.runner.*"
sudo systemctl restart "$(sudo systemctl list-units 'actions.runner.*' --no-legend | awk '{print $1}')"
```

GitHub: Settings → Actions → Runners → runner phải hiện **Idle**.

---

### Lỗi "permission denied" khi chạy docker

```bash
sudo usermod -aG docker ubuntu   # hoặc user runner thực tế
sudo systemctl restart "actions.runner.*"
```

---

### Lỗi "/opt/foxai/.env.production không tồn tại"

```bash
sudo mkdir -p /opt/foxai
sudo chown ubuntu:ubuntu /opt/foxai
nano /opt/foxai/.env.production
```

---

### Health check fail — app không start được

```bash
docker compose -f docker-compose.prod.yml logs --tail=200

# Xem container có bị OOM killed không
docker inspect foxai-hdos | grep -A5 '"State"'

# Thử chạy thủ công để xem lỗi
docker run --rm \
  --env-file /opt/foxai/.env.production \
  -e NODE_ENV=production \
  foxai-hdos:latest
```

---

### CI fail — các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Type error: ...` | TypeScript lỗi | Sửa type trong code |
| `ESLint: ...` | Lint rule vi phạm | Sửa theo gợi ý |
| Build fail vì `NEXT_PUBLIC_API_URL` | URL không set trong GitHub Variables | Thêm GitHub Variable (xem Bước 5) |

---

## 12. Các điểm cần lưu ý khi dựng

1. **`output: 'standalone'`** trong `next.config.ts` là bắt buộc — Dockerfile stage `runner` copy `.next/standalone/` chứ không copy toàn bộ project.

2. **`npm ci` thay vì `npm install`** — bắt buộc để install đúng version trong `package-lock.json`. Project có patch qua `patch-package` (antd + rc-util), `postinstall` hook tự chạy sau `npm ci`.

3. **`NEXT_PUBLIC_*` inline lúc build** — không thể truyền env qua Docker ENV sau khi build xong. Muốn đổi URL phải rebuild image.

4. **Patches** — thư mục `patches/` chứa `antd+5.21.6.patch` và `rc-util+5.44.4.patch`. Được apply tự động qua `postinstall`. Dockerfile stage `builder` copy toàn bộ source (bao gồm patches/) trước khi build.

5. **Container name** — cố định là `foxai-hdos` (dùng để stop/rm trong CD step).

6. **Memory limit** — 512MB trong compose. Nếu server ít RAM, monitor OOM.

7. **Downtime khi deploy** — khoảng 10–20 giây (container cũ stop, container mới start). Zero-downtime cần thêm Nginx + blue-green.

8. **Không cần database/redis** — đây là frontend-only app. Tất cả data lấy từ backend API qua `NEXT_PUBLIC_API_URL`.

---

## 13. Nhanh chóng verify sau deploy

```bash
# Trên server
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/
# Kết quả mong đợi: 200

# Xem container status
docker compose -f docker-compose.prod.yml ps
# Container phải ở trạng thái: Up (healthy)
```

Truy cập từ browser: `http://192.168.100.60:4000`
