"use client";

import type { ApiWidget, FormSchema } from "@/infrastructure/http/adminApi";
import { evaluateExpression, evaluateRaw, applyDisplayFormat } from "@/core/dataBinding/evaluateExpression";
import type { ChartDataPoint } from "@/types/chart";
import { FormSectionWidget } from "./FormSectionWidget";
import { EmbedSduiPageWidget } from "./EmbedSduiPage";
import { AlertList } from "./AlertList";
import { BulletList } from "./BulletList";
import { ChartArea } from "./ChartArea";
import { ChartBar } from "./ChartBar";
import { ChartLine } from "./ChartLine";
import { ChartPie } from "./ChartPie";
import { ChartScatter } from "./ChartScatter";
import { DataTable } from "./DataTable";
import { FlowPipeline } from "./FlowPipeline";
import { KpiCard } from "./KpiCard";
import { OrRoomGrid } from "./OrRoomGrid";
import { ProgressList } from "./ProgressList";
import { StatsSummary } from "./StatsSummary";
import { WardBedGrid } from "./WardBedGrid";

// ─── Static fake data pools ───────────────────────────────────────────────────

const MONTHS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
const DAYS_7 = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const HOURS_8 = [
  "0:00",
  "3:00",
  "6:00",
  "9:00",
  "12:00",
  "15:00",
  "18:00",
  "21:00",
];

const TREND_DATA = DAYS_7.map((label, i) => ({
  label,
  value: 145 + i * 7 + Math.round(Math.sin(i) * 8),
}));

const MONTH_DATA = MONTHS.map((label, i) => ({
  label,
  value: Math.round(3.8 + 0.12 * i + Math.cos(i) * 0.25), // tỷ đồng → keep as number, unit shown in axis
}));

const HOUR_DATA = HOURS_8.map((label, i) => ({
  label,
  value: 35 + Math.round(Math.sin(i / 2) * 25),
}));

const VITALS_MULTI = HOURS_8.map((label, i) => ({
  label,
  value: 70 + Math.round(Math.sin(i / 2) * 10),
  nhịp_tim: 70 + Math.round(Math.sin(i / 2) * 10),
  huyết_áp: 118 + Math.round(Math.cos(i) * 6),
  spo2: 97 + Math.round(Math.sin(i) * 1),
}));

// Revenue breakdown
const PIE_REV_SRC = [
  { label: "Dịch vụ kỹ thuật cao", value: 42 },
  { label: "BHYT", value: 31 },
  { label: "Ngoại trú tự trả", value: 16 },
  { label: "Đối tác / BH tư", value: 11 },
];

// Department visit distribution
const PIE_DEPT = [
  { label: "Nội tổng quát", value: 31 },
  { label: "Ngoại tổng quát", value: 22 },
  { label: "Nhi khoa", value: 19 },
  { label: "Sản phụ khoa", value: 14 },
  { label: "Chuyên khoa khác", value: 14 },
];

// Diagnostic grouping
const PIE_DIAG = [
  { label: "Tim mạch", value: 24 },
  { label: "Hô hấp", value: 19 },
  { label: "Tiêu hóa", value: 16 },
  { label: "Thần kinh – Cơ xương", value: 13 },
  { label: "Nội tiết – Chuyển hóa", value: 10 },
  { label: "Khác", value: 18 },
];

// Bed occupancy — matches reference screenshot style
const CAPACITY_ITEMS = [
  { label: "ICU", value: 80, color: "#ff4d4f" },
  { label: "Khoa Nội tim mạch", value: 90, color: "#ff4d4f" },
  { label: "Khoa Nội tổng quát (ICU)", value: 67, color: "#faad14" },
  { label: "Khoa Tổng hợp", value: 87, color: "#ff4d4f" },
  { label: "Khoa Tim mạch can thiệp", value: 78, color: "#faad14" },
  { label: "Khoa Nội tổng quát", value: 72, color: "#faad14" },
  { label: "Khoa Ngoại tổng quát", value: 81, color: "#ff4d4f" },
  { label: "Khoa Nhi", value: 54, color: "#52c41a" },
  { label: "Khoa Thần kinh", value: 62, color: "#52c41a" },
  { label: "Khoa Sản khoa", value: 53, color: "#52c41a" },
  { label: "Khoa Hồi lưu", value: 49, color: "#52c41a" },
];

