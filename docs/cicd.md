# CI/CD — FOXAI HDOS v3

## Tổng quan

Pipeline CI/CD được chia làm 2 workflow hoạt động tự động:

```
Push to main
    │
    ▼
┌─────────────────────────────────────┐
│  CI  (GitHub Cloud Runner)          │
│  ① Lint + Type Check                │
│  ② Build (Next.js production build) │
└──────────────┬──────────────────────┘
               │ CI pass
               ▼
┌─────────────────────────────────────┐
│  CD  (Self-hosted Runner tại server)│
│  ① Checkout code                    │
│  ② Copy .env.production             │
│  ③ docker compose up --build -d     │
│  ④ Health check :4000               │
│  ⑤ Prune old images                 │
└─────────────────────────────────────┘
               │
               ▼
     App chạy tại http://192.168.100.60:4000
```

| Thành phần | Chạy ở đâu | Mục đích |
|---|---|---|
| CI | GitHub cloud (ubuntu-latest) | Xác minh code hợp lệ trước khi deploy |
| CD | Self-hosted runner trên `192.168.100.60` | Deploy thực tế lên server |

---

## Cấu trúc file

```
.github/
  workflows/
    ci.yml          ← Lint, type check, build verification
    cd.yml          ← Deploy qua self-hosted runner + Docker
scripts/
  setup-server.sh  ← Chuẩn bị server lần đầu (chạy 1 lần)
  rollback.sh      ← Rollback về commit trước
docs/
  cicd.md          ← File này
  docker.md        ← Hướng dẫn Docker local
docker-compose.prod.yml  ← Config Docker production
Dockerfile               ← Multi-stage build
```

---

## Cài đặt lần đầu

### Bước 1 — Chuẩn bị server

SSH vào server và chạy setup script:

```bash
ssh ubuntu@192.168.100.60

# Chạy script setup (cài Docker, tạo /opt/foxai, tạo .env.production)
bash <(curl -fsSL https://raw.githubusercontent.com/dangwd/FOXAI-HDOSv1/main/scripts/setup-server.sh)
```

Script sẽ tự động:
- Cài Docker nếu chưa có
- Thêm user `ubuntu` vào group `docker`
- Tạo `/opt/foxai/` với quyền phù hợp
- Tạo template `/opt/foxai/.env.production`

### Bước 2 — Cấu hình file env trên server

```bash
nano /opt/foxai/.env.production
```

Nội dung cần điền:

```env
NEXT_PUBLIC_API_URL=http://192.168.100.60:5000
NEXT_PUBLIC_SIGNALR_URL=http://192.168.100.60:5000/notifications/hubs/notifications
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

> **Quan trọng:** File này KHÔNG được commit lên git. Nó chỉ tồn tại trên server tại `/opt/foxai/.env.production`. Mỗi lần deploy, workflow tự copy file này vào workspace.

### Bước 3 — Xác minh self-hosted runner

Kiểm tra runner `ubuntu-servername` đang **Online/Idle** tại:

```
github.com/dangwd/FOXAI-HDOSv1 → Settings → Actions → Runners
```

Runner cần có labels: `self-hosted`, `Linux`, `X64`

Kiểm tra runner service trên server:

```bash
# Xem trạng thái service runner
sudo systemctl status "$(sudo systemctl list-units 'actions.runner.*' --no-legend | awk '{print $1}' | head -1)"

# Xem logs runner
sudo journalctl -u "actions.runner.*" -f
```

### Bước 4 — Thiết lập GitHub Actions Variables (tuỳ chọn)

Nếu muốn CI build với URL thật thay vì localhost placeholder:

```
github.com/dangwd/FOXAI-HDOSv1 → Settings → Secrets and variables → Actions → Variables
```

Thêm 2 variables:
| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://192.168.100.60:5000` |
| `NEXT_PUBLIC_SIGNALR_URL` | `http://192.168.100.60:5000/notifications/hubs/notifications` |

> CI dùng variables này để build. Nếu không set, CI build với `localhost:5000` (vẫn pass, vì CI chỉ kiểm tra code biên dịch được hay không).

### Bước 5 — Push code và kích hoạt pipeline

```bash
git push origin main
```

---

## Luồng hoạt động chi tiết

### CI Workflow (`.github/workflows/ci.yml`)

**Trigger:** Mỗi khi có `push` lên `main`/`develop`, hoặc có Pull Request vào `main`.

**Job 1 — Lint & Type Check** (`ubuntu-latest`):
1. Checkout code
2. Setup Node.js 20 + cache npm
3. `npm ci` — cài dependencies
4. `npm run lint` — kiểm tra ESLint
5. `npm run type-check` — kiểm tra TypeScript (tsc --noEmit)

**Job 2 — Build** (chỉ chạy sau khi Job 1 pass):
1. Checkout code
2. Setup Node.js 20 + cache npm
3. `npm ci`
4. `npm run build` — build Next.js production bundle

Nếu bất kỳ step nào fail → CI fail → CD **không** được kích hoạt.

---

### CD Workflow (`.github/workflows/cd.yml`)

**Trigger:** Chỉ khi CI workflow hoàn thành **thành công** (`conclusion == 'success'`) trên nhánh `main`.

**Chạy trên:** Self-hosted runner tại `192.168.100.60` (labels: `self-hosted, Linux, X64`)

**Step 1 — Checkout:**
Checkout đúng commit SHA đã pass CI (tránh race condition nếu có commit mới trong lúc CI đang chạy).

**Step 2 — Copy env file:**
```bash
cp /opt/foxai/.env.production .env.production
```
File env được lưu cố định trên server tại `/opt/foxai/`, không đi qua git.
Nếu file không tồn tại → workflow fail ngay với thông báo rõ ràng.

