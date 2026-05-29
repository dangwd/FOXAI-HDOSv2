# HDOS Provider Integration Guide

> Hướng dẫn tích hợp provider cho hệ thống HDOS — từ kiến trúc, đăng ký, triển khai đến vận hành.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Provider là gì?](#2-provider-là-gì)
3. [Luồng dữ liệu đầy đủ](#3-luồng-dữ-liệu-đầy-đủ)
4. [Giao thức gRPC — proto định nghĩa](#4-giao-thức-grpc--proto-định-nghĩa)
5. [Đăng ký provider qua Admin UI](#5-đăng-ký-provider-qua-admin-ui)
6. [Đăng ký provider qua API](#6-đăng-ký-provider-qua-api)
7. [Quản lý credentials](#7-quản-lý-credentials)
8. [Cấu hình operation registry](#8-cấu-hình-operation-registry)
9. [Triển khai provider mới](#9-triển-khai-provider-mới)
10. [Ví dụ: Excel Provider](#10-ví-dụ-excel-provider)
11. [Cấu hình docker-compose](#11-cấu-hình-docker-compose)
12. [Circuit breaker & resilience](#12-circuit-breaker--resilience)
13. [Kiểm tra & debug](#13-kiểm-tra--debug)
14. [Bảng tra cứu nhanh](#14-bảng-tra-cứu-nhanh)

---

## 1. Tổng quan kiến trúc

```
Browser / Widget
     │
     │  POST /api/v1/requests
     ▼
 ┌─────────────┐
 │  Gateway    │  :5500  ← nginx proxy vào đây
 └──────┬──────┘
        │
        ▼
 ┌─────────────┐       ┌─────────────────────┐
 │ Request.API │  ───▶ │    RabbitMQ          │
 │   :5000     │       │  (3 priority queues) │
 └─────────────┘       └──────────┬──────────┘
                                  │
                        ┌─────────▼──────────┐
                        │ Operation.Router   │
                        │   .Worker          │
                        └─────────┬──────────┘
                                  │ (provider operations)
                        ┌─────────▼──────────┐
                        │  Provider.Bridge   │  :5400 (gRPC)
                        └─────────┬──────────┘
                                  │  bidirectional stream
                        ┌─────────▼──────────┐
                        │  External Provider │  (Excel, ML, Python…)
                        └─────────┬──────────┘
                                  │ OperationResponseChunk
                        ┌─────────▼──────────┐
                        │ Response.Dispatcher│ → Redis cache
                        │   .Worker          │ → SignalR push
                        └────────────────────┘
                                  │
                              Browser (SSE)
```

**Các service liên quan:**

| Service                      | Port | Vai trò                                      |
| ---------------------------- | ---- | -------------------------------------------- |
| `gateway`                    | 5500 | Public ingress, xác thực JWT user            |
| `request-api`                | 5000 | Nhận request, issue JWT cho provider         |
| `provider-bridge`            | 5400 | gRPC server, quản lý kết nối từ provider     |
| `operation-router-worker`    | —    | Định tuyến operation đến đúng handler        |
| `response-dispatcher-worker` | —    | Lưu kết quả, push SignalR về browser         |
| `postgres`                   | 5433 | Provider registry, operation registry, audit |
| `redis`                      | 6380 | Session state, result cache, rate limit      |
| `rabbitmq`                   | 5672 | Message queue (High / Normal / Low)          |

---

## 2. Provider là gì?

Provider là **dịch vụ bên ngoài** kết nối đến `provider-bridge` qua **gRPC bidirectional streaming** để nhận và xử lý các operation do platform giao.

### Đặc điểm chính

- Kết nối chủ động đến bridge (provider **dial** bridge, không phải ngược lại).
- Xác thực bằng **JWT RS256** do `request-api` cấp.
- Đăng ký danh sách **operation patterns** mà provider có thể xử lý.
- Nhận `OperationRequest` theo stream, trả về `OperationResponseChunk`.
- Hỗ trợ **progress reporting** (1–99%) trước khi gửi kết quả terminal.

### Schema provider trong database

```sql
-- Bảng provider_registry
provider_id           TEXT UNIQUE      -- "excel-provider"
display_name          TEXT             -- "Excel Data Provider"
description           TEXT             -- mô tả tùy chọn
client_id             TEXT UNIQUE      -- dùng để lấy JWT
client_secret_hash    TEXT             -- BCrypt hash
operations            TEXT[]           -- ["report.dashboard.summary", ...]
timeout_ms            INT DEFAULT 30000
priority              SMALLINT (1-10)  -- 1 = cao nhất
status                TEXT             -- active | suspended | credentials_revoked | maintenance
circuit_breaker       JSONB            -- cấu hình circuit breaker
max_concurrent_requests INT DEFAULT 8
```

---

## 3. Luồng dữ liệu đầy đủ

### 3.1 Widget → Provider → Widget

```
1. Widget render
   └─ useWidgetData({operationPattern, paramsTemplate})
      └─ resolve template: {{today}}, {{filters.xxx}}, {{userId}}

2. POST /api/v1/requests
   Body: { requestId, operation, params, tenantId, userId, options }
   Response: 202 { requestId, queuedAt }

3. RequestSubmissionService (Request.API)
   ├─ validate params against paramsSchema (operation_registry)
   ├─ check operation status = "active"
   └─ publish to RabbitMQ queue: op-request-{high|normal|low}

4. Operation.Router.Worker
   └─ OperationRequestConsumer
      └─ OperationDispatcher.Resolve(operationName)
         └─ handler_type = "provider" → route to Provider.Bridge

5. Provider.Bridge
   ├─ find active provider session for this operation
   └─ stream OperationRequest → provider gRPC stream

6. External Provider
   ├─ (optional) stream OperationResponseChunk {progress: 1-99%}
   └─ stream OperationResponseChunk {terminal: DONE, payloadJson}

7. Response.Dispatcher.Worker
   ├─ cache result in Redis (TTL = cacheTtlSeconds)
   └─ push via SignalR: RequestCompleted { requestId, payloadJson }

8. Browser (SSE)
   └─ useWidgetData receives RequestCompleted
      └─ setData(JSON.parse(payloadJson)) → widget re-renders
```

### 3.2 Fallback polling

Nếu SSE không nhận được kết quả sau X giây, frontend tự fallback:

```
GET /api/v1/requests/{requestId}/result
```

**Các trạng thái trả về:**

| HTTP            | `status`             | Ý nghĩa                                                  |
| --------------- | -------------------- | -------------------------------------------------------- |
| `200 OK`        | `completed`          | Kết quả có sẵn trong Redis, body có thêm `result: {...}` |
| `202 Accepted`  | `in_flight`          | Request đang được xử lý, body có thêm `submittedAt`      |
| `404 Not Found` | `orphan` / `expired` | Request không tìm thấy hoặc đã hết TTL                   |

Interval mặc định: **3000ms** (tăng dần nếu in_flight kéo dài).

---

## 4. Giao thức gRPC — proto định nghĩa

File: `proto/provider.proto`

### 4.1 Service definition

```protobuf
service OperationProvider {
  rpc Connect(stream FromProvider) returns (stream ToProvider);
}
```

Đây là **bidirectional streaming** — cả hai phía đều gửi message liên tục trên cùng một kết nối TCP.

### 4.2 Handshake sequence

```
Provider                              Bridge
   │                                     │
   │── gRPC dial (Bearer JWT header) ──▶ │
   │                                     │ validate JWT
   │── Hello {                           │
   │     provider_id,                    │
   │     version,                        │
   │     supported_operations[],         │
   │     metadata                        │
   │   }  ──────────────────────────────▶│ phải gửi trong 5 giây
   │                                     │
   │◀── Welcome {                        │
   │     session_id,                     │
   │     max_concurrent_requests,        │
   │     heartbeat_interval_seconds      │
   │   }  ───────────────────────────────│
   │                                     │
   │◀── OperationRequest (stream) ───────│ bridge gửi khi có job
   │── OperationResponseChunk ──────────▶│ provider trả kết quả
   │                                     │
   │── Heartbeat (every 30s) ───────────▶│ bắt buộc
   │                                     │
   │◀── RefreshAuthRequired ─────────────│ trước khi JWT hết hạn
   │── RefreshAuth { new_jwt } ─────────▶│
```

### 4.3 OperationRequest (Bridge → Provider)

```protobuf
message OperationRequest {
  string request_id        = 1;  // UUID v7 (idempotency key)
  string operation         = 2;  // "report.dashboard.summary"
  string params_json       = 3;  // JSON đã validated theo paramsSchema
  string tenant_id         = 4;
  string user_id           = 5;
  int64  timeout_at_unix_ms= 6;  // deadline tuyệt đối
  bool   wants_progress    = 7;  // client có muốn nhận progress không
  string traceparent       = 8;  // W3C distributed tracing
  string correlation_id    = 9;  // optional
}
```

### 4.4 OperationResponseChunk (Provider → Bridge)

```protobuf
message OperationResponseChunk {
  string request_id = 1;

  oneof chunk {
    Progress progress = 2;
    Terminal terminal = 3;
  }
}

message Progress {
  int32  percent   = 1;  // 1–99
  string message   = 2;
  int64  timestamp = 3;
}

message Terminal {
  Status status       = 1;  // DONE | FAILED | CANCELLED
  string payload_json = 2;  // kết quả JSON (nếu DONE)
  ErrorDetail error   = 3;  // chi tiết lỗi (nếu FAILED)
}

enum Status {
  DONE      = 0;
  FAILED    = 1;
  CANCELLED = 2;
}

message ErrorDetail {
  string code         = 1;  // INTERNAL_ERROR | VALIDATION_ERROR | RESOURCE_UNAVAILABLE
                             // DEPENDENCY_FAILED | RATE_LIMITED_UPSTREAM | TIMEOUT
  string message      = 2;  // user-safe message
  string details_json = 3;  // optional: field errors, retryable flag
}
```

### 4.5 JWT provider token

- **Endpoint:** `POST /api/v1/providers/token`
- **Body:** `{ client_id, client_secret }`
- **Response:** `{ access_token, expires_in: 900 }`
- **Algorithm:** RS256 (key từ `signing_keys` table)
- **Refresh:** Provider tự refresh khi nhận `RefreshAuthRequired` hoặc ở 80% lifetime (720s)
- **Header gRPC:** `authorization: Bearer <access_token>`

---

## 5. Đăng ký provider qua Admin UI

Truy cập: `https://<HDOS_HOST>` → đăng nhập với role **admin** → tab **Admin** → **Providers**.

### 5.1 Tạo provider mới

1. Nhấn **"Register Provider"**.
2. Điền form:

| Field         | Bắt buộc | Mô tả                                  | Ví dụ                              |
| ------------- | -------- | -------------------------------------- | ---------------------------------- |
| Provider ID   | ✓        | Slug duy nhất, lowercase-kebab         | `ml-fraud-score`                   |
| Display Name  | ✓        | Tên hiển thị                           | `ML Fraud Scoring`                 |
| Description   |          | Mô tả                                  | `Real-time fraud detection`        |
| Client ID     | ✓        | OAuth client ID (thường = Provider ID) | `ml-fraud-score`                   |
| Client Secret | ✓        | Secret để lấy JWT (lưu lại ngay)       | `s3cr3t-...`                       |
| Operations    | ✓        | Danh sách operation patterns           | `ml.fraud.score`, `ml.risk.assess` |
| Timeout (ms)  | ✓        | Timeout mặc định cho operation         | `30000`                            |
| Priority      | ✓        | 1 (cao) – 10 (thấp)                    | `5`                                |

3. Nhấn **Save** → provider được tạo với `status = active`.

> **Lưu ý:** Client Secret chỉ hiển thị một lần tại bước này. Hãy sao chép và lưu vào config của provider ngay.

### 5.2 Probe kết nối

Sau khi provider đã chạy và kết nối, nhấn **"Probe gRPC"** để kiểm tra:

| Bước            | Ý nghĩa                              |
| --------------- | ------------------------------------ |
| TLS Handshake ✓ | Provider kết nối được tới bridge     |
| JWT Accepted ✓  | Token hợp lệ và chưa hết hạn         |
| gRPC Welcome ✓  | Handshake thành công, session active |

Kết quả trả về `latencyMs` và `sessionId` khi thành công.

---

## 6. Đăng ký provider qua API

Tất cả endpoint đều yêu cầu `Authorization: Bearer <admin_jwt>` và role `admin`.

### 6.0 Ghi chú về RequestEnvelope

Khi submit request (`POST /api/v1/requests`), các field `TenantId` và `UserId` **phải khớp** với claim trong JWT của user:

- `TenantId` phải bằng claim `tenant_id` trong token, ngược lại server trả `403 FORBIDDEN`.
- Header `X-Connection-Id` (tùy chọn): gửi kèm SignalR connection ID của client để server push kết quả thẳng về tab đó.

```http
POST /api/v1/requests
Authorization: Bearer <user_jwt>
Content-Type: application/json
X-Connection-Id: <signalr_connection_id>   (optional)

{
  "requestId": "01960000-0000-7000-8000-000000000001",
  "operation": "report.sales.trend",
  "params":    { "fromDate": "2026-05-01", "toDate": "2026-05-28", "groupBy": "day" },
  "tenantId":  "<from_jwt>",
  "userId":    "<from_jwt>",
  "options": {
    "priority":     "Normal",
    "cacheSeconds": 300,
    "progress":     false,
    "timeoutMs":    null
  }
}
```

> `priority` nhận giá trị: `"High"` | `"Normal"` | `"Low"`.

---

### 6.1 Đăng ký provider

```http
POST /api/v1/admin/providers
Content-Type: application/json

{
  "providerId": "ml-fraud-score",
  "displayName": "ML Fraud Scoring",
  "description": "Real-time fraud detection via ML model",
  "clientId": "ml-fraud-score",
  "clientSecret": "your-strong-secret-here",
  "operations": ["ml.fraud.score", "ml.risk.assess"],
  "timeoutMs": 45000,
  "priority": 3
}
```

**Response `201 Created`:**

```json
{
  "providerId": "ml-fraud-score",
  "displayName": "ML Fraud Scoring",
  "clientId": "ml-fraud-score",
  "operations": ["ml.fraud.score", "ml.risk.assess"],
  "timeoutMs": 45000,
  "priority": 3,
  "status": "active",
  "createdAt": "2026-05-28T10:00:00Z"
}
```

### 6.2 Cập nhật provider

```http
PUT /api/v1/admin/providers/{providerId}
Content-Type: application/json

{
  "displayName": "ML Fraud Scoring v2",
  "operations": ["ml.fraud.score", "ml.risk.assess", "ml.anomaly.detect"],
  "timeoutMs": 60000,
  "priority": 2,
  "status": "active"
}
```

### 6.3 Liệt kê tất cả providers

```http
GET /api/v1/admin/providers
```

### 6.4 Probe kết nối

```http
POST /api/v1/admin/providers/{providerId}/probe
```

**Response:**

```json
{
  "tlsHandshake": true,
  "jwtAccepted": true,
  "welcomeReceived": true,
  "latencyMs": 12,
  "sessionId": "01910f3e-...",
  "errorDetail": null
}
```

---

## 7. Quản lý credentials

### 7.1 Rotate secret (tạo secret mới)

```http
POST /api/v1/admin/providers/{providerId}/credentials/rotate
```

**Response:**

```json
{
  "newClientSecret": "rpf_live_xxxxxxxxxxxx",
  "gracePeriodSeconds": 60
}
```

- Secret cũ vẫn hoạt động trong **60 giây** (grace period).
- Sau grace period, secret cũ bị vô hiệu hóa.
- **Cập nhật config provider và restart trước khi hết grace period.**

### 7.2 Đặt secret cụ thể (không random)

```http
POST /api/v1/admin/providers/{providerId}/credentials/set
Content-Type: application/json

{ "clientSecret": "my-custom-secret-value" }
```

### 7.3 Xem lại plaintext secret (admin only)

```http
GET /api/v1/admin/providers/{providerId}/credentials/reveal
```

Secret được lưu mã hóa AES (ASP.NET Data Protection). Chỉ admin mới xem được.

### 7.4 Bootstrap token

Dùng để provider tự fetch secret của mình lần đầu khởi động (one-time token).

```http
GET /api/v1/admin/providers/{providerId}/bootstrap-token
```

```http
POST /api/v1/admin/providers/{providerId}/bootstrap-token/regenerate
```

Provider dùng bootstrap token để gọi:

```http
POST /api/v1/providers/bootstrap
Authorization: Bearer <bootstrap_token>
```

→ nhận lại `{ clientSecret: "..." }` và tự cấu hình.

### 7.5 Revoke credentials

```http
POST /api/v1/admin/providers/{providerId}/credentials/revoke
```

Provider bị set `status = credentials_revoked`. Mọi token cũ bị từ chối ngay lập tức.

---

## 8. Cấu hình operation registry

Operation registry ánh xạ **operation pattern** → **handler** (provider hoặc built-in).

### 8.1 Thêm operation mới

**Qua Admin UI:** Tab **Operations** → **Add Operation**.

**Qua migration SQL:**

```sql
INSERT INTO operation_registry (
  operation_pattern, handler_type, provider_id,
  params_schema, payload_schema,
  timeout_ms, cacheable, cache_ttl_seconds, idempotent, status
) VALUES (
  'ml.fraud.score',
  'provider',
  'ml-fraud-score',
  '{
    "type": "object",
    "properties": {
      "transactionId": { "type": "string" },
      "amount":        { "type": "number", "minimum": 0 },
      "currency":      { "type": "string", "enum": ["VND","USD"] }
    },
    "required": ["transactionId", "amount"]
  }',
  '{
    "type": "object",
    "properties": {
      "score":    { "type": "number", "minimum": 0, "maximum": 1 },
      "label":    { "type": "string", "enum": ["safe","suspicious","fraud"] },
      "reasons":  { "type": "array", "items": { "type": "string" } }
    }
  }',
  45000,   -- timeout_ms
  TRUE,    -- cacheable
  300,     -- cache_ttl_seconds
  TRUE,    -- idempotent
  'active'
) ON CONFLICT (operation_pattern) DO NOTHING;
```

### 8.2 Cấu trúc params_schema

Platform **validate params** theo JSON Schema trước khi gửi đến provider. Schema hỗ trợ:

```json
{
  "type": "object",
  "properties": {
    "fromDate": {
      "type": "string",
      "format": "date",
      "description": "Ngày bắt đầu (ISO 8601: YYYY-MM-DD)"
    },
    "toDate": {
      "type": "string",
      "format": "date"
    },
    "groupBy": {
      "type": "string",
      "enum": ["day", "week", "month"],
      "default": "day"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50,
      "default": 10
    }
  },
  "required": ["fromDate", "toDate"]
}
```

> **Quan trọng:** Nếu `required` không được khai báo đúng và widget gửi thiếu field, request sẽ bị từ chối với lỗi validation ngay tại `request-api` — không cần tốn round-trip đến provider.

### 8.2b Thêm operation qua API

```http
POST /api/v1/admin/operations
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "operationPattern": "ml.fraud.score",
  "handlerType":      "provider",
  "providerId":       "ml-fraud-score",
  "paramsSchemaJson": "{\"type\":\"object\",\"properties\":{\"transactionId\":{\"type\":\"string\"}},\"required\":[\"transactionId\"]}",
  "timeoutMs":        45000,
  "cacheable":        true,
  "cacheTtlSeconds":  300,
  "idempotent":       true,
  "resultChartType":  "kpi_grid"
}
```

**Cập nhật operation:**

```http
PUT /api/v1/admin/operations/ml.fraud.score
Content-Type: application/json

{
  "handlerType":      "provider",
  "providerId":       "ml-fraud-score",
  "paramsSchemaJson": "...",
  "timeoutMs":        60000,
  "cacheable":        true,
  "cacheTtlSeconds":  600,
  "idempotent":       true,
  "status":           "active",
  "resultChartType":  "kpi_grid"
}
```

**Xóa operation:**

```http
DELETE /api/v1/admin/operations/ml.fraud.score
```

> Pattern có dấu `.` phải URL-encode khi dùng curl: `ml%2Efraud%2Escore` → tuy nhiên server dùng catch-all route `{**pattern}` nên hầu hết client gửi thẳng cũng hoạt động.

**Field `resultChartType`** ánh xạ operation sang loại widget mà Dashboard Designer tự động đề xuất:

| Giá trị               | Widget tương ứng  |
| --------------------- | ----------------- |
| `kpi_grid`            | KpiGrid           |
| `line_chart`          | LineChart         |
| `bar_chart`           | BarChart          |
| `gauge`               | Gauge             |
| `heatmap`             | Heatmap           |
| `scatter`             | Scatter           |
| `funnel`              | Funnel            |
| `timeline_vertical`   | Timeline          |
| `alert_list`          | AlertList         |
| `pivot_table`         | Table             |
| `patient_flow_stages` | PatientFlowStages |
| `bed_grid`            | BedGrid           |
| `room_status_grid`    | RoomStatusGrid    |
| `risk_tiers`          | RiskTiers         |
| `flow_steps`          | FlowSteps         |
| `news2_bars`          | News2Bars         |
| `map_pins`            | MapPins           |

---

### 8.3 Status của operation

| Status       | Ý nghĩa                             |
| ------------ | ----------------------------------- |
| `active`     | Nhận request bình thường            |
| `deprecated` | Vẫn hoạt động nhưng cảnh báo client |
| `disabled`   | Từ chối tất cả request (503)        |

### 8.4 Handler types

| handler_type | Ý nghĩa                                      |
| ------------ | -------------------------------------------- |
| `provider`   | Route đến external provider qua bridge       |
| `datasource` | Built-in handler lấy data từ Postgres        |
| `widget`     | Built-in handler cho widget-level operations |
| `admin`      | Administrative operations                    |

---

## 9. Triển khai provider mới

### 9.1 Yêu cầu tối thiểu

Provider phải implement gRPC client theo `proto/provider.proto` và thực hiện:

1. Lấy JWT từ `POST /api/v1/providers/token`
2. Kết nối đến `provider-bridge:5400` với header `authorization: Bearer <jwt>`
3. Gửi `Hello` trong vòng 5 giây
4. Nhận `Welcome` → bắt đầu xử lý `OperationRequest`
5. Gửi `Heartbeat` mỗi `heartbeat_interval_seconds` giây (thường 30s)
6. Refresh JWT khi nhận `RefreshAuthRequired`

### 9.2 Startup sequence (code logic)

```
START
├─ Read config: CLIENT_ID, CLIENT_SECRET, TOKEN_ENDPOINT, BRIDGE_GRPC_URL
├─ POST /api/v1/providers/token → get access_token
├─ gRPC Dial(bridge_url, WithBearerToken(access_token))
├─ Connect() → open bidirectional stream
├─ Send Hello { provider_id, version, operations[] }
├─ Receive Welcome { session_id, heartbeat_interval_seconds }
│
└─ LOOP:
    ├─ Receive OperationRequest → spawn goroutine/task to handle
    ├─ Send OperationResponseChunk (progress) while processing
    ├─ Send OperationResponseChunk (terminal DONE|FAILED) when done
    ├─ Send Heartbeat every heartbeat_interval_seconds
    └─ On RefreshAuthRequired → refresh JWT, send RefreshAuth
```

### 9.3 Environment variables cần thiết

```env
# Bắt buộc
PROVIDER_ID=my-new-provider
CLIENT_ID=my-new-provider
CLIENT_SECRET=<secret-từ-admin-ui>
TOKEN_ENDPOINT=http://request-api:5000/api/v1/providers/token
BRIDGE_GRPC_URL=http://provider-bridge:5400

# Tùy chọn
PROVIDER_VERSION=1.0.0
LOG_LEVEL=Information
```

### 9.4 Xử lý lỗi

```
Trường hợp                     → Hành động
──────────────────────────────────────────────────────
timeout_at_unix_ms đã qua      → Trả CANCELLED (không xử lý nữa)
Lỗi trong business logic       → Trả FAILED + ErrorDetail.code = INTERNAL_ERROR
Dependency bên ngoài unavail.  → Trả FAILED + ErrorDetail.code = DEPENDENCY_FAILED
Input không hợp lệ             → Trả FAILED + ErrorDetail.code = VALIDATION_ERROR
Bị rate limit upstream         → Trả FAILED + ErrorDetail.code = RATE_LIMITED_UPSTREAM
```

---

## 10. Ví dụ: Excel Provider

Excel Provider là provider mẫu đọc dữ liệu từ file `.xlsx` và phục vụ các report.

### 10.1 Operations được đăng ký (21 operations)

**Business — Sales & Reports:**

| Operation Pattern             | Widget type           | Params tùy chọn                 | Cache TTL   |
| ----------------------------- | --------------------- | ------------------------------- | ----------- |
| `report.dashboard.summary`    | KpiGrid               | —                               | 60s         |
| `report.sales.trend`          | LineChart / AreaChart | `fromDate`, `toDate`, `groupBy` | 300s        |
| `report.inventory.status`     | BarChart              | —                               | 120s        |
| `report.regional.performance` | BarChart              | `period`                        | 60s         |
| `report.channel.comparison`   | PieChart / DonutChart | —                               | 300s        |
| `report.product.detail`       | Table                 | `productId`                     | 300s        |
| `report.top.performers`       | Table                 | `limit`, `period`               | 120s        |
| `report.sales.gauge`          | Gauge                 | —                               | 60s         |
| `report.sales.heatmap`        | Heatmap               | `fromDate`, `toDate`            | 120s        |
| `report.sales.scatter`        | Scatter               | `fromDate`, `toDate`            | 120s        |
| `report.sales.funnel`         | Funnel                | `period` (week/month/quarter)   | 120s        |
| `report.sales.timeline`       | Timeline              | `limit` (1-50)                  | 60s         |
| `report.sales.alerts`         | AlertList             | —                               | không cache |
| `report.sales.pivot`          | Table (pivot)         | `fromDate`, `toDate`            | 300s        |

**Healthcare Demo:**

| Operation Pattern          | Widget type       | Params tùy chọn                | Cache TTL   |
| -------------------------- | ----------------- | ------------------------------ | ----------- |
| `report.demo.patient.flow` | PatientFlowStages | —                              | không cache |
| `report.demo.bed.status`   | BedGrid           | —                              | không cache |
| `report.demo.room.status`  | RoomStatusGrid    | —                              | không cache |
| `report.demo.risk.tiers`   | RiskTiers         | —                              | không cache |
| `report.demo.flow.steps`   | FlowSteps         | —                              | không cache |
| `report.demo.news2`        | News2Bars         | `levelFilter` (e.g. `"L2,L3"`) | không cache |
| `report.demo.map.pins`     | MapPins           | —                              | không cache |

### 10.2 Response structure mẫu

**report.dashboard.summary:**

```json
{
  "totalRevenue": 1250000000,
  "totalUnits": 8432,
  "topRegion": "Hà Nội",
  "topProduct": "Sản phẩm A",
  "revenueByChannel": {
    "online": 680000000,
    "store": 570000000
  },
  "alerts": [{ "level": "warning", "message": "Tồn kho sản phẩm B thấp" }]
}
```

**report.sales.trend:**

```json
{
  "labels": ["2026-05-01", "2026-05-02", "2026-05-03"],
  "series": [
    { "name": "Online", "data": [120000000, 135000000, 98000000] },
    { "name": "Cửa hàng", "data": [95000000, 110000000, 87000000] }
  ]
}
```

### 10.3 Cấu hình Excel Provider

File Excel đặt trong volume `/app/ExcelData`. Cấu hình trong `appsettings.json`:

```json
{
  "Provider": {
    "ProviderId": "excel-provider",
    "ClientId": "excel-provider",
    "ClientSecret": "<secret>",
    "TokenEndpoint": "http://request-api:5000/api/v1/providers/token",
    "BridgeGrpcUrl": "http://provider-bridge:5400"
  },
  "Excel": {
    "DataPath": "/app/ExcelData"
  }
}
```

---

## 11. Cấu hình docker-compose

### 11.1 Chạy với providers overlay

```bash
# Chỉ core stack
docker compose up -d

# Core + tất cả providers
docker compose -f docker-compose.yml -f docker-compose.providers.yml up -d

# Chỉ restart excel-provider
docker compose -f docker-compose.yml -f docker-compose.providers.yml up -d --force-recreate excel-provider
```

### 11.2 Cấu hình provider trong docker-compose.providers.yml

```yaml
services:
  my-new-provider:
    image: my-registry/my-provider:latest
    environment:
      PROVIDER_ID: my-new-provider
      CLIENT_ID: my-new-provider
      CLIENT_SECRET: "${MY_PROVIDER_SECRET:-dev-secret}"
      TOKEN_ENDPOINT: http://request-api:5000/api/v1/providers/token
      BRIDGE_GRPC_URL: http://provider-bridge:5400
    depends_on:
      - request-api
      - provider-bridge
    networks:
      - platform

networks:
  platform:
    external: true
    name: hdos_platform
```

### 11.3 Truyền secret qua .env

Trong file `.env` tại thư mục gốc:

```env
MY_PROVIDER_SECRET=strong-secret-value-here
EXCEL_PROVIDER_SECRET=excel-secret-dev-2024
```

---

## 12. Circuit breaker & resilience

Mỗi provider có config circuit breaker riêng, lưu trong cột `circuit_breaker` (JSONB):

```json
{
  "failureThreshold": 5,
  "windowSeconds": 60,
  "cooldownSeconds": 30
}
```

| Field              | Ý nghĩa                                               |
| ------------------ | ----------------------------------------------------- |
| `failureThreshold` | Số lần thất bại trong window → trip circuit           |
| `windowSeconds`    | Cửa sổ thời gian đếm lỗi                              |
| `cooldownSeconds`  | Thời gian circuit ở trạng thái OPEN trước khi thử lại |

**Trạng thái circuit breaker:**

- `CLOSED` → hoạt động bình thường
- `OPEN` → reject request ngay (trả FAILED không gửi đến provider)
- `HALF_OPEN` → cho qua 1 request thử; nếu thành công → CLOSED, thất bại → OPEN

### Cập nhật circuit breaker qua API

```http
PUT /api/v1/admin/providers/{providerId}
Content-Type: application/json

{
  "circuitBreaker": {
    "failureThreshold": 3,
    "windowSeconds": 30,
    "cooldownSeconds": 60
  }
}
```

---

## 13. Kiểm tra & debug

### 13.1 Kiểm tra provider đang kết nối

```bash
# Xem logs provider-bridge
docker compose logs provider-bridge --tail=50 -f

# Tìm session active
docker compose logs provider-bridge 2>&1 | grep "Welcome sent\|session_id"
```

### 13.2 Kiểm tra operation routing

```bash
docker compose logs operation-router-worker --tail=50 -f
# Tìm: "Dispatching operation" hoặc "No handler found"
```

### 13.3 Test gửi request thủ công

```bash
# Lấy user token từ Keycloak (hoặc dùng token từ browser DevTools)
TOKEN="eyJ..."

# Gửi request
curl -X POST http://localhost:5500/api/v1/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-001",
    "operation": "report.dashboard.summary",
    "params": {},
    "options": { "priority": "Normal", "cacheSeconds": 0 }
  }'
# → 202 { "requestId": "test-001", "queuedAt": "..." }

# Poll kết quả
curl http://localhost:5500/api/v1/requests/test-001/result \
  -H "Authorization: Bearer $TOKEN"
# → 200: { "status": "completed", "requestId": "test-001", "result": {...} }
# → 202: { "status": "in_flight",  "requestId": "test-001", "submittedAt": "..." }
# → 404: { "status": "orphan",     "requestId": "test-001" }

# Hủy request đang chạy (best-effort, trả 202 ngay lập tức)
curl -X POST http://localhost:5500/api/v1/requests/test-001/cancel \
  -H "Authorization: Bearer $TOKEN"
```

### 13.4 Kiểm tra Redis cache

```bash
docker compose exec redis redis-cli
# Tìm cache key
KEYS "result:*"
# Xem TTL
TTL "result:report.dashboard.summary:..."
```

### 13.5 Kiểm tra RabbitMQ queues

Truy cập `http://localhost:15672` (guest/guest):

- `op-request-high`, `op-request-normal`, `op-request-low` — queue chờ xử lý
- Nếu queue tăng không giảm → worker hoặc provider bị stuck

### 13.6 Các lỗi thường gặp

| Lỗi                                                           | Nguyên nhân                                    | Giải pháp                                       |
| ------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| `No handler found for operation`                              | Operation chưa đăng ký hoặc `status != active` | Kiểm tra `operation_registry` trong DB          |
| `Parameter validation failed: required ["fromDate","toDate"]` | Widget thiếu params                            | Sửa `paramsTemplate` trong widget config        |
| `Provider session not found`                                  | Provider chưa connect hoặc đã disconnect       | Kiểm tra logs provider, restart nếu cần         |
| `Circuit breaker OPEN`                                        | Provider trả lỗi quá nhiều                     | Xem logs provider, fix lỗi, đợi cooldown        |
| `JWT expired`                                                 | Provider không refresh token đúng lúc          | Provider phải xử lý `RefreshAuthRequired`       |
| `RedisConnectionException: abortConnect`                      | Redis chưa ready lúc service start             | Thêm `abortConnect=false` vào connection string |

---

## 14. Bảng tra cứu nhanh

### API endpoints

**Provider Management (yêu cầu role `admin`):**

| Method | Path                                                      | Mô tả                      |
| ------ | --------------------------------------------------------- | -------------------------- |
| `GET`  | `/api/v1/admin/providers`                                 | Danh sách providers        |
| `POST` | `/api/v1/admin/providers`                                 | Đăng ký provider mới       |
| `PUT`  | `/api/v1/admin/providers/{id}`                            | Cập nhật provider          |
| `POST` | `/api/v1/admin/providers/{id}/probe`                      | Test kết nối gRPC          |
| `POST` | `/api/v1/admin/providers/{id}/credentials/rotate`         | Tạo secret mới (grace 60s) |
| `POST` | `/api/v1/admin/providers/{id}/credentials/revoke`         | Vô hiệu hóa credentials    |
| `POST` | `/api/v1/admin/providers/{id}/credentials/set`            | Đặt secret cụ thể          |
| `GET`  | `/api/v1/admin/providers/{id}/credentials/reveal`         | Xem plaintext secret       |
| `GET`  | `/api/v1/admin/providers/{id}/bootstrap-token`            | Xem bootstrap token        |
| `POST` | `/api/v1/admin/providers/{id}/bootstrap-token/regenerate` | Tạo bootstrap token mới    |

**Operation Registry (yêu cầu role `admin`):**

| Method   | Path                                 | Mô tả                                              |
| -------- | ------------------------------------ | -------------------------------------------------- |
| `GET`    | `/api/v1/admin/operations`           | Danh sách operations (filter: `?resultChartType=`) |
| `POST`   | `/api/v1/admin/operations`           | Thêm operation mới                                 |
| `PUT`    | `/api/v1/admin/operations/{pattern}` | Cập nhật operation                                 |
| `DELETE` | `/api/v1/admin/operations/{pattern}` | Xóa operation                                      |

**Provider Auth (public):**

| Method | Path                          | Mô tả                                 |
| ------ | ----------------------------- | ------------------------------------- |
| `POST` | `/api/v1/providers/token`     | Provider lấy JWT (client_credentials) |
| `POST` | `/api/v1/providers/bootstrap` | Provider fetch secret lần đầu         |

**Client Request API (yêu cầu Bearer user JWT):**

| Method | Path                           | Mô tả                                         |
| ------ | ------------------------------ | --------------------------------------------- |
| `POST` | `/api/v1/requests`             | Submit operation request → `202 SubmitAck`    |
| `GET`  | `/api/v1/requests/{id}/result` | Poll kết quả (completed / in_flight / orphan) |
| `POST` | `/api/v1/requests/{id}/cancel` | Hủy request (best-effort, `202` ngay lập tức) |

### Port map

| Service         | Host port | Container port | Protocol   |
| --------------- | --------- | -------------- | ---------- |
| gateway         | 5500      | 5500           | HTTP       |
| request-api     | 5001      | 5000           | HTTP       |
| provider-bridge | 5400      | 5400           | gRPC/HTTP2 |
| ingestion-api   | 5100      | 5100           | HTTP       |
| realtime-hub    | 5200      | 5200           | HTTP + SSE |
| postgres        | 5433      | 5432           | TCP        |
| redis           | 6380      | 6379           | TCP        |
| rabbitmq        | 5672      | 5672           | AMQP       |
| rabbitmq UI     | 15672     | 15672          | HTTP       |
| keycloak        | 8180      | 8080           | HTTP       |

### Provider status lifecycle

```
(register) → active
active → suspended     (tạm dừng thủ công)
active → maintenance   (bảo trì)
active → credentials_revoked  (revoke)
suspended → active     (kích hoạt lại)
credentials_revoked → active  (sau khi rotate + cấu hình lại)
```

---

_Tài liệu dựa trên phân tích codebase HDOS — cập nhật lần cuối: 2026-05-28 (bổ sung: cancel endpoint, polling states, 14 Excel operations mới, admin operations API, RequestEnvelope notes, resultChartType mapping)._
