# FOXAI-HDOSv2

**Hospital Digital Operating System** — Frontend base dùng Next.js, Ant Design, Zustand và Recharts.

---

## Mục lục

- [Stack](#stack)
- [Khởi chạy](#khởi-chạy)
- [Kiến trúc](#kiến-trúc)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [API](#api)
- [Screen Config — định nghĩa màn hình](#screen-config--định-nghĩa-màn-hình)
- [Widget Registry](#widget-registry)
  - [KpiCard](#kpicard)
  - [DataTable](#datatable)
  - [AlertBanner](#alertbanner)
  - [ChartBar](#chartbar)
  - [ChartLine](#chartline)
  - [ChartArea](#chartarea)
  - [ChartPie](#chartpie)
- [Thêm widget mới](#thêm-widget-mới)
- [Luồng hoạt động](#luồng-hoạt-động)

---

## Stack

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Next.js | 16 | Framework (App Router) |
| Ant Design | 6 | UI component library |
| Zustand | 5 | Global state (menu) |
| Recharts | 2 | Biểu đồ |
| Tailwind CSS | 4 | Utility styling |
| TypeScript | 5 | Type safety |

---

## Khởi chạy

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) — tự redirect sang `/hdos?module=dashboard`.

---

## Kiến trúc

Hệ thống theo mô hình **Server-Driven UI**:

- **Backend kiểm soát 100%** nội dung từng màn hình — layout, widget, dữ liệu.
- **Frontend là dumb renderer** — chỉ có kho widget (registry) và bộ render.
- Frontend **không cần sửa code** khi backend thêm màn hình mới.

```
┌─────────────────────────────────────────────────────┐
│  User click menu item                               │
│        ↓                                            │
│  GET /api/screen/:id                                │
│        ↓                                            │
│  Backend trả ScreenConfig                           │
│  { rows: [{ components: [{ type, props }] }] }      │
│        ↓                                            │
│  ScreenRenderer đọc config                          │
│        ↓                                            │
│  REGISTRY[type] → render Component với props        │
└─────────────────────────────────────────────────────┘
```

---

## Cấu trúc thư mục

```
src/
├── app/
│   ├── api/
│   │   ├── manifest/route.ts     # GET /api/manifest — FE khai báo capabilities
│   │   ├── menu/route.ts         # GET /api/menu — danh sách navigation
│   │   └── screen/[id]/route.ts  # GET /api/screen/:id — config màn hình
│   ├── hdos/
│   │   ├── layout.tsx            # Fetch menu, render Sidebar + main
│   │   └── page.tsx              # Fetch screen config → ScreenRenderer
│   ├── layout.tsx                # Root layout (AntdRegistry)
│   └── page.tsx                  # Redirect → /hdos?module=dashboard
│
├── components/
│   ├── registry/
│   │   └── index.ts              # REGISTRY + MANIFEST
│   ├── widgets/
│   │   ├── KpiCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── ChartBar.tsx
│   │   ├── ChartLine.tsx
│   │   ├── ChartArea.tsx
│   │   └── ChartPie.tsx
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── MenuIcon.tsx
│   │   └── MenuBadgeChip.tsx
│   └── ScreenRenderer.tsx        # Đọc ScreenConfig → render grid widget
│
├── store/
│   └── menuStore.ts              # Zustand store cho menu
│
├── types/
│   ├── menu.ts                   # MenuGroup, MenuItem, MenuBadge
│   ├── screen.ts                 # ScreenConfig, RowConfig, ComponentConfig
│   └── chart.ts                  # BaseChartProps, ChartDataPoint
│
└── shared/
    └── utils/
        └── cn.ts                 # clsx + tailwind-merge
```

---

## API

### `GET /api/menu`

Trả danh sách nhóm và item điều hướng. Không chứa screen config.

```json
{
  "groups": [
    {
      "id": "overview",
      "label": "TỔNG QUAN",
      "items": [
        {
          "id": "dashboard",
          "label": "Dashboard",
          "icon": "dashboard",
          "badge": { "type": "count", "value": 3 }
        }
      ]
    }
  ]
}
```

**Badge types:** `count` | `live` | `new` | `tag`

---

### `GET /api/screen/:id`

Trả cấu hình màn hình cho module `:id`. Backend quyết định phần nào hiển thị, dữ liệu gì.

```json
{
  "title": "Dashboard",
  "rows": [
    {
      "gutter": 16,
      "components": [
        {
          "type": "KpiCard",
          "span": 6,
          "props": { "title": "Bệnh nhân hôm nay", "value": 142, "accent": "#1677ff" }
        },
        {
          "type": "ChartBar",
          "span": 18,
          "props": { "title": "Theo tháng", "data": [...] }
        }
      ]
    }
  ]
}
```

Trả `404` nếu `id` chưa được cấu hình.

---

### `GET /api/manifest`

Backend gọi endpoint này để biết FE hỗ trợ component nào và prop schema. Dùng để build screen config đúng.

```json
{
  "version": "1.0",
  "components": {
    "KpiCard": { "props": { "title": { "type": "string", "required": true }, ... } },
    "ChartBar": { "props": { "data": { "type": "ChartDataPoint[]", "required": true }, ... } }
  }
}
```

---

## Screen Config — định nghĩa màn hình

```ts
interface ScreenConfig {
  title?: string;
  rows: RowConfig[];
}

interface RowConfig {
  gutter?: number;       // khoảng cách giữa các component (mặc định 16)
  components: ComponentConfig[];
}

interface ComponentConfig {
  type: string;          // key trong REGISTRY
  props?: Record<string, unknown>;
  span?: number;         // antd Col span 1–24, tự chia đều nếu không set
}
```

**Ví dụ layout:**

```
row 1: [KpiCard span=6] [KpiCard span=6] [KpiCard span=6] [KpiCard span=6]
row 2: [ChartLine span=14] [ChartPie span=10]
row 3: [DataTable span=24]
```

```json
{
  "rows": [
    { "components": [
      { "type": "KpiCard", "span": 6, "props": { "title": "A", "value": 1 } },
      { "type": "KpiCard", "span": 6, "props": { "title": "B", "value": 2 } },
      { "type": "KpiCard", "span": 6, "props": { "title": "C", "value": 3 } },
      { "type": "KpiCard", "span": 6, "props": { "title": "D", "value": 4 } }
    ]},
    { "components": [
      { "type": "ChartLine", "span": 14, "props": { ... } },
      { "type": "ChartPie",  "span": 10, "props": { ... } }
    ]},
    { "components": [
      { "type": "DataTable", "span": 24, "props": { ... } }
    ]}
  ]
}
```

---

## Widget Registry

### KpiCard

Thẻ chỉ số KPI với accent color, giá trị chính và dòng hint.

| Prop | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | `string` | ✓ | Tiêu đề thẻ |
| `value` | `string \| number` | | Giá trị hiển thị lớn |
| `hint` | `string` | | Dòng phụ bên dưới |
| `hintColor` | `string` | | CSS color cho hint |
| `accent` | `string` | | CSS color — vẽ border trái + dot |
| `loading` | `boolean` | | Hiện skeleton thay value |

```json
{
  "type": "KpiCard",
  "props": {
    "title": "Bệnh nhân hôm nay",
    "value": 142,
    "accent": "#1677ff",
    "hint": "+12 so với hôm qua",
    "hintColor": "#52c41a"
  }
}
```

---

### DataTable

Bảng dữ liệu generic với phân trang và hỗ trợ render tag màu.

| Prop | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `columns` | `ColConfig[]` | ✓ | Định nghĩa cột |
| `data` | `Record[]` | ✓ | Mảng row object |
| `pageSize` | `number` | | Số dòng/trang (mặc định 10) |

**ColConfig:**

| Field | Type | Mô tả |
|---|---|---|
| `key` | `string` | Key trong data object |
| `title` | `string` | Tiêu đề cột |
| `render` | `"tag"` | Render value dưới dạng antd Tag |
| `tagColors` | `Record<string, string>` | Map `value → color` khi `render: "tag"` |

```json
{
  "type": "DataTable",
  "span": 24,
  "props": {
    "columns": [
      { "key": "name",   "title": "Họ tên" },
      { "key": "status", "title": "Trạng thái", "render": "tag",
        "tagColors": { "Chờ": "orange", "Xong": "green", "Lỗi": "red" } }
    ],
    "data": [
      { "name": "Nguyễn Văn A", "status": "Chờ" },
      { "name": "Trần Thị B",   "status": "Xong" }
    ],
    "pageSize": 5
  }
}
```

---

### AlertBanner

Banner thông báo dạng antd Alert.

| Prop | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `message` | `string` | ✓ | Nội dung chính |
| `description` | `string` | | Mô tả phụ |
| `type` | `"success" \| "info" \| "warning" \| "error"` | | Mặc định `"info"` |
| `showIcon` | `boolean` | | Mặc định `true` |

```json
{ "type": "AlertBanner", "span": 24,
  "props": { "message": "Cảnh báo hệ thống", "type": "warning" } }
```

---

### ChartBar

Biểu đồ cột — phù hợp so sánh giá trị theo danh mục.

| Prop | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `data` | `ChartDataPoint[]` | ✓ | `[{ label, value }]` hoặc multi-series |
| `dataKey` | `string` | | Key lấy giá trị (mặc định `"value"`) |
| `series` | `{ key, color, name? }[]` | | Multi-series thay cho `dataKey` |
| `title` | `string` | | Tiêu đề |
| `height` | `number` | | Chiều cao px (mặc định 280) |
| `color` | `string` | | Màu cột single-series (mặc định `"#1677ff"`) |
| `legend` | `boolean` | | Hiện legend |
| `unit` | `string` | | Đơn vị tooltip/trục Y, vd: `" ca"`, `" tr."` |

```json
{ "type": "ChartBar", "span": 12,
  "props": {
    "title": "Bệnh nhân nhập viện theo tháng",
    "unit": " ca",
    "color": "#1677ff",
    "data": [
      { "label": "T1", "value": 120 },
      { "label": "T2", "value": 145 },
      { "label": "T3", "value": 98 }
    ]
  }
}
```

**Multi-series:**

```json
{ "type": "ChartBar", "span": 16,
  "props": {
    "title": "Doanh thu vs Chi phí",
    "legend": true,
    "unit": " tr.",
    "series": [
      { "key": "revenue", "color": "#52c41a", "name": "Doanh thu" },
      { "key": "cost",    "color": "#ff4d4f", "name": "Chi phí" }
    ],
    "data": [
      { "label": "T1", "revenue": 800, "cost": 620 },
      { "label": "T2", "revenue": 950, "cost": 700 }
    ]
  }
}
```

---

### ChartLine

Biểu đồ đường — phù hợp trend theo thời gian. Props giống `ChartBar`.

```json
{ "type": "ChartLine", "span": 14,
  "props": {
    "title": "Lượt khám 7 ngày qua",
    "unit": " ca",
    "color": "#722ed1",
    "data": [
      { "label": "T2", "value": 52 },
      { "label": "T3", "value": 67 },
      { "label": "T4", "value": 45 }
    ]
  }
}
```

---

### ChartArea

Biểu đồ vùng — giống ChartLine nhưng fill gradient bên dưới. Props giống `ChartBar`.

```json
{ "type": "ChartArea", "span": 14,
  "props": {
    "title": "Doanh thu theo ngày",
    "unit": " tr.",
    "color": "#52c41a",
    "data": [
      { "label": "01/05", "value": 42 },
      { "label": "02/05", "value": 58 }
    ]
  }
}
```

---

### ChartPie

Biểu đồ tròn hoặc donut.

| Prop | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `data` | `ChartDataPoint[]` | ✓ | `[{ label, value }]` |
| `dataKey` | `string` | | Mặc định `"value"` |
| `title` | `string` | | |
| `height` | `number` | | Mặc định 280 |
| `legend` | `boolean` | | Mặc định `true` |
| `unit` | `string` | | Đơn vị tooltip |
| `variant` | `"pie" \| "donut"` | | Mặc định `"donut"` |
| `colors` | `string[]` | | Màu từng slice theo thứ tự |

```json
{ "type": "ChartPie", "span": 10,
  "props": {
    "title": "Cơ cấu bệnh nhân",
    "variant": "donut",
    "unit": " ca",
    "colors": ["#1677ff", "#52c41a", "#faad14", "#ff4d4f"],
    "data": [
      { "label": "Nội trú",  "value": 87 },
      { "label": "Ngoại trú","value": 210 },
      { "label": "Cấp cứu",  "value": 34 }
    ]
  }
}
```

---

## Thêm widget mới

**Bước 1** — Tạo component tại `src/components/widgets/TenWidget.tsx`:

```tsx
"use client";

interface TenWidgetProps {
  title: string;
  // ... các prop khác
}

export function TenWidget({ title }: TenWidgetProps) {
  return <div>{title}</div>;
}
```

**Bước 2** — Đăng ký trong `src/components/registry/index.ts`:

```ts
import { TenWidget } from "@/components/widgets/TenWidget";

export const REGISTRY = {
  // ... existing
  TenWidget,
};

export const MANIFEST = {
  components: {
    // ... existing
    TenWidget: {
      description: "Mô tả widget",
      props: {
        title: { type: "string", required: true },
      },
    },
  },
};
```

Sau đó backend gọi `GET /api/manifest` để cập nhật danh sách capabilities và có thể dùng `TenWidget` trong bất kỳ screen config nào.

---

## Luồng hoạt động

```
1. App mount
   └── fetchMenu() → GET /api/menu
       └── Sidebar render các group + item

2. User click item (vd: "patient-exam")
   └── URL đổi: /hdos?module=patient-exam
       └── Sidebar highlight item active
       └── HdosContent phát hiện moduleId thay đổi
           └── GET /api/screen/patient-exam
               └── Backend trả ScreenConfig
                   └── ScreenRenderer render:
                       Row 1: [KpiCard × 4]
                       Row 2: [DataTable]

3. Backend thêm màn hình "Xét nghiệm"
   └── Thêm item { id: "lab", ... } vào GET /api/menu
   └── Thêm config cho GET /api/screen/lab
   └── FE: không sửa bất kỳ file nào

4. Backend muốn dùng widget mới "BedMap"
   └── Gọi GET /api/manifest → kiểm tra FE có "BedMap" chưa
   └── FE: tạo component + thêm vào registry (2 bước)
   └── Backend: dùng { "type": "BedMap", "props": {...} } trong bất kỳ screen
```
