# Module Renderer — Architecture Guide

## Overview

The Module Renderer is the **second rendering path** in HDOS. It allows the admin panel to configure screen layouts that are then rendered on the client side using `react-grid-layout` with exact pixel-accurate positioning.

```
Admin Panel (react-grid-layout drag/drop)
    ↓  saves  ModuleLayout JSON
API Route  /api/v1/modules/[slug]/layout
    ↓  fetch
HdosPage  (tries module layout first, falls back to ScreenConfig)
    ↓
ModuleRenderer  →  TabCanvas  →  WidgetRenderer  →  real widget components
```

---

## Two rendering paths

`src/app/hdos/page.tsx` fetches in this order:

1. `GET /api/v1/modules/{slug}/layout` → **ModuleRenderer** (admin-configured, grid-positioned)
2. `GET /api/screen/{slug}` → **ScreenRenderer** (legacy Ant Design rows, hardcoded)

If both fail, an error message is shown. The dual-fetch keeps legacy screens working while new modules are built in the admin panel.

---

## Data flow

### ModuleLayout (API contract)

```ts
interface ModuleLayout {
  slug:  string;
  label: string;
  tabs:  ModuleTabApi[];
}

interface ModuleTabApi {
  id:        string;
  slug:      string;
  label:     string;
  sortOrder: number;
  isDefault: boolean;
  widgets:   ApiWidget[];
}

interface ApiWidget {
  widgetKey:        string;
  title?:           string;
  subtitle?:        string;
  chartType:        string;   // matches WidgetRenderer switch
  gridX:            number;   // 0–11 (12-col grid)
  gridY:            number;
  gridW:            number;   // 1–12
  gridH:            number;   // units of rowHeight (60 px)
  operationPattern?: string;  // future: data-fetching
  providerId?:       string;  // future: which backend provider
  paramsTemplate:    string;  // JSON string — params to send
  visualConfig:      string;  // JSON string — rendering hints
  filterBindings:    string[]; // which filterKey values this widget listens to
  interactions:      string;  // JSON string — click/drill-through rules
  filterKey?:        string;  // only for filter widgets
}
```

### Grid parameters (fixed in ModuleRenderer)

| Parameter        | Value |
|-----------------|-------|
| `cols`           | 12    |
| `rowHeight`      | 60 px |
| `margin`         | 8 px  |
| `containerPadding` | 16 px |
| `isDraggable`    | false |
| `isResizable`    | false |

So a widget with `gridH: 4` is `4 × 60 + 3 × 8 = 264 px` tall (plus padding).

---

## Components

### `src/components/ModuleRenderer.tsx`

- Takes a `ModuleLayout` prop.
- Uses `ResizeObserver` to track container width and pass it to `ReactGridLayout` (legacy API).
- If one tab → renders directly. If multiple tabs → wraps in Ant Design `Tabs`.
- Each tab is rendered by `TabCanvas`, which builds the `layout` array from `widget.gridX/Y/W/H`.

### `src/components/widgets/WidgetRenderer.tsx`

- Single entry point: `<WidgetRenderer widget={ApiWidget} />`.
- `switch` on `chartType` → renders the matching widget component with **static fake data**.
- Each chartType branch passes realistic Vietnamese hospital data to the widget.
- Unknown types render a dashed placeholder with the chartType label.

### Supported chart types

| chartType | Component | Notes |
|-----------|-----------|-------|
| `kpi` | `KpiCard` | Value derived from widget title |
| `line_chart` | `ChartLine` | Multi-series for vitals |
| `bar_chart` | `ChartBar` | Monthly or weekly data |
| `area_chart` | `ChartArea` | Hourly or trend data |
| `pie_chart` | `ChartPie` | By dept / revenue source / diagnosis |
| `donut_chart` | `ChartPie` variant="donut" | Same data pools as pie |
| `gauge` | Inline | Percent bar with color thresholds |
| `heatmap` | Inline | Time-of-day activity grid |
| `progress_rows` | `ProgressList` | Ward capacity with fraction |
| `alert_list` | `AlertList` | Clinical alerts with severity |
| `simple_table` | `DataTable` | Patients or medications |
| `advanced_table` | `DataTable` | + Excel export button |
| `flow_steps` | `FlowPipeline` | Outpatient flow |
| `patient_flow_stages` | `FlowPipeline` | Inpatient stages |
| `risk_tiers` | `StatsSummary` | 4-column risk tier count |
| `bed_grid` | `WardBedGrid` | Ward occupancy visual |
| `room_status_grid` | `OrRoomGrid` | OR room status cards |
| `news2_bars` | `ChartBar` | NEWS2 component scores |
| `timeline_vertical` / `bullet_list` | `BulletList` | Schedule or drug allergy list |
| `filter_dropdown` / `filter_date_range` / `filter_search` / `filter_slider` | Inline placeholder | Visual stub |
| `text_widget` | Inline | `visualConfig.content` string |
| `chat_panel` | Inline | AI chat stub |

---

## Fake data (development)

**Route:** `src/app/api/v1/modules/[slug]/layout/route.ts`

Returns hardcoded `ModuleLayout` for these slugs:

| Slug | Label | Tabs |
|------|-------|------|
| `dashboard` | Dashboard Tổng quan | Tổng quan, Tài chính |
| `patient-flow` | Luồng bệnh nhân | Tổng quan, Theo dõi thực |
| `bed-management` | Quản lý giường bệnh | Tất cả khoa |
| `vitals-monitor` | Theo dõi sinh tồn | Theo dõi |
| `patient-exam` | Khám bệnh | Khám bệnh |
| `inpatient` | Nội trú | Nội trú |
| `surgery` | Phẫu thuật | Lịch phẫu thuật |

**Widget data** in `WidgetRenderer.tsx` — all static pools defined at module level; no real API calls are made.

---

## Connecting to the real backend

When the backend API is ready:

1. **Route handler** — replace the `LAYOUTS` map in `route.ts` with a `fetch` to the real backend:
   ```ts
   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/modules/${slug}/layout`, {
     headers: { Authorization: `Bearer ${token}` },
   });
   return NextResponse.json(await res.json(), { status: res.status });
   ```

2. **WidgetRenderer data** — replace static pools with API calls using `operationPattern` + `providerId` from `ApiWidget`. Each widget can use `useSSE` or `useSignalR` for live data.

3. **Admin save** — `mockAdminApi` in `src/app/admin/_lib/mockData.ts` → swap for real `adminApi` from `@/infrastructure/http/adminApi`. The comment at the top of `useDesignerState.ts` marks the swap point.

---

## Adding a new widget type

1. Create `src/components/widgets/MyWidget.tsx` with typed props.
2. Add a branch in `WidgetRenderer.tsx` for the new `chartType`.
3. Register in `src/components/registry/index.ts` (for the existing ScreenRenderer manifest).
4. Add the type to the admin widget catalog in `src/app/admin/_lib/mockData.ts` (`MOCK_SCHEMAS`).
5. Backend admin API will then expose it for drag-and-drop configuration.