// Critical lab alerts — matches reference style (Troponin, electrolytes, etc.)
const ALERT_ITEMS = [
  {
    code: "T1.3",
    text: "Troponin I > 12.4 ng/mL",
    patient: "BN: Nguyễn Văn A",
    dept: "Khoa Nội tim mạch",
    time: "3 phút trước",
    severity: "critical" as const,
  },
  {
    code: "Kx",
    text: "Kx > 2.2 mmol/L",
    patient: "BN: Trần Thị B",
    dept: "Khoa Cấp cứu",
    time: "5 phút trước",
    severity: "warning" as const,
  },
  {
    code: "Na+",
    text: "Na+ > 118 mmol/L",
    patient: "BN: Lê Văn C",
    dept: "Khoa Nội tổng quát",
    time: "8 phút trước",
    severity: "warning" as const,
  },
  {
    code: "PTx",
    text: "PTx > 22%",
    patient: "BN: Hoàng Thị D",
    dept: "Khoa Huyết học",
    time: "16 phút trước",
    severity: "warning" as const,
  },
  {
    code: "NH3",
    text: "NH3 > 185 mmol/L",
    patient: "BN: Đinh Văn E",
    dept: "Khoa Gan mật",
    time: "34 phút trước",
    severity: "critical" as const,
  },
];

// Patient flow stages
const FLOW_OUTPATIENT = [
  { label: "Chờ tiếp nhận", value: 12, color: "#059669" },
  { label: "Đang khám", value: 23, color: "#52c41a" },
  { label: "Chờ XN / CĐHA", value: 31, color: "#faad14", warn: true },
  { label: "Chờ kết quả", value: 8, color: "#722ed1" },
  { label: "Thanh toán", value: 5, color: "#13c2c2" },
  { label: "Hoàn thành", value: 79, color: "#389e0d" },
];

const FLOW_INPATIENT = [
  { label: "Nhập viện", value: 23, color: "#059669" },
  { label: "Đang điều trị", value: 142, color: "#52c41a" },
  { label: "Theo dõi đặc biệt", value: 38, color: "#faad14", warn: true },
  { label: "Chờ xuất viện", value: 18, color: "#722ed1" },
  { label: "Xuất viện hôm nay", value: 12, color: "#389e0d" },
];

const RISK_TIERS = [
  { label: "Nguy cơ cao", value: "47", color: "#ff4d4f" },
  { label: "Nguy cơ trung bình", value: "128", color: "#faad14" },
  { label: "Ổn định", value: "289", color: "#52c41a" },
  { label: "Ngoại trú theo dõi", value: "64", color: "#059669" },
];

// Daily patient flow summary — matches reference StatsSummary block
const DAILY_FLOW_STATS = [
  { label: "Tổng lịch", value: "148", color: "#e6edf3" },
  { label: "Chờ khám", value: "46", color: "#faad14" },
  { label: "Đang nội trú", value: "79", color: "#059669" },
  { label: "Hoàn thành", value: "0", color: "#52c41a" },
];

// Ward grid
const WARDS = [
  { code: "ICU", total: 15, occupied: 12, checkout: 1, cleaning: 0, bor: 80 },
  {
    code: "NỘI TM",
    total: 30,
    occupied: 27,
    checkout: 2,
    cleaning: 0,
    bor: 90,
  },
  { code: "NGOẠI", total: 40, occupied: 32, checkout: 3, cleaning: 2, bor: 80 },
  { code: "NHI", total: 30, occupied: 16, checkout: 2, cleaning: 0, bor: 54 },
  { code: "SẢN", total: 25, occupied: 13, checkout: 1, cleaning: 1, bor: 52 },
  {
    code: "HỒI SỨC",
    total: 10,
    occupied: 8,
    checkout: 0,
    cleaning: 1,
    bor: 80,
  },
];

// OR rooms
const OR_ROOMS = [
  {
    code: "P.Mổ 1",
    procedure: "Cắt ruột thừa nội soi",
    status: "active" as const,
    hint: "120 phút",
  },
  {
    code: "P.Mổ 2",
    procedure: "Thay khớp háng P",
    status: "active" as const,
    hint: "180 phút",
  },
  { code: "P.Mổ 3", status: "preparing" as const, hint: "Ca 14:30" },
  { code: "P.Mổ 4", status: "available" as const },
  {
    code: "P.Mổ 5",
    procedure: "Nội soi cắt polyp DD",
    status: "active" as const,
    hint: "60 phút",
  },
  { code: "P.Mổ 6", status: "cleaning" as const },
];

