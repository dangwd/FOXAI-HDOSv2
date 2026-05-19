# Hướng dẫn chạy Docker

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) >= 24 hoặc Docker Engine + Docker Compose plugin >= 2.20
- File env tương ứng đã được cấu hình (xem bên dưới)

---

## Cấu trúc file

```
├── Dockerfile                 # Multi-stage: dev | builder | runner
├── docker-compose.yml         # File duy nhất — dùng --profile dev | prod
├── .env.local                 # Env cho development  (KHÔNG commit lên git)
├── .env.production            # Env cho production
└── .env.local.example         # Template — copy thành .env.local để bắt đầu
```

---

## Chuẩn bị env

### Development

```bash
cp .env.local.example .env.local
# Chỉnh sửa .env.local nếu cần
```

Nội dung `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://192.168.100.60:5000
NEXT_PUBLIC_SIGNALR_URL=http://192.168.100.60:5000/notifications/hubs/notifications
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=development
```

### Production

Chỉnh sửa `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://<api-domain>
NEXT_PUBLIC_SIGNALR_URL=https://<api-domain>/notifications/hubs/notifications
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=production
```

---

## Chạy Development

```bash
docker compose --profile dev up --build
```

- App chạy tại: **http://localhost:3000**
- Source code mount trực tiếp → **sửa code phản ánh ngay, không cần rebuild**
- Chỉ cần rebuild image khi thay đổi `package.json`

Chạy nền:

```bash
docker compose --profile dev up --build -d
docker compose --profile dev logs -f
```

Dừng:

```bash
docker compose --profile dev down
```

---

## Chạy Production

```bash
docker compose --profile prod up --build -d
```

- App chạy tại: **http://localhost:4000**
- Image build qua multi-stage — chỉ giữ standalone output, gọn nhẹ
- Auto restart nếu crash, health check mỗi 30 giây

Xem trạng thái:

```bash
docker compose --profile prod ps
docker compose --profile prod logs -f
```

Rebuild khi có code mới:

```bash
docker compose --profile prod up --build -d
```

Dừng:

```bash
docker compose --profile prod down
```

---

## Bảng lệnh nhanh

| Tác vụ | Development | Production |
|---|---|---|
| Khởi động + build | `docker compose --profile dev up --build` | `docker compose --profile prod up --build -d` |
| Chạy nền | thêm `-d` | mặc định `-d` |
| Xem logs | `docker compose --profile dev logs -f` | `docker compose --profile prod logs -f` |
| Vào shell | `docker compose --profile dev exec app-dev sh` | `docker compose --profile prod exec app-prod sh` |
| Dừng | `docker compose --profile dev down` | `docker compose --profile prod down` |
| Xóa image cũ | `docker image prune -f` | `docker image prune -f` |

---

## Lưu ý

- **Không commit `.env.local`** — được `.gitignore` bảo vệ.
- Biến `NEXT_PUBLIC_*` được Next.js **inline vào bundle lúc build** — thay đổi env phải rebuild image mới có hiệu lực (trừ dev mode vì dùng `next dev`).
- Dev mode mount source từ host nên `node_modules` trong container được giữ tách biệt qua anonymous volume — tránh conflict giữa host và container.
