# ViewBindings Admin UI — Spec & Implementation Guide

> **Mục đích.** Tài liệu mô tả chi tiết logic, nghiệp vụ và cách triển khai trang `/admin/lakehouse-views` — màn admin để đăng ký, quản lý, và trigger sync các "ViewBinding" (mapping 1 PostgreSQL view của warehouse → 1 SourceProfile trong DataMatching).
>
> Trang này là FE phía Stage 5 của plan Unified Ingest Pipeline (xem `Hdos/docs/44-unified-ingest-pipeline.md`). Backend đã sẵn sàng — FE chỉ còn việc dựng UI gọi 7 endpoint mới.
>
> **Đối tượng đọc.** Dev FE chuẩn bị implement. Không cần đọc xong code BE — tài liệu này tự đủ.

---

## Mục lục

1. [Nghiệp vụ tổng quan](#1-nghiệp-vụ-tổng-quan)
2. [User journey — admin thao tác gì](#2-user-journey--admin-thao-tác-gì)
3. [Backend contract — 7 endpoint](#3-backend-contract--7-endpoint)
4. [Cấu trúc thư mục FE đề xuất](#4-cấu-trúc-thư-mục-fe-đề-xuất)
5. [State management — quản lý state thế nào](#5-state-management--quản-lý-state-thế-nào)
6. [UI/UX spec — từng vùng trên trang](#6-uiux-spec--từng-vùng-trên-trang)
7. [Form spec — từng field, từng validation](#7-form-spec--từng-field-từng-validation)
8. [Hành vi button — chi tiết từng action](#8-hành-vi-button--chi-tiết-từng-action)
9. [Error & edge cases](#9-error--edge-cases)
10. [Thêm route vào sidebar](#10-thêm-route-vào-sidebar)
11. [Implementation order — làm theo thứ tự nào](#11-implementation-order--làm-theo-thứ-tự-nào)
12. [Testing checklist](#12-testing-checklist)
13. [Phụ lục — mock data + ví dụ payload](#13-phụ-lục--mock-data--ví-dụ-payload)

---

## 1. Nghiệp vụ tổng quan

### 1.1 Vấn đề người dùng giải quyết

Trước đây, để một bảng dữ liệu từ lakehouse (vd: bảng xét nghiệm trong PostgreSQL warehouse) hiển thị trên màn hình bác sĩ qua DynamicForm, dev phải:

1. Sửa code BE — thêm hardcoded view config trong `WarehouseViewSyncer`
2. Deploy LakehouseService
3. Cấu hình DataSource trong DynamicForm trỏ đến endpoint riêng `/lakehouse/snapshots/latest`
4. FE phải biết phân biệt endpoint nào cho source nào

Sau khi BE chuyển sang Unified Ingest Pipeline (Phase 2), workflow chuẩn là:

1. **DE** tạo PG view trong warehouse (`CREATE VIEW warehouse.v_xxx_v1 AS ...`)
2. **Admin** (qua trang này) đăng ký `ViewBinding`: chỉ định view nào → ánh xạ tới `SourceSystem` + `RecordType` nào
3. **Admin** (qua trang DataMatching admin — KHÔNG thuộc phạm vi trang này) đăng ký `SourceProfile` (mapping field DB → canonical) cho cặp `(SourceSystem, RecordType)` đó
4. **Worker hoặc admin** trigger sync → mỗi row trong view chảy qua RabbitMQ vào DataMatching → ngồi sẵn ở `/dm/records/{id}`
5. **Admin** (qua trang Screen Designer) tạo DynForm screen trỏ DataSource `/dm/records/{id}` → bác sĩ mở screen thấy data

Trang này chỉ phụ trách **bước 2 + bước 4 trigger** trong workflow trên.

### 1.2 Đối tượng người dùng

- **Admin/DevOps** (vai trò `admin` hoặc `dataops`)
- Đã quen UI HDOS Admin (đã có sidebar, đã biết cách dùng table/form)
- Đã đọc qua workflow trong `Hdos/docs/44-unified-ingest-pipeline.md` mục 4 và mục 6
- **Không phải lập trình viên** — không cần hiểu MassTransit / RabbitMQ

### 1.3 Mental model của admin

Khi vào trang này, admin nghĩ:

> "Tôi có 1 view tên `warehouse.v_lab_results_v1` trong warehouse Postgres. Tôi muốn dữ liệu của nó chảy vào pipeline DataMatching dưới mã `(lakehouse:v_lab_results_v1, lab-result)`. Cột business key là `business_key`, cột timestamp để poll là `updated_at`. Cứ 5 phút sync 1 lần. Bật active."

→ Admin gõ form, ấn Save → xong. Sau đó admin có thể:
- Nhấn "Sync now" để chạy ngay lập tức (không đợi worker)
- Vào tab "Sync status" xem lần sync gần nhất pass/fail
- Tạm dừng binding bằng cách bật/tắt `IsActive`
- Xoá hẳn binding khi không dùng

### 1.4 Quan hệ với các trang khác

```
┌────────────────────────────────────────────────────────────┐
│ Workflow đăng ký nguồn lakehouse (3 trang admin)           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [1] /admin/sources              ← TRANG NÀY KHÔNG LÀM    │
│       Đăng ký SourceProfile (mapping field DB → canonical)│
│       Endpoint: POST /dm/sources                          │
│                                                            │
│  [2] /admin/lakehouse-views      ← TRANG TÀI LIỆU NÀY    │
│       Đăng ký ViewBinding (view → SourceSystem/RecordType)│
│       Endpoint: POST /lakehouse/view-bindings             │
│                                                            │
│  [3] /admin                      ← Screen Designer        │
│       Tạo DynForm screen với DataSource /dm/records/{id}  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

> **Note FE**: Trang `/admin/sources` (đăng ký SourceProfile) hiện chưa có UI riêng. Admin đang phải dùng Postman/curl gọi `POST /dm/sources`. Đây là gap riêng, không thuộc phạm vi tài liệu này — nhưng FE nên biết để cảnh báo admin trong UI ("Trước khi tạo ViewBinding, đảm bảo SourceProfile đã đăng ký cho cặp (SourceSystem, RecordType) tương ứng — nếu không, sync sẽ skip với log warning").

---

## 2. User journey — admin thao tác gì

### 2.1 Happy path — đăng ký 1 view mới

```
[1] Admin click sidebar "Nguồn Lakehouse" (item mới sẽ thêm — xem §10)
    URL: /admin/lakehouse-views

[2] Trang load → GET /lakehouse/view-bindings → list rỗng (lần đầu)
    Hiển thị: empty state "Chưa có view binding nào" + button "Thêm binding"

[3] Admin click "Thêm binding" → modal form mở

[4] Admin điền form:
    - View name:               warehouse.v_lab_results_v1
    - Source system:           lakehouse:v_lab_results_v1
    - Record type:             lab-result
    - Business key column:     business_key
    - Updated-at column:       updated_at
    - Poll interval (giây):    300

[5] Admin click "Lưu"
    → POST /lakehouse/view-bindings với payload trong form
    → 201 → đóng modal, table refresh, toast "Đã tạo binding"
    → row mới xuất hiện trong table với badge "Active" (default IsActive=true)

[6] Admin click "Sync now" trên row vừa tạo
    → POST /lakehouse/view-bindings/{id}/sync
    → 202 → toast "Sync xong — N rows, jobId xxx"
    → trong RabbitMQ: N event RawRecordIngestRequestedIntegrationEvent
    → DataMatching consume → /dm/records xuất hiện N record
    → bác sĩ vào screen DynForm tương ứng sẽ thấy data
```

### 2.2 Edge cases trong journey

| Tình huống | Hệ thống phản ứng |
|---|---|
| Admin tạo binding với view name đã tồn tại | Backend trả 409 Conflict → toast đỏ "Binding cho view này đã tồn tại" |
| Admin sync 1 binding `IsActive=false` | Backend trả 400 → toast "Binding đang inactive, hãy bật trước khi sync" |
| Admin sync 1 binding mà SourceProfile chưa đăng ký bên DataMatching | Backend **vẫn 202 success** (sync chạy được + publish event), nhưng DataMatching consumer log warning + skip. Trên UI, `rowCount` trả về vẫn = N (số rows đã publish). Admin nên check `GET /dm/records` để verify thực sự có record hay không. **FE nên hiển thị note nhỏ "Verify ở /admin/datamatch/records sau khi sync"** |
| Admin xoá binding đang được worker sync | Hệ thống không có lock — worker có thể đang đọc binding. Backend `DELETE` chỉ remove khỏi DB, không cancel job. Worst case: 1 lần sync nữa publish theo binding đã xoá rồi mới ngừng. Chấp nhận được, không cần xử lý FE |
| Network/server down lúc đang sync | `POST /sync` trả timeout hoặc 500 → toast đỏ "Sync thất bại: {reason}", row vẫn ở trong table không đổi |
| Tạo binding nhưng poll interval < 30s | Backend trả 400 ValidationFail từ FluentValidation → toast đỏ với message |

---

## 3. Backend contract — 7 endpoint

> Base URL: `${NEXT_PUBLIC_API_URL}/lakehouse/view-bindings`
> Auth: Bearer token (handled by `httpClient` Axios interceptor)
> Response envelope: `{ success: boolean, data: T }` — phải unwrap qua helper `unwrapForms<T>()` ở `adminApi.ts` (xem code mẫu §4.2)

### 3.1 List

```http
GET /lakehouse/view-bindings?activeOnly={bool}
→ 200 { success: true, data: ViewBindingDto[] }
```

Query param `activeOnly`:
- `true` → chỉ trả binding với `isActive = true`
- `false` (default) → trả tất cả

**Type:**

```ts
export interface ViewBindingDto {
  id: string;                  // GUID
  viewName: string;            // "warehouse.v_lab_results_v1"
  sourceSystem: string;        // "lakehouse:v_lab_results_v1"
  recordType: string;          // "lab-result"
  businessKeyColumn: string;   // "business_key"
  updatedAtColumn: string;     // "updated_at"
  pollIntervalSeconds: number; // 300
  isActive: boolean;
  createdAtUtc: string;        // ISO datetime
  updatedAtUtc: string | null;
}
```

### 3.2 Create

```http
POST /lakehouse/view-bindings
Content-Type: application/json

{
  "viewName":            "warehouse.v_lab_results_v1",
  "sourceSystem":        "lakehouse:v_lab_results_v1",
  "recordType":          "lab-result",
  "businessKeyColumn":   "business_key",
  "updatedAtColumn":     "updated_at",
  "pollIntervalSeconds": 300
}

→ 201 { success: true, data: ViewBindingDto }
→ 409 { success: false, error: { code: "Conflict", message: "..." } }
→ 400 { success: false, error: { code: "Validation", message: "..." } }
```

Lưu ý: `isActive` mặc định = `true` khi tạo. Không nằm trong payload.

### 3.3 Update

```http
PUT /lakehouse/view-bindings/{id}
Content-Type: application/json

{
  "viewName":            "...",
  "sourceSystem":        "...",
  "recordType":          "...",
  "businessKeyColumn":   "...",
  "updatedAtColumn":     "...",
  "pollIntervalSeconds": 300,
  "isActive":            true
}

→ 200 { success: true, data: ViewBindingDto }
→ 404 { success: false, error: { code: "NotFound", ... } }
→ 409 { success: false, error: { code: "Conflict", ... } }
```

PUT là **full replace** — phải gửi tất cả field.

### 3.4 Delete

```http
DELETE /lakehouse/view-bindings/{id}
→ 204 No Content
→ 404 { success: false, error: { code: "NotFound", ... } }
```

### 3.5 Trigger sync 1 binding

```http
POST /lakehouse/view-bindings/{id}/sync
→ 202 { success: true, data: SyncResult }
→ 404 { success: false, error: { code: "ViewBinding.NotFound", ... } }
→ 400 { success: false, error: { code: "ViewBinding.Inactive", ... } }
```

**Type:**

```ts
export interface SyncResult {
  bindingId: string;        // GUID
  viewName: string;
  rowCount: number;         // số rows đã publish event
  jobId: string;            // "sync-{recordType}-{yyyyMMddHHmmss}"
  duration: string;         // "00:00:01.2345678" (TimeSpan format)
  error: string | null;     // null nếu thành công
}
```

### 3.6 Trigger sync all active

```http
POST /lakehouse/view-bindings/sync-all
→ 202 { success: true, data: SyncResult[] }
```

Mỗi item trong array tương ứng 1 binding active. Item có `error != null` nghĩa là binding đó fail nhưng các binding khác vẫn chạy độc lập.

### 3.7 Sync status

```http
GET /lakehouse/view-bindings/sync-status
→ 200 { success: true, data: SyncState[] }
```

**Type:**

```ts
export interface SyncState {
  viewName: string;
  lastSyncedAt: string;     // ISO datetime
  lastRowCount: number;
  lastJobId: string | null;
}
```

> **Quan trọng:** `SyncState` keyed by `viewName` (không phải `bindingId`). Để map binding ↔ status, FE join bằng `viewName`.

### 3.8 Lỗi chung — envelope format

Mọi error response từ BE đều theo format:

```json
{
  "success": false,
  "error": {
    "code": "Conflict|NotFound|Validation|ViewBinding.NotFound|...",
    "message": "Mô tả tiếng Việt"
  }
}
```

FE đọc `error.message` để show toast. Code dùng để phân nhánh xử lý (vd 409 vs 400).

---

## 4. Cấu trúc thư mục FE đề xuất

### 4.1 File layout

```
src/
├── app/
│   └── admin/
│       └── lakehouse-views/                   ← THƯ MỤC MỚI
│           ├── page.tsx                       ← Main page component
│           ├── _components/
│           │   ├── ViewBindingsTable.tsx     ← Table list + actions per row
│           │   ├── ViewBindingFormModal.tsx  ← Modal create + edit
│           │   ├── SyncStatusPanel.tsx       ← Collapse panel sync state
│           │   └── EmptyState.tsx            ← Hiển thị khi list rỗng
│           └── _hooks/
│               └── useViewBindings.ts        ← Hook chứa state + actions
│
└── infrastructure/
    └── http/
        └── adminApi.ts                       ← THÊM 7 method mới
```

### 4.2 Bổ sung vào `src/infrastructure/http/adminApi.ts`

Thêm types ở phần trên (gần các interface khác):

```ts
// ── Lakehouse ViewBindings ────────────────────────────────────────────────

export interface ViewBindingDto {
  id: string;
  viewName: string;
  sourceSystem: string;
  recordType: string;
  businessKeyColumn: string;
  updatedAtColumn: string;
  pollIntervalSeconds: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface CreateViewBindingBody {
  viewName: string;
  sourceSystem: string;
  recordType: string;
  businessKeyColumn: string;
  updatedAtColumn: string;
  pollIntervalSeconds: number;
}

export interface UpdateViewBindingBody extends CreateViewBindingBody {
  isActive: boolean;
}

export interface SyncResult {
  bindingId: string;
  viewName: string;
  rowCount: number;
  jobId: string;
  duration: string;
  error: string | null;
}

export interface SyncState {
  viewName: string;
  lastSyncedAt: string;
  lastRowCount: number;
  lastJobId: string | null;
}
```

Thêm 7 method vào object `adminApi` (cuối file, đặt trong section riêng `// ── ViewBindings ──`):

```ts
listViewBindings: (activeOnly = false): Promise<ViewBindingDto[]> =>
  httpClient
    .get<{ success: boolean; data: ViewBindingDto[] } | ViewBindingDto[]>(
      `/lakehouse/view-bindings?activeOnly=${activeOnly}`,
    )
    .then((r) => unwrapForms<ViewBindingDto[]>(r.data)),

createViewBinding: (body: CreateViewBindingBody): Promise<ViewBindingDto> =>
  httpClient
    .post<{ success: boolean; data: ViewBindingDto } | ViewBindingDto>(
      "/lakehouse/view-bindings",
      body,
    )
    .then((r) => unwrapForms<ViewBindingDto>(r.data)),

updateViewBinding: (
  id: string,
  body: UpdateViewBindingBody,
): Promise<ViewBindingDto> =>
  httpClient
    .put<{ success: boolean; data: ViewBindingDto } | ViewBindingDto>(
      `/lakehouse/view-bindings/${id}`,
      body,
    )
    .then((r) => unwrapForms<ViewBindingDto>(r.data)),

deleteViewBinding: (id: string): Promise<void> =>
  httpClient
    .delete(`/lakehouse/view-bindings/${id}`)
    .then(() => undefined),

syncViewBinding: (id: string): Promise<SyncResult> =>
  httpClient
    .post<{ success: boolean; data: SyncResult } | SyncResult>(
      `/lakehouse/view-bindings/${id}/sync`,
    )
    .then((r) => unwrapForms<SyncResult>(r.data)),

syncAllViewBindings: (): Promise<SyncResult[]> =>
  httpClient
    .post<{ success: boolean; data: SyncResult[] } | SyncResult[]>(
      "/lakehouse/view-bindings/sync-all",
    )
    .then((r) => unwrapForms<SyncResult[]>(r.data)),

getViewBindingsSyncStatus: (): Promise<SyncState[]> =>
  httpClient
    .get<{ success: boolean; data: SyncState[] } | SyncState[]>(
      "/lakehouse/view-bindings/sync-status",
    )
    .then((r) => unwrapForms<SyncState[]>(r.data)),
```

`unwrapForms<T>()` đã tồn tại trong file — dùng nguyên (xem implementation hiện tại).

---

## 5. State management — quản lý state thế nào

### 5.1 Quyết định: không dùng Zustand, dùng local React state qua hook

Lý do:
- Trang này độc lập, không cần share state ra ngoài (không có component nào ở trang khác cần đọc danh sách bindings)
- Số state ít: list + loading + error + form state
- Đi theo pattern của `useProviderManager.ts` đã có (`src/app/admin/provider/_hooks/`)

### 5.2 Hook `useViewBindings.ts` — signature đề xuất

```ts
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  adminApi,
  type ViewBindingDto,
  type CreateViewBindingBody,
  type UpdateViewBindingBody,
  type SyncResult,
  type SyncState,
} from "@/infrastructure/http/adminApi";

interface UseViewBindingsResult {
  // ── Data ────────────────────────────────────────────────
  bindings: ViewBindingDto[];
  syncStates: SyncState[];            // join by viewName để hiển thị "last synced" trên từng row
  loading: boolean;
  saving: boolean;                    // true khi đang create/update/delete
  syncing: Set<string>;               // set của bindingId đang sync — cho phép nhiều binding sync song song
  syncingAll: boolean;
  error: string | null;

  // ── Actions ─────────────────────────────────────────────
  reload: () => Promise<void>;        // reload cả bindings + sync states
  create: (body: CreateViewBindingBody) => Promise<void>;
  update: (id: string, body: UpdateViewBindingBody) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleActive: (binding: ViewBindingDto) => Promise<void>;   // shortcut: gửi PUT với isActive flipped
  syncOne: (id: string) => Promise<SyncResult>;
  syncAll: () => Promise<SyncResult[]>;
}

export function useViewBindings(): UseViewBindingsResult {
  // ... implementation
}
```

### 5.3 Quy tắc fetch + reload

| Khi nào fetch | Endpoint nào |
|---|---|
| Page mount lần đầu | `listViewBindings(false)` + `getViewBindingsSyncStatus()` (parallel) |
| Sau khi create thành công | `listViewBindings()` (NOT sync status) |
| Sau khi update thành công | `listViewBindings()` |
| Sau khi delete thành công | `listViewBindings()` |
| Sau khi sync thành công | `getViewBindingsSyncStatus()` (NOT list — list không đổi) |
| User nhấn nút "Làm mới" | Cả 2 song song |

> **Anti-pattern cần tránh:** sau mỗi action không reload TOÀN BỘ. Reload có chọn lọc tiết kiệm round-trip.

### 5.4 Optimistic update — KHÔNG làm

Không update local state trước khi BE confirm. Lý do: PUT có thể trả 409 (conflict view name), nếu optimistic FE phải rollback — phức tạp. Always wait + reload.

Exception: `toggleActive` có thể optimistic vì rất khó conflict (toggle bool). Nhưng để đơn giản, vẫn fetch lại sau toggle. Đo lường sau, optimize sau nếu chậm.

### 5.5 Quản lý `syncing` set

Tại sao dùng `Set<string>` thay vì `boolean`?

Admin có thể click "Sync now" lần lượt trên 2 row khác nhau (button không bị disable global). Mỗi sync chạy độc lập trên BE, FE cần track "binding A đang sync" + "binding B đang sync" song song để show spinner đúng row.

```ts
const [syncing, setSyncing] = useState<Set<string>>(new Set());

async function syncOne(id: string) {
  setSyncing((s) => new Set(s).add(id));
  try {
    return await adminApi.syncViewBinding(id);
  } finally {
    setSyncing((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }
}
```

Trong UI: `syncing.has(binding.id)` → show loading spinner trên nút Sync của row đó.

---

## 6. UI/UX spec — từng vùng trên trang

### 6.1 Layout tổng thể

```
┌───────────────────────────────────────────────────────────────────┐
│ Sidebar (đã có) │                                                 │
│                 │  ┌─── Page header ─────────────────────────┐   │
│                 │  │ Tiêu đề + mô tả + nút "Sync all" + ...   │   │
│                 │  └──────────────────────────────────────────┘   │
│                 │                                                 │
│                 │  ┌─── Bảng bindings ──────────────────────────┐ │
│                 │  │ ViewName | Source | Type | Status | Sync   │ │
│                 │  │ ────────────────────────────────────────── │ │
│                 │  │ ...                                        │ │
│                 │  └────────────────────────────────────────────┘ │
│                 │                                                 │
│                 │  ┌─── Sync status panel (collapse) ──────────┐  │
│                 │  │ ► Lịch sử đồng bộ                          │  │
│                 │  └────────────────────────────────────────────┘  │
└─────────────────┴─────────────────────────────────────────────────┘
```

### 6.2 Page header

| Element | Spec |
|---|---|
| Tiêu đề | `<h1>Nguồn Lakehouse</h1>` — text 20px bold (giống `OperationsPage` line 242) |
| Mô tả | `<p>Đăng ký PostgreSQL view → SourceProfile cho pipeline DataMatching.</p>` + counter ("N bindings, M đang active") |
| Button bên phải | 2 nút: `"Sync all active"` (icon RefreshCw, primary tertiary) và `"+ Thêm binding"` (icon Plus, primary) |

Áp dụng style từ `OperationsPage` (line 237-260) — wrapper `div.p-6` + `div.flex.items-center.justify-between.mb-6`.

### 6.3 Bảng bindings

Dùng `<Table>` của Ant Design với spec:

| Column | Header | Render | Width |
|---|---|---|---|
| 1 | View | `<code>{record.viewName}</code>` (monospace, gray-700) + bên dưới muted-text "ID: {short id}" | 280px |
| 2 | Source / RecordType | `<Tag>{sourceSystem}</Tag>` + `<Tag color="purple">{recordType}</Tag>` (2 dòng) | 220px |
| 3 | Cấu hình | Render compact: `BK: {businessKeyColumn}` / `UpdatedAt: {updatedAtColumn}` / `{pollIntervalSeconds}s` (3 dòng nhỏ) | 200px |
| 4 | Trạng thái | `<Switch checked={isActive} loading={...} onChange={() => toggleActive(record)} />` + bên cạnh label "Active"/"Inactive" | 110px |
| 5 | Đồng bộ gần nhất | Render từ `syncStates.find(s => s.viewName === record.viewName)`: <br>• `"2026-06-07 10:30:00"` + dòng dưới `"N rows"` <br>• Nếu không có → `"—"` italic | 180px |
| 6 | Thao tác | 3 nút: `[Sync]` (icon `Play`), `[Sửa]` (icon `Pencil`), `[Xoá]` (icon `Trash2`, color red, có confirm) | 180px |

Pagination: 20 row/page, default. Nếu list ≤ 20 thì ẩn pagination (`pagination={ list.length > 20 ? { pageSize: 20 } : false }`).

Empty state: render `<EmptyState />` thay vì table khi `bindings.length === 0`.

### 6.4 Empty state

Cell trống giữa với icon + text + CTA:

```
┌────────────────────────────────────────────┐
│                                            │
│           🗄️ (Database icon)              │
│                                            │
│      Chưa có view binding nào              │
│   Tạo binding đầu tiên để đăng ký nguồn   │
│         lakehouse cho DataMatching         │
│                                            │
│        [+ Thêm binding đầu tiên]           │
│                                            │
└────────────────────────────────────────────┘
```

Tham khảo style `OperationsPage` line 263-274.

### 6.5 Sync status panel — bên dưới table

`<Collapse>` Ant Design, default closed. Khi mở → bảng 4 cột: View name, Last synced at, Last row count, Last job ID.

Lý do tách riêng: 99% admin chỉ cần xem "Sync gần nhất" qua column ở table chính. Khi cần audit chi tiết / debug 1 batch, mới mở panel này.

### 6.6 Modal create + edit

Dùng `<Modal>` Ant Design. Cùng 1 component xài cho cả create và edit, phân biệt bằng prop `mode: "create" | "edit"` + `initialValues?`.

| Element | Create | Edit |
|---|---|---|
| Title | "Tạo View Binding mới" | "Sửa View Binding" |
| Submit label | "Tạo" | "Lưu thay đổi" |
| Field `isActive` switch | Ẩn (BE default true) | Hiện |
| API call | `createViewBinding(body)` | `updateViewBinding(id, body)` |

Layout form: `<Form layout="vertical">` (Ant Design), 1 column. Fields theo thứ tự ở §7.

### 6.7 Phong cách màu sắc

Theo `ConfigProvider` của `admin/layout.tsx` (line 593-687) — primary violet `#7c3aed`. Tag colors:
- `sourceSystem`: tag mặc định (gray)
- `recordType`: tag color `purple` hoặc `geekblue`
- `isActive=true`: badge xanh lá `<Tag color="success">Active</Tag>`
- `isActive=false`: badge xám `<Tag>Inactive</Tag>`

---

## 7. Form spec — từng field, từng validation

| Field | Label | Component | Required | Validation BE | Validation FE thêm | Hint/Placeholder |
|---|---|---|---|---|---|---|
| `viewName` | Tên view (schema-qualified) | `<Input>` font-mono | ✓ | NotEmpty, max 200 chars | Regex `/^[a-zA-Z_][\w.]*$/` (chỉ chữ/số/`_`/`.`), bỏ trim hai đầu trước khi submit | `warehouse.v_lab_results_v1` |
| `sourceSystem` | Source system (khoá thứ 1 cho SourceProfile) | `<Input>` font-mono | ✓ | NotEmpty, max 200 chars | Lowercase recommended (warn nếu uppercase), khuyến nghị prefix `lakehouse:` (info text bên dưới) | `lakehouse:v_lab_results_v1` |
| `recordType` | Record type (khoá thứ 2) | `<Input>` font-mono | ✓ | NotEmpty, max 100 chars | Kebab-case (regex `/^[a-z][a-z0-9-]*$/`), warn nếu sai pattern | `lab-result` |
| `businessKeyColumn` | Cột business key | `<Input>` font-mono | ✓ | NotEmpty, max 100 chars | Snake_case recommended | `business_key` |
| `updatedAtColumn` | Cột updated-at | `<Input>` font-mono | ✓ | NotEmpty, max 100 chars | Snake_case recommended | `updated_at` |
| `pollIntervalSeconds` | Khoảng cách giữa 2 lần poll (giây) | `<InputNumber>` | ✓ | >= 30 | Step 30, default 300, min 30, max 86400 (1 ngày), số nguyên | Hint: "Khuyến nghị 300s (5 phút). Tối thiểu 30s." |
| `isActive` | Active | `<Switch>` | ✓ (chỉ ở edit) | Bool | — | Tooltip "Tắt để tạm dừng sync mà không xoá binding" |

### 7.1 Form-level validation

Trước khi submit, FE check:

1. Tất cả required field non-empty (Ant Design `Form` tự xử lý qua `rules`)
2. `pollIntervalSeconds >= 30`
3. Khi `mode === "edit"`: nếu **tất cả** field giống `initialValues` → disable nút Submit (tránh PUT vô nghĩa)

### 7.2 Hiển thị lỗi BE sau submit

Khi BE trả 409 hoặc 400:

```ts
try {
  await onSubmit(values);
  onClose();
  message.success("Đã lưu");
} catch (err) {
  // err thường là AxiosError, response.data có shape { success: false, error: { code, message } }
  const apiError = (err as any)?.response?.data?.error;
  if (apiError?.code === "Conflict" && apiError.message?.includes("ViewBinding cho view")) {
    // Inline error trên field viewName
    form.setFields([{ name: "viewName", errors: [apiError.message] }]);
  } else {
    // Toast generic
    message.error(apiError?.message || "Lưu thất bại");
  }
}
```

> Pattern này lặp ở mọi form admin trong codebase — tham khảo `useProviderManager` hoặc bất kỳ component nào dùng `Form.useForm()`.

---

## 8. Hành vi button — chi tiết từng action

### 8.1 `[+ Thêm binding]` — page header

| Property | Spec |
|---|---|
| Type | Primary (violet) |
| Icon | `<Plus size={14} />` (lucide-react) |
| onClick | `setFormState({ mode: "create", initialValues: null, open: true })` |
| Loading | Không bao giờ (chỉ mở modal) |

### 8.2 `[Sync all active]` — page header

| Property | Spec |
|---|---|
| Type | Secondary (default border) |
| Icon | `<RefreshCw size={14} />` |
| onClick | Show confirm dialog: "Sync tất cả {N} binding active? Có thể mất vài phút." → confirm → `await syncAll()` → toast tổng kết "Đã sync N bindings: K thành công, F lỗi" |
| Loading | `syncingAll === true` → spin icon |
| Disabled | Khi `bindings.filter(b => b.isActive).length === 0` |

### 8.3 `[Sync now]` per-row

| Property | Spec |
|---|---|
| Type | Primary tertiary (link style) |
| Icon | `<Play size={12} />` |
| onClick | `await syncOne(binding.id)` → toast "Sync {viewName} xong: {rowCount} rows" (success) hoặc "Sync thất bại: {error}" (error) |
| Loading | `syncing.has(binding.id)` → spin icon trong button đó |
| Disabled | `!binding.isActive` → khi disabled show tooltip "Binding đang inactive — bật trước khi sync" |

### 8.4 `[Sửa]` per-row

| Property | Spec |
|---|---|
| Type | Default |
| Icon | `<Pencil size={12} />` |
| onClick | `setFormState({ mode: "edit", initialValues: binding, open: true })` |

### 8.5 `[Xoá]` per-row

| Property | Spec |
|---|---|
| Type | Default (text red) |
| Icon | `<Trash2 size={12} />` |
| onClick | Show `<Popconfirm>` Ant Design: "Xoá binding cho view '{viewName}'? Hành động này không thể hoàn tác." → confirm → `await remove(binding.id)` → toast "Đã xoá" |
| Disabled khi đang `syncing.has(id)` | Có (tránh race) |

### 8.6 `<Switch>` toggle Active per-row

| Property | Spec |
|---|---|
| onChange | `await toggleActive(binding)` — gửi PUT với `isActive` đảo ngược, các field khác giữ nguyên |
| Loading | Có internal state riêng `togglingId === binding.id` để show loading trên switch đó |
| Confirm | Khi disable (đang Active → Inactive): show `<Popconfirm>` "Tạm dừng sync binding này? Worker sẽ bỏ qua cho đến khi bật lại." |

### 8.7 `[Làm mới]` — trên header table (góc phải, nhỏ)

Optional — tốt cho admin debugging. Icon-only button:

```tsx
<Button
  type="text"
  icon={<RefreshCw size={14} />}
  onClick={reload}
  loading={loading}
  title="Tải lại danh sách"
/>
```

---

## 9. Error & edge cases

### 9.1 Bảng error code BE → UX

| Code BE | HTTP | Trigger | FE xử lý |
|---|---|---|---|
| `Validation` | 400 | FluentValidation fail (vd `pollIntervalSeconds < 30`) | Toast đỏ với `error.message`, nếu là field-level (parse được tên field từ message) thì map vào `form.setFields` |
| `Conflict` | 409 | `viewName` đã tồn tại khi create / update sang tên trùng | Field-level error trên `viewName` (xem §7.2) |
| `NotFound` | 404 | Update/Delete/Sync 1 binding không tồn tại | Toast đỏ "Binding không tồn tại — có thể đã bị xoá. Tải lại trang." + auto trigger `reload()` |
| `ViewBinding.Inactive` | 400 | Trigger sync 1 binding đang `IsActive=false` | Toast vàng "Binding đang inactive — bật trước khi sync" + không cần reload |
| `ViewBinding.NotFound` | 404 | Trigger sync 1 binding không tồn tại | Như `NotFound` |
| Network error / timeout | — | Server down, mất mạng | Toast đỏ "Không kết nối được server. Thử lại sau." — Axios timeout default đã đủ |
| 401/403 | 401/403 | Token hết hạn | `httpClient` interceptor sẽ tự refresh hoặc redirect login (đã có sẵn, không cần xử lý ở trang này) |
| 500 | 500 | Lỗi server | Toast đỏ "Lỗi server. Liên hệ admin." |

### 9.2 Sync result có `error != null`

Khi `syncAll()` trả về:
```json
[
  { bindingId: "a", viewName: "v1", rowCount: 100, error: null },
  { bindingId: "b", viewName: "v2", rowCount: 0, error: "Cột business_key không tồn tại trong VIEW 'warehouse.v2'" },
  { bindingId: "c", viewName: "v3", rowCount: 50, error: null }
]
```

FE hiển thị:
```
Đã sync 3 bindings: 2 thành công, 1 lỗi
  ✓ v1 — 100 rows
  ✓ v3 — 50 rows
  ✗ v2 — Cột business_key không tồn tại
```

Dùng `notification.warning({ message, description })` Ant Design (vì có nội dung dài hơn 1 dòng). Mỗi binding fail là 1 line trong description.

### 9.3 Optimistic conflict edge case

Cảnh báo: 2 admin cùng mở trang, A tạo binding view `v1`, B cũng tạo `v1` đồng thời → A 201, B 409.

Xử lý FE: Khi B gặp 409, toast đỏ + reload list → B thấy `v1` đã có của A.

### 9.4 Bảng rỗng sau filter

Không filter ở phía FE — luôn show toàn bộ list. Nếu trong tương lai cần search/filter (vd theo `sourceSystem`), thêm `<Input.Search>` ở header table.

---

## 10. Thêm route vào sidebar

Sidebar config nằm ở `src/app/admin/layout.tsx` line 294-302:

```tsx
const MENU_ITEMS = [
  { href: "/admin/modules", label: "Quản lý Module", Icon: IconBoxes },
  { href: "/admin", label: "Thiết kế Báo cáo", Icon: IconPencil },
  { href: "/admin/menus", label: "Quản lý Menu BC", Icon: IconMenu },
  { href: "/admin/provider", label: "Quản trị Provider", Icon: IconSettings },
  { href: "/admin/operations", label: "Quản lý Operations", Icon: IconList },
  { href: "/admin/console", label: "Test Console", Icon: IconTerminal },
  { href: "/admin/sync", label: "Theo dõi đồng bộ", Icon: IconWifi },
];
```

Thêm 1 item:

```tsx
{ href: "/admin/lakehouse-views", label: "Nguồn Lakehouse", Icon: IconDatabase },
```

Cần tạo `IconDatabase` icon ở đầu file `layout.tsx` (cùng pattern các icon khác trong file đó, line 12-290) — SVG inline:

```tsx
function IconDatabase() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  );
}
```

Vị trí trong list: chèn sau `"Quản lý Operations"` và trước `"Test Console"` (giữa hai item có thứ tự nghiệp vụ liền nhau).

---

## 11. Implementation order — làm theo thứ tự nào

Khuyến nghị làm theo thứ tự sau để mỗi bước đều test được:

### Bước 1 — API layer (30 phút)

1. Mở `src/infrastructure/http/adminApi.ts`
2. Thêm 5 type (`ViewBindingDto`, `CreateViewBindingBody`, `UpdateViewBindingBody`, `SyncResult`, `SyncState`) vào section types (gần các interface khác, ~line 250)
3. Thêm 7 method `listViewBindings`, `createViewBinding`, `updateViewBinding`, `deleteViewBinding`, `syncViewBinding`, `syncAllViewBindings`, `getViewBindingsSyncStatus` vào object `adminApi` (cuối file)
4. **Test:** mở DevTools Console, chạy `await window.__test = await import('/...adminApi').then(m => m.adminApi.listViewBindings(false))` → kiểm tra response. Hoặc đơn giản hơn: tạm thời gọi từ component có sẵn.

### Bước 2 — Hook (30 phút)

1. Tạo `src/app/admin/lakehouse-views/_hooks/useViewBindings.ts`
2. Implement đầy đủ shape ở §5.2
3. Test: tạm gọi trong page placeholder, log state

### Bước 3 — Skeleton page (30 phút)

1. Tạo `src/app/admin/lakehouse-views/page.tsx` với `"use client"` directive (đầu file)
2. Render placeholder: header + empty state + button "Thêm" (chưa gắn modal)
3. Wire hook: `const vm = useViewBindings();` → render `vm.loading`, `vm.bindings.length`, `vm.error`
4. Thêm route sidebar (xem §10)
5. **Test:** browse `/admin/lakehouse-views` — trang load, empty state hiển thị

### Bước 4 — Bảng (45 phút)

1. Tạo `_components/ViewBindingsTable.tsx`
2. Render `<Table>` với 6 column như §6.3
3. Bỏ Switch + actions trước — render data đọc-only trước để verify shape
4. Lấy data từ prop, không từ hook (component "dumb")
5. **Test:** tạo binding qua Postman, refresh trang → row xuất hiện

### Bước 5 — Modal form (60 phút)

1. Tạo `_components/ViewBindingFormModal.tsx`
2. Implement với 7 field như §7
3. Wire create flow (mode="create")
4. **Test:** click "Thêm binding" → modal mở → điền → submit → row xuất hiện trong table

### Bước 6 — Wire edit (15 phút)

1. Thêm nút Edit per-row trong `ViewBindingsTable`
2. Onclick set `formState` để mở modal mode="edit"
3. Pass `initialValues` từ row → modal pre-fill
4. Wire update flow
5. **Test:** sửa 1 field → row update

### Bước 7 — Delete (15 phút)

1. Thêm nút Trash per-row với Popconfirm
2. Wire `remove(id)` từ hook
3. **Test:** xoá → row biến mất

### Bước 8 — Toggle Active (15 phút)

1. Thay text "Active/Inactive" bằng Switch trong column 4
2. Wire `toggleActive(binding)` từ hook
3. **Test:** toggle → switch nhấp nháy loading → trạng thái đảo

### Bước 9 — Sync now per-row (30 phút)

1. Thêm nút Sync per-row
2. Show spinner khi `syncing.has(binding.id)`
3. Toast kết quả
4. **Test:** chuẩn bị warehouse có 5 row → click Sync → toast "5 rows" → verify ở RabbitMQ UI / `/dm/records`

### Bước 10 — Sync all + status panel (30 phút)

1. Thêm nút "Sync all" header
2. Tạo `_components/SyncStatusPanel.tsx` với Collapse
3. Render bảng sync state
4. **Test:** sync all → notification multi-line

### Bước 11 — Polish (30 phút)

- Empty state component
- Error boundaries / toast wrappers
- Loading skeletons
- Refresh button header table
- Dark mode kiểm tra

### Bước 12 — Documentation (15 phút)

- Cập nhật `docs/module-renderer.md` hoặc tạo `docs/lakehouse-admin.md` ngắn về luồng admin
- Screenshot trang để lưu vào README

**Tổng:** ~6 giờ — 1 ngày dev liền.

---

## 12. Testing checklist

### 12.1 Functional

```
[ ] Trang load lần đầu — list rỗng, hiển thị empty state
[ ] Click "+ Thêm binding" → modal mở
[ ] Submit form với field rỗng → mỗi field hiện inline error
[ ] Submit với pollIntervalSeconds = 10 → inline error "Tối thiểu 30s"
[ ] Submit thành công → modal đóng, row xuất hiện, toast success
[ ] Submit lần 2 với cùng viewName → field-level error "Đã tồn tại"
[ ] Click Edit → modal mở với initial values đúng
[ ] Sửa field, submit → row update, toast success
[ ] Toggle Switch active → confirm dialog (khi disable) → toggle xong
[ ] Click Sync now → spinner trong button → toast success với rowCount
[ ] Sync 1 binding đang inactive → toast warning "Inactive"
[ ] Click Sync all → notification multi-line với từng binding
[ ] Click Delete → Popconfirm → confirm → row biến mất
[ ] Mở Collapse "Sync status" → bảng status hiển thị
[ ] Click Refresh header → list + status reload
[ ] Tab tùy ý của browser bị mất mạng → toast network error
```

### 12.2 Visual / a11y

```
[ ] Dark mode đẹp (border, table header, switch color)
[ ] Mobile/tablet — table có horizontal scroll nếu cần
[ ] Tab thứ tự hợp lý qua form (Tab key)
[ ] Modal đóng bằng phím Esc
[ ] Tooltip trên các icon button
[ ] Empty state có icon + CTA visible
[ ] Toast/notification không block UI
```

### 12.3 Integration (cần BE chạy + warehouse mock)

```
[ ] docker compose up -d (chạy backend + RabbitMQ + DataMatching + Lakehouse)
[ ] Tạo 1 view trong warehouse với 3 row dummy (xem sql trong docs/43 §3.2)
[ ] FE: tạo SourceProfile qua Postman (POST /dm/sources)
[ ] FE: vào /admin/lakehouse-views, tạo ViewBinding tương ứng
[ ] Sync now → check log LakehouseService thấy "Warehouse sync ..."
[ ] Check RabbitMQ Management UI: có 3 message trong queue
   data-matching-service:raw-record-ingest-requested-integration-event
[ ] Đợi ~5s, GET /dm/records?sourceSystem=... thấy 3 record
[ ] GET /dm/records/{id} thấy canonicalPayload đã rename field
```

---

## 13. Phụ lục — mock data + ví dụ payload

### 13.1 Mock 3 binding để dev khi BE chưa sẵn

```ts
// Tạm thời thay listViewBindings bằng:
const MOCK: ViewBindingDto[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    viewName: "warehouse.v_lab_results_v1",
    sourceSystem: "lakehouse:v_lab_results_v1",
    recordType: "lab-result",
    businessKeyColumn: "business_key",
    updatedAtColumn: "updated_at",
    pollIntervalSeconds: 300,
    isActive: true,
    createdAtUtc: "2026-06-05T08:30:00Z",
    updatedAtUtc: null,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    viewName: "warehouse.v_patient_metrics_v1",
    sourceSystem: "lakehouse:v_patient_metrics_v1",
    recordType: "patient-metric",
    businessKeyColumn: "patient_id",
    updatedAtColumn: "updated_at",
    pollIntervalSeconds: 600,
    isActive: false,
    createdAtUtc: "2026-06-04T12:00:00Z",
    updatedAtUtc: "2026-06-06T15:20:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    viewName: "warehouse.v_finance_daily_v2",
    sourceSystem: "lakehouse:v_finance_daily_v2",
    recordType: "finance-daily",
    businessKeyColumn: "key",
    updatedAtColumn: "calculated_at",
    pollIntervalSeconds: 300,
    isActive: true,
    createdAtUtc: "2026-06-01T09:15:00Z",
    updatedAtUtc: null,
  },
];
```

### 13.2 Ví dụ payload create

```http
POST /lakehouse/view-bindings
{
  "viewName":            "warehouse.v_lab_results_v1",
  "sourceSystem":        "lakehouse:v_lab_results_v1",
  "recordType":          "lab-result",
  "businessKeyColumn":   "business_key",
  "updatedAtColumn":     "updated_at",
  "pollIntervalSeconds": 300
}
```

### 13.3 Ví dụ payload update

```http
PUT /lakehouse/view-bindings/11111111-1111-1111-1111-111111111111
{
  "viewName":            "warehouse.v_lab_results_v1",
  "sourceSystem":        "lakehouse:v_lab_results_v1",
  "recordType":          "lab-result",
  "businessKeyColumn":   "business_key",
  "updatedAtColumn":     "updated_at",
  "pollIntervalSeconds": 600,
  "isActive":            false
}
```

### 13.4 Ví dụ response sync

```json
{
  "success": true,
  "data": {
    "bindingId": "11111111-1111-1111-1111-111111111111",
    "viewName":  "warehouse.v_lab_results_v1",
    "rowCount":  1000,
    "jobId":     "sync-lab-result-20260607103045",
    "duration":  "00:00:02.345",
    "error":     null
  }
}
```

### 13.5 Ví dụ error response

```json
// 409 — Tạo trùng
{
  "success": false,
  "error": {
    "code":    "Conflict",
    "message": "ViewBinding cho view 'warehouse.v_lab_results_v1' đã tồn tại."
  }
}

// 400 — Validation
{
  "success": false,
  "error": {
    "code":    "Validation",
    "message": "'Poll Interval Seconds' must be greater than or equal to '30'."
  }
}

// 400 — Inactive
{
  "success": false,
  "error": {
    "code":    "ViewBinding.Inactive",
    "message": "ViewBinding 'warehouse.v_lab_results_v1' đang Inactive."
  }
}
```

---

## Liên quan

- `Hdos/docs/44-unified-ingest-pipeline.md` — kiến trúc tổng thể Phase 2 (mục 4 ViewBinding, mục 6 end-to-end flow)
- `Hdos/docs/36-datamatch-to-dynform-flow.md` — flow auto-generate DynForm screen (sau khi binding sync xong)
- `Hdos/docs/43-warehouse-sync-to-lakehouse.md` — chi tiết BE WarehouseViewSyncer code mẫu
- `src/app/admin/operations/page.tsx` — page CRUD admin pattern tham khảo style
- `src/app/admin/provider/_hooks/useProviderManager.ts` — hook pattern tham khảo
- `src/infrastructure/http/adminApi.ts` — API client hiện tại

---

## Note kết

Sau khi triển khai xong trang này, admin có **1 trang duy nhất** để quản lý mọi nguồn lakehouse. Mỗi lần data engineer cấp view mới, admin chỉ cần:

1. Đăng ký SourceProfile (Postman, ~30s)
2. Tạo ViewBinding qua trang này (~1 phút)
3. Click Sync now → verify

→ Mọi DynForm screen tham chiếu `/dm/records/{id}` đều tự động nhận data mới. **Không deploy code BE hay FE.**

Đó là toàn bộ điểm của Unified Ingest Pipeline.