// Schedule / notes
const BULLET_SCHEDULE = [
  { text: "Hội chẩn Tim mạch – 09:00 – P.Hội chẩn A", status: "done" as const },
  {
    text: "PT Nội soi – P.Mổ 3 – 11:30 – BS Minh Tuấn",
    status: "active" as const,
  },
  { text: "Kiểm tra ICU chiều – 14:00", status: "pending" as const },
  {
    text: "Kết quả MRI – BN Nguyễn Văn A – Cần xem",
    status: "pending" as const,
    badge: "Mới",
  },
  { text: "Xuất viện P101 – 15:00 – BS Lan Anh", status: "pending" as const },
];

const BULLET_DRUG_ALLERGY = [
  {
    text: "Dị ứng Penicillin – BN: Nguyễn V.A – P201",
    status: "critical" as const,
  },
  {
    text: "Thận trọng NSAIDs – BN: Trần T.B – P312",
    status: "active" as const,
  },
  { text: "Chống chỉ định MRI – BN: Lê V.C – P105", status: "active" as const },
  {
    text: "Theo dõi electrolytes – BN: Phạm T.D – P220",
    status: "pending" as const,
  },
];


// ─── KPI resolver ─────────────────────────────────────────────────────────────

const KPI_MAP: {
  match: (t: string) => boolean;
  value: string;
  hint?: string;
}[] = [
  { match: (t) => t.includes("lượt khám"), value: "0", hint: "+42% hôm qua" },
  {
    match: (t) => t.includes("doanh thu") && !t.includes("tháng"),
    value: "4.23 tỷ",
    hint: "+8% so kế hoạch",
  },
  {
    match: (t) => t.includes("doanh thu") && t.includes("tháng"),
    value: "₫ 42.3B",
    hint: "Mục tiêu 95%",
  },
  { match: (t) => t.includes("chi phí"), value: "₫ 38.1B", hint: "Tháng này" },
  {
    match: (t) => t.includes("lợi nhuận"),
    value: "₫ 4.2B",
    hint: "+12.5% vs tháng trước",
  },
  {
    match: (t) => t.includes("nội trú") || t.includes("bn nội"),
    value: "312",
    hint: "+14 so sáng nay",
  },
  { match: (t) => t.includes("cấp cứu"), value: "18", hint: "3 ca nặng" },
  {
    match: (t) => t.includes("bor") || t.includes("toàn viện"),
    value: "78.4%",
    hint: "+2.1%",
  },
  {
    match: (t) =>
      t.includes("cảnh báo active") ||
      (t.includes("cảnh báo") && t.includes("active")),
    value: "8",
    hint: "8 cần xử lý ngay",
  },
  {
    match: (t) => t.includes("cảnh báo") && !t.includes("active"),
    value: "8",
    hint: "Cần xử lý",
  },
  { match: (t) => t.includes("nhập viện"), value: "23", hint: "Hôm nay" },
  { match: (t) => t.includes("xuất viện"), value: "18", hint: "Hôm nay" },
  { match: (t) => t.includes("chờ phòng"), value: "7", hint: "Đang chờ" },
  {
    match: (t) => t.includes("đang mổ"),
    value: "3",
    hint: "Phòng đang hoạt động",
  },
  { match: (t) => t.includes("news2"), value: "8", hint: "Cao – cần đánh giá" },
  { match: (t) => t.includes("sofa"), value: "6", hint: "Nguy cơ vừa" },
  {
    match: (t) => t.includes("nặng"),
    value: "5",
    hint: "Cần theo dõi tích cực",
  },
];

function resolveKpiValue(w: ApiWidget): {
  value: string;
  hint?: string;
  accent?: string;
} {
  const title = (w.title ?? "").toLowerCase();
  const cfg = safeJson(w.visualConfig) as { color?: string };
  const COLORS: Record<string, string> = {
    blue: "#059669",
    green: "#52c41a",
    red: "#ff4d4f",
    orange: "#fa8c16",
    purple: "#722ed1",
  };
  const accent = COLORS[cfg?.color ?? "blue"] ?? "#059669";

  for (const entry of KPI_MAP) {
    if (entry.match(title)) {
      return { value: entry.value, hint: w.subtitle ?? entry.hint, accent };
    }
  }
  return { value: "—", hint: w.subtitle, accent };
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ─── Widget type normalizer ───────────────────────────────────────────────────
// Backend (DynamicFormService) stores widgetType as PascalCase ("KpiCard", "PieChart")
// or kebab-case ("kpi-card") depending on how the widget was created.
// This normalizes all variants to the snake_case keys WidgetRenderer switches on.

const WIDGET_TYPE_MAP: Record<string, string> = {
  // KPI
  KpiCard:    "kpi",
  "kpi-card": "kpi",
  kpicard:    "kpi",
  // Pie / donut
  PieChart:    "pie_chart",
  "pie-chart": "pie_chart",
  Donut:       "donut_chart",
  DonutChart:  "donut_chart",
  "donut-chart":"donut_chart",
  // Bar
  BarChart:    "bar_chart",
  "bar-chart": "bar_chart",
  // Line
  LineChart:   "line_chart",
  "line-chart":"line_chart",
  // Area
  AreaChart:   "area_chart",
  "area-chart":"area_chart",
  // Table
  Table:           "simple_table",
  DataTable:       "advanced_table",
  "simple-table":  "simple_table",
  "advanced-table":"advanced_table",
  "data-table":    "advanced_table",
};

function resolveWidgetType(raw: string): string {
  return WIDGET_TYPE_MAP[raw] ?? raw;
}

// ─── Dynamic data helpers ─────────────────────────────────────────────────────

function toChartData(
  raw: unknown,
  labelField: string,
  valueField: string,
  rowPath?: string,
): ChartDataPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const r = rowPath
      ? ((item as Record<string, unknown>)[rowPath] as Record<string, unknown>) ?? (item as Record<string, unknown>)
      : (item as Record<string, unknown>);
    return { label: String(r[labelField] ?? ""), value: Number(r[valueField] ?? 0) };
  });
}