**Step 3 — Build & Deploy:**
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
- Build image mới từ `Dockerfile` (stage `runner`, multi-stage build)
- Stop container cũ (nếu có)
- Start container mới với image vừa build
- Container tên `foxai-hdos`, expose port `4000`

**Step 4 — Health Check:**
Thử 12 lần × 5 giây = tối đa 60 giây. Gửi HTTP request đến `http://localhost:4000/`.
- Pass → deployment thành công
- Fail → in logs 100 dòng cuối → workflow fail (container cũ đã bị down, cần rollback)

**Step 5 — Prune images:**
```bash
docker image prune -f
```
Xóa các Docker image không còn dùng để tiết kiệm disk.

**Step 6 — Summary:**
In ra kết quả deploy, commit SHA, message, thời gian.

---

## Dockerfile — Multi-stage Build

```
Stage 1: deps    → npm ci (cache layer)
Stage 2: dev     → dùng cho docker-compose.dev.yml (hot reload)
Stage 3: builder → npm run build (tạo .next/standalone)
Stage 4: runner  → image production tối giản (chỉ giữ standalone output)
```

Image production cuối cùng chỉ chứa:
- `node:20-alpine` (~50MB)
- `.next/standalone/` (Next.js standalone output)
- `.next/static/`
- `public/`

**Lưu ý quan trọng:** Biến `NEXT_PUBLIC_*` được Next.js **inline vào bundle lúc build**. Thay đổi env phải rebuild image mới có hiệu lực. CI/CD tự động làm điều này mỗi lần deploy.

---

## Quản lý container trên server

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

# Dung lượng image
docker images | grep foxai
```

---

## Rollback

### Cách 1 — Script tự động (khuyến nghị)

SSH vào server, vào thư mục workspace của runner (thường ở `~/actions-runner/_work/FOXAI-HDOSv1/FOXAI-HDOSv1/`):

```bash
# Rollback về commit trước
./scripts/rollback.sh

# Rollback về commit cụ thể
./scripts/rollback.sh abc1234
```

### Cách 2 — Revert trên GitHub rồi push

```bash
# Trên máy local
git revert HEAD --no-edit
git push origin main
```

Push lên main → CI chạy lại → nếu pass → CD deploy lại version revert.

### Cách 3 — Thủ công trên server

```bash
ssh ubuntu@192.168.100.60
cd ~/actions-runner/_work/FOXAI-HDOSv1/FOXAI-HDOSv1

git log --oneline -5   # xem các commit gần nhất

# Checkout về commit cũ
git checkout <commit-sha> -- .
cp /opt/foxai/.env.production .env.production
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Troubleshooting

### CD workflow ở trạng thái "Queued" mãi không chạy

**Nguyên nhân:** Runner offline hoặc không nhận job.

```bash
# Kiểm tra runner service trên server
sudo systemctl status "actions.runner.*"

# Restart runner nếu cần
sudo systemctl restart "$(sudo systemctl list-units 'actions.runner.*' --no-legend | awk '{print $1}')"
```

Kiểm tra trên GitHub: Settings → Actions → Runners → runner phải hiện **Idle**.

---

### Lỗi "permission denied" khi chạy docker

Runner chạy bằng user chưa có quyền docker.

```bash
# Thêm user runner vào group docker
sudo usermod -aG docker ubuntu   # hoặc thay 'ubuntu' bằng user runner thực tế
# Restart runner service để nhận quyền mới
sudo systemctl restart "actions.runner.*"
```

---

### Lỗi "/opt/foxai/.env.production không tồn tại"

```bash
sudo mkdir -p /opt/foxai
sudo chown ubuntu:ubuntu /opt/foxai
nano /opt/foxai/.env.production   # tạo và điền nội dung
```

---

### Health check fail — app không start được

```bash
# Xem logs chi tiết
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

### CI fail — build lỗi

Xem log chi tiết trên GitHub Actions tab. Các lỗi thường gặp:

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `Type error: ...` | TypeScript lỗi | Sửa type trong code |
| `ESLint: ...` | Lint rule vi phạm | Sửa theo gợi ý ESLint |
| `NEXT_PUBLIC_API_URL` warning | URL không set | Thêm GitHub Variable (xem Bước 4) |

---

## Câu hỏi thường gặp

**Q: Mỗi lần push develop có deploy không?**
Không. CD chỉ trigger khi CI pass trên nhánh `main`. Push lên `develop` chỉ chạy CI.

**Q: Có thể deploy thủ công không cần push không?**
Có. Vào GitHub → Actions → CD workflow → **Run workflow** (nếu đổi trigger sang `workflow_dispatch`). Hoặc dùng script rollback trên server.

**Q: App đang chạy có bị downtime khi deploy không?**
Có downtime ngắn (~10–20 giây) khi container cũ stop và container mới start. Nếu cần zero-downtime, cần thêm Nginx reverse proxy + blue-green deployment.

**Q: Làm sao biết deploy thành công?**
- GitHub Actions tab → CD workflow → xem kết quả
- Truy cập `http://192.168.100.60:4000`
- `docker ps` trên server — container `foxai-hdos` phải ở trạng thái `Up`

**Q: Thay đổi URL API (NEXT_PUBLIC_API_URL) cần làm gì?**
1. Sửa `/opt/foxai/.env.production` trên server
2. Push bất kỳ commit nào lên main để trigger CI/CD rebuild

**Q: Có thể chạy nhiều môi trường (staging, production) không?**
Có thể cấu hình thêm runner cho staging và dùng nhánh khác (ví dụ `staging`) để trigger workflow riêng.