function toTableColumns(rawCols: unknown): { key: string; title: string }[] {
  if (!Array.isArray(rawCols)) return [];
  return rawCols.map((c) => {
    const col = c as Record<string, string>;
    return { key: col.field ?? col.key ?? "", title: col.header ?? col.title ?? "" };
  });
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export function WidgetRenderer({
  widget,
  sourceData = {},
  sourcesLoading = false,
  moduleCode,
}: {
  widget: ApiWidget;
  sourceData?: Record<string, unknown>;
  sourcesLoading?: boolean;
  moduleCode?: string;
}) {
  const { chartType: rawType, title } = widget;
  const type = resolveWidgetType(rawType);

  // ── FormSection ───────────────────────────────────────────────────────────────
  if (type === "FormSection") {
    const cfg = safeJson(widget.visualConfig);
    const schema = (cfg.formSchema ?? { fields: [] }) as FormSchema;
    const formKey = (cfg.formKey as string | undefined) ?? undefined;
    // title priority: config.title → formSchema.name → widget.title
    const formTitle = title
      || (schema as unknown as Record<string, unknown>).name as string | undefined
      || undefined;
    return (
      <FormSectionWidget
        title={formTitle}
        schema={schema}
        sourceData={sourceData}
        moduleCode={moduleCode}
        formKey={formKey}
      />
    );
  }

  // ── KPI ──────────────────────────────────────────────────────────────────────
  if (type === "kpi") {
    const cfg         = safeJson(widget.visualConfig);
    const valueExpr   = cfg.valueExpression  as string | undefined;
    const hintExpr    = cfg.hintExpression   as string | undefined;
    const unit        = cfg.unit             as string | undefined;
    const staticHint  = cfg.hint             as string | undefined;
    const hintColor   = cfg.hintColor        as string | undefined;
    const accentColor = (cfg.color as string | undefined) ?? "#059669";
    const trendCfg    = cfg.trend as { isUp?: boolean; label?: string } | undefined;
    const trend       = trendCfg ? { isUp: trendCfg.isUp ?? true, label: trendCfg.label ?? "" } : undefined;

    // hint priority: hintExpression (dynamic) > hint static > widget.subtitle
    // unit is a value suffix ("1,234 BN"), independent of hint
    const baseHint: string | undefined = staticHint ?? (widget.subtitle ?? undefined);

    if (valueExpr) {
      if (sourcesLoading) {
        return <KpiCard title={title ?? ""} loading accent={accentColor} className="h-full" />;
      }
      if (Object.keys(sourceData).length > 0) {
        const raw = evaluateExpression(valueExpr, sourceData);
        if (raw != null && raw !== "") {
          const fmt = cfg.displayFormat as string | undefined;
          const formatted = fmt ? applyDisplayFormat(raw, fmt) : raw;
          const displayValue = unit
            ? <>{formatted}<span className="text-xl font-medium text-gray-400 dark:text-[#8b949e] ml-1.5 align-baseline">{unit}</span></>
            : formatted;
          const dynHint = hintExpr ? evaluateExpression(hintExpr, sourceData) : undefined;
          const resolvedHint = (dynHint != null && dynHint !== "") ? String(dynHint) : baseHint;
          return (
            <KpiCard
              title={title ?? ""}
              value={displayValue}
              hint={resolvedHint}
              hintColor={hintColor}
              trend={trend}
              accent={accentColor}
              className="h-full"
            />
          );
        }
      }
    }
    const { value, hint, accent: fallbackAccent } = resolveKpiValue(widget);
    return (
      <KpiCard
        title={title ?? ""}
        value={unit
          ? <>{value}<span className="text-xl font-medium text-gray-400 dark:text-[#8b949e] ml-1.5 align-baseline">{unit}</span></>
          : value}
        hint={baseHint ?? hint}
        hintColor={hintColor}
        trend={trend}
        accent={accentColor !== "#059669" ? accentColor : fallbackAccent}
        className="h-full"
      />
    );
  }

  // ── Line chart ───────────────────────────────────────────────────────────────
  if (type === "line_chart") {
    const cfg = safeJson(widget.visualConfig);
    const dataExpr = cfg.dataExpression as string | undefined;
    if (dataExpr && Object.keys(sourceData).length > 0) {
      const raw = evaluateRaw(dataExpr, sourceData);
      const dynData = toChartData(raw, (cfg.labelField as string) ?? "label", (cfg.valueField as string) ?? "value", cfg.rowPath as string | undefined);
      if (dynData.length > 0) return <ChartLine title={title} data={dynData} color={(cfg.color as string) ?? "#059669"} unit={cfg.unit as string | undefined} />;
    }
    const tl = title?.toLowerCase() ?? "";
    const isVitals = tl.includes("sinh tồn") || tl.includes("vital");
    if (isVitals) {
      return (
        <ChartLine
          title={title}
          data={VITALS_MULTI}
          series={[
            { key: "nhịp_tim", color: "#ff4d4f", name: "Nhịp tim (bpm)" },
            { key: "huyết_áp", color: "#059669", name: "HA tâm thu (mmHg)" },
            { key: "spo2", color: "#52c41a", name: "SpO2 (%)" },
          ]}
          legend
        />
      );
    }
    const data = tl.includes("tháng") ? MONTH_DATA : TREND_DATA;
    const unit = tl.includes("tháng") ? "B" : undefined;
    return <ChartLine title={title} data={data} color="#059669" unit={unit} />;
  }

  // ── Bar chart ────────────────────────────────────────────────────────────────
  if (type === "bar_chart") {
    const cfg = safeJson(widget.visualConfig);
    const dataExpr = cfg.dataExpression as string | undefined;
    if (dataExpr && Object.keys(sourceData).length > 0) {
      const raw = evaluateRaw(dataExpr, sourceData);
      const dynData = toChartData(raw, (cfg.labelField as string) ?? "label", (cfg.valueField as string) ?? "value", cfg.rowPath as string | undefined);
      if (dynData.length > 0) return <ChartBar title={title} data={dynData} color={(cfg.color as string) ?? "#059669"} unit={cfg.unit as string | undefined} />;
    }
    const tl = title?.toLowerCase() ?? "";
    const data = tl.includes("tháng") ? MONTH_DATA : TREND_DATA;
    const unit = tl.includes("tháng") ? "B" : undefined;
    return <ChartBar title={title} data={data} color="#059669" unit={unit} />;
  }

  // ── Area chart ───────────────────────────────────────────────────────────────
  if (type === "area_chart") {
    const cfg = safeJson(widget.visualConfig);
    const dataExpr = cfg.dataExpression as string | undefined;
    if (dataExpr && Object.keys(sourceData).length > 0) {
      const raw = evaluateRaw(dataExpr, sourceData);
      const dynData = toChartData(raw, (cfg.labelField as string) ?? "label", (cfg.valueField as string) ?? "value", cfg.rowPath as string | undefined);
      if (dynData.length > 0) return <ChartArea title={title} data={dynData} color={(cfg.color as string) ?? "#722ed1"} unit={cfg.unit as string | undefined} />;
    }
    const tl = title?.toLowerCase() ?? "";
    const data = tl.includes("giờ") ? HOUR_DATA : TREND_DATA;
    return <ChartArea title={title} data={data} color="#722ed1" />;
  }

  // ── Pie / donut ──────────────────────────────────────────────────────────────
  if (type === "pie_chart" || type === "donut_chart") {
    const cfg = safeJson(widget.visualConfig);
    const dataExpr = cfg.dataExpression as string | undefined;
    if (dataExpr && Object.keys(sourceData).length > 0) {
      const raw = evaluateRaw(dataExpr, sourceData);
      const dynData = toChartData(raw, (cfg.labelField as string) ?? "label", (cfg.valueField as string) ?? "value", cfg.rowPath as string | undefined);
      if (dynData.length > 0) {
        return (
          <ChartPie
            title={title}
            data={dynData}
            dataKey="value"
            variant={type === "donut_chart" ? "donut" : "pie"}
            legend
          />
        );
      }
    }
    const tl = title?.toLowerCase() ?? "";
    const pieData =
      tl.includes("doanh thu") || tl.includes("nguồn")
        ? PIE_REV_SRC
        : tl.includes("chẩn đoán") || tl.includes("bệnh")
          ? PIE_DIAG
          : PIE_DEPT;
    return (
      <ChartPie
        title={title}
        data={pieData}
        dataKey="value"
        variant={type === "donut_chart" ? "donut" : "pie"}
        legend
      />
    );
  }

  // ── Scatter ──────────────────────────────────────────────────────────────────
  if (type === "scatter") {
    const cfg = safeJson(widget.visualConfig);
    const dataExpr = cfg.dataExpression as string | undefined;
    const xField = (cfg.xField as string | undefined) ?? "x";
    const yField = (cfg.yField as string | undefined) ?? "y";
    const zField = cfg.zField as string | undefined;
    const color   = (cfg.color as string | undefined) ?? "#059669";

    if (dataExpr && Object.keys(sourceData).length > 0) {
      if (sourcesLoading) {
        return <ChartScatter title={title} data={[]} color={color} loading />;
      }
      const raw = evaluateRaw(dataExpr, sourceData);
      if (Array.isArray(raw) && raw.length > 0) {
        return (
          <ChartScatter
            title={title}
            data={raw as Parameters<typeof ChartScatter>[0]["data"]}
            xField={xField}
            yField={yField}
            zField={zField}
            color={color}
            xUnit={cfg.xUnit as string | undefined}
            yUnit={cfg.yUnit as string | undefined}
          />
        );
      }
    }

    // Static demo data khi chưa có source
    const DEMO: { x: number; y: number }[] = [
      { x: 10, y: 30 }, { x: 40, y: 80 }, { x: 60, y: 20 },
      { x: 80, y: 95 }, { x: 25, y: 55 }, { x: 50, y: 40 },
      { x: 70, y: 65 }, { x: 90, y: 10 }, { x: 35, y: 75 },
    ];
    return <ChartScatter title={title} data={DEMO} color={color} />;
  }

  // ── Gauge ────────────────────────────────────────────────────────────────────
  if (type === "gauge") {
    const pct = 78;
    const barColor = pct >= 85 ? "#ff4d4f" : pct >= 70 ? "#faad14" : "#52c41a";
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm p-4 h-full flex flex-col justify-center items-center gap-2">
        {title && (
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0 text-center">
            {title}
          </p>
        )}
        <p
          className="text-3xl font-bold tabular-nums m-0"
          style={{ color: barColor }}
        >
          {pct}%
        </p>
        <div className="w-full bg-gray-100 dark:bg-[#30363d] rounded-full h-2">
          <div
            className="h-2 rounded-full"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>
    );
  }

  // ── Heatmap ──────────────────────────────────────────────────────────────────
  if (type === "heatmap") {
    const cols = 8;
    const rows = DAYS_7;
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm p-4 h-full flex flex-col overflow-hidden">
        {title && (
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-3 m-0 shrink-0">
            {title}
          </p>
        )}
        <div className="flex-1 overflow-auto">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
          >
            {rows.flatMap((d) =>
              HOURS_8.map((h) => {
                const v = Math.round(Math.random() * 100);
                return (
                  <div
                    key={`${d}-${h}`}
                    title={`${d} ${h}: ${v}`}
                    className="rounded-sm h-6"
                    style={{
                      background: `rgba(22,119,255,${(v / 100).toFixed(2)})`,
                    }}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Progress rows ─────────────────────────────────────────────────────────────
  if (type === "progress_rows") {
    return (
      <ProgressList
        title={title ?? "Công suất giường theo khoa"}
        headerAction="Xem chi tiết →"
        items={CAPACITY_ITEMS}
        maxValue={100}
        realtimeBadge
        footerActions={[
          {
            label: "18 khoa – Xem chi tiết →",
            variant: "link",
            color: "#059669",
          },
        ]}
      />
    );
  }

  // ── Alert list ────────────────────────────────────────────────────────────────
  if (type === "alert_list") {
    return (
      <AlertList
        title={title ?? "Cảnh báo đang kích hoạt"}
        items={ALERT_ITEMS}
        totalCount={ALERT_ITEMS.length}
        realtimeBadge
      />
    );
  }

  // ── Tables ────────────────────────────────────────────────────────────────────
  if (type === "simple_table" || type === "advanced_table") {
    const cfg = safeJson(widget.visualConfig);
    const dataExpr = cfg.dataExpression as string | undefined;

    if (dataExpr) {
      // Loading skeleton — animated pulse
      if (sourcesLoading) {
        return (
          <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col overflow-hidden">
            {title && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
                <div className="h-3 w-28 rounded bg-gray-200 dark:bg-[#30363d] animate-pulse" />
              </div>
            )}
            <div className="flex gap-6 px-4 py-2.5 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
              {[44, 88, 64, 56, 44].map((w, i) => (
                <div key={i} className="h-2.5 rounded bg-gray-200 dark:bg-[#30363d] animate-pulse" style={{ width: w }} />
              ))}
            </div>
            <div className="flex-1 overflow-hidden divide-y divide-gray-50 dark:divide-[#161b22]">
              {[0, 1, 2, 3, 4].map((r) => (
                <div key={r} className="flex gap-6 px-4 py-3">
                  {[44, 88, 64, 56, 44].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded bg-gray-100 dark:bg-[#1f2937] animate-pulse"
                      style={{ width: w + (r * 9 + i * 13) % 28 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Data resolved — render real table
      const raw = evaluateRaw(dataExpr, sourceData);
      if (Array.isArray(raw) && raw.length > 0) {
        const canonicalAtKey = cfg.canonicalAtKey as string | undefined;
        const rows = raw.map((item) => {
          const row = item as Record<string, unknown>;
          if (canonicalAtKey && typeof row[canonicalAtKey] === "string") {
            try { return { ...row, ...JSON.parse(row[canonicalAtKey] as string) as Record<string, unknown> }; }
            catch { return row; }
          }
          return row;
        });
        const dynCols = toTableColumns(cfg.columns);
        const INTERNAL_KEYS = new Set(["id", "sourceSystem", "recordType", "businessKey", "status", "canonicalPayload", "receivedAt", "processedAt", "key"]);
        const cols = dynCols.length > 0
          ? dynCols
          : Object.keys(rows[0]).filter((k) => !INTERNAL_KEYS.has(k)).map((k) => ({ key: k, title: k }));
        return (
          <DataTable
            title={title}
            columns={cols}
            data={rows}
            pageSize={10}
            exportButton={type === "advanced_table"}
          />
        );
      }

      // dataExpression configured but resolved to empty — empty state
      return (
        <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col overflow-hidden">
          {title && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">{title}</p>
            </div>
          )}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#1f2937] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-[#30363d]">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
            </div>
            <p className="text-xs text-gray-400 dark:text-[#484f58] m-0">Không có dữ liệu</p>
            <p className="text-[10px] text-gray-300 dark:text-[#30363d] m-0 font-mono">{dataExpr}</p>
          </div>
        </div>
      );
    }

    // No dataExpression configured — static skeleton placeholder
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/50 dark:bg-[#0d1117] h-full flex flex-col overflow-hidden">
        {title && (
          <div className="px-4 py-3 border-b border-dashed border-gray-200 dark:border-[#30363d] shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider m-0">{title}</p>
          </div>
        )}
        <div className="flex gap-6 px-4 py-2.5 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
          {[44, 88, 64, 56, 44].map((w, i) => (
            <div key={i} className="h-2.5 rounded bg-gray-200 dark:bg-[#30363d]" style={{ width: w }} />
          ))}
        </div>
        <div className="flex-1 overflow-hidden divide-y divide-gray-50 dark:divide-[#161b22]">
          {[0, 1, 2, 3, 4].map((r) => (
            <div key={r} className="flex gap-6 px-4 py-3">
              {[44, 88, 64, 56, 44].map((w, i) => (
                <div key={i} className="h-2 rounded bg-gray-100 dark:bg-[#1f2937]" style={{ width: w + (r * 9 + i * 13) % 28 }} />
              ))}
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t border-dashed border-gray-200 dark:border-[#30363d] shrink-0 flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-[#484f58] shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          <span className="text-[10px] text-gray-400 dark:text-[#484f58]">
            Chưa cấu hình nguồn dữ liệu · Mở Properties Panel để thiết lập
          </span>
        </div>
      </div>
    );
  }

  // ── Flow steps / patient flow stages ──────────────────────────────────────────
  if (type === "flow_steps" || type === "patient_flow_stages") {
    const stages =
      type === "patient_flow_stages" ? FLOW_INPATIENT : FLOW_OUTPATIENT;
    return <FlowPipeline title={title} stages={stages} realtimeBadge />;
  }

  // ── Risk tiers ────────────────────────────────────────────────────────────────
  if (type === "risk_tiers") {
    return <StatsSummary title={title} items={RISK_TIERS} />;
  }

  // ── Daily patient flow stats ──────────────────────────────────────────────────
  if (type === "stats_summary") {
    return (
      <StatsSummary
        title={title ?? "Dòng bệnh nhân hôm nay"}
        subtitle="TIBT: 38 phút · Tracking từ đăng ký đến hoàn thành"
        items={DAILY_FLOW_STATS}
      />
    );
  }

  // ── Bed grid ──────────────────────────────────────────────────────────────────
  if (type === "bed_grid") {
    return <WardBedGrid title={title} wards={WARDS} />;
  }

  // ── OR room grid ──────────────────────────────────────────────────────────────
  if (type === "room_status_grid") {
    return <OrRoomGrid title={title} rooms={OR_ROOMS} />;
  }

  // ── NEWS2 bars ────────────────────────────────────────────────────────────────
  if (type === "news2_bars") {
    const news2Data = [
      { label: "SpO2", value: 3 },
      { label: "Nhịp thở", value: 2 },
      { label: "Nhịp tim", value: 1 },
      { label: "Nhiệt độ", value: 0 },
      { label: "Huyết áp", value: 2 },
      { label: "Tri giác", value: 1 },
    ];
    return <ChartBar title={title} data={news2Data} color="#ff4d4f" />;
  }

  // ── Timeline / bullet list ────────────────────────────────────────────────────
  if (type === "timeline_vertical" || type === "bullet_list") {
    const tl = title?.toLowerCase() ?? "";
    const items =
      tl.includes("dị ứng") || tl.includes("allerg")
        ? BULLET_DRUG_ALLERGY
        : BULLET_SCHEDULE;
    return <BulletList title={title} items={items} />;
  }

  // ── Filter widgets ─────────────────────────────────────────────────────────────
  if (
    type === "filter_dropdown" ||
    type === "filter_date_range" ||
    type === "filter_search" ||
    type === "filter_slider"
  ) {
    const labels: Record<string, string> = {
      filter_dropdown: "Lọc theo khoa / chế độ",
      filter_date_range: "Khoảng thời gian",
      filter_search: "Tìm kiếm bệnh nhân",
      filter_slider: "Phạm vi giá trị",
    };
    return (
      <div className="rounded-lg border border-dashed border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 p-3 h-full flex items-center gap-2">
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold shrink-0">
          {title ?? labels[type] ?? "Filter"}
        </span>
        <div className="flex-1 h-6 rounded bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900" />
      </div>
    );
  }

  // ── Text widget ───────────────────────────────────────────────────────────────
  if (type === "text_widget") {
    const cfg = safeJson(widget.visualConfig) as { content?: string };
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm p-4 h-full overflow-auto">
        {title && (
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-2 m-0">
            {title}
          </p>
        )}
        <p className="text-sm text-gray-700 dark:text-[#e6edf3] m-0 leading-relaxed">
          {cfg?.content ?? "Nội dung văn bản..."}
        </p>
      </div>
    );
  }

  // ── Chat panel ────────────────────────────────────────────────────────────────
  if (type === "chat_panel") {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm p-4 h-full flex flex-col gap-2">
        {title && (
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0 shrink-0">
            {title}
          </p>
        )}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400 dark:text-[#484f58] text-center">
            AI Chat — kết nối backend để kích hoạt
          </p>
        </div>
      </div>
    );
  }

  // ── Embed SDUI page (Lakehouse chart, doc 63) ─────────────────────────────────
  if (type === "embed_sdui_page") {
    const cfg = safeJson(widget.visualConfig) as {
      providerCode?: string;
      operationKey?: string;
      params?: Record<string, string>;
      queryParams?: Record<string, string>;
      height?: number;
    };
    if (cfg.providerCode && cfg.operationKey) {
      return (
        <EmbedSduiPageWidget
          providerCode={cfg.providerCode}
          operationKey={cfg.operationKey}
          params={cfg.params ?? {}}
          queryParams={cfg.queryParams}
          height={cfg.height}
        />
      );
    }
  }

  // ── Fallback ──────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-dashed border-gray-300 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117] p-4 h-full flex flex-col items-center justify-center gap-1 text-center">
      <p className="text-[10px] font-mono text-gray-400 dark:text-[#484f58] m-0">
        {type}
      </p>
      {title && (
        <p className="text-xs text-gray-500 dark:text-[#8b949e] m-0">{title}</p>
      )}
    </div>
  );
}
