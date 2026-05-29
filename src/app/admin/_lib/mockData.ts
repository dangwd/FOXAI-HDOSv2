import { adminApi } from "@/infrastructure/http/adminApi";
import type {
  AdminModule,
  WidgetSchemaEntry,
  ProviderInfo,
  OperationEntry,
  ModuleLayout,
} from "@/infrastructure/http/adminApi";

type AdminApiType = typeof adminApi;

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Modules ─────────────────────────────────────────────────────────────────

export const MOCK_MODULES: AdminModule[] = [
  // ĐIỀU HÀNH
  {
    id: "1", slug: "dashboard",          label: "Dashboard Điều hành",     icon: "DB",
    description: "KPI tổng quan toàn bệnh viện: doanh thu, giường, nhân sự, cảnh báo.",
    sortOrder: 0, group: "dieu-hanh", roles: ["admin"], isActive: true, isVisible: true,
  },
  {
    id: "2", slug: "operations-center",  label: "Trung tâm điều phối",     icon: "TT",
    description: "Theo dõi hoạt động real-time: ambulance, OR, ER, ICU.",
    sortOrder: 1, group: "dieu-hanh", roles: ["admin"], isActive: true, isVisible: true,
  },
  {
    id: "3", slug: "digital-twin",       label: "Digital Twin Bệnh viện",  icon: "DT",
    description: "Mô phỏng số bệnh viện, mô hình 3D tầng, luồng bệnh nhân, dự báo.",
    sortOrder: 2, group: "dieu-hanh", roles: ["admin", "doctor"], isActive: true, isVisible: true,
  },
  // LÂM SÀNG
  {
    id: "4", slug: "emergency",          label: "Cấp cứu",                 icon: "CC",
    description: "Theo dõi ER: bệnh nhân chờ, phân loại, xe cấp cứu đến, cảnh báo.",
    sortOrder: 3, group: "lam-sang", roles: ["doctor", "nurse", "admin"], isActive: true, isVisible: true,
  },
  {
    id: "5", slug: "inpatient",          label: "Nội trú",                 icon: "NT",
    description: "Quản lý bệnh nhân nội trú: giường, NEWS2, pathway điều trị.",
    sortOrder: 4, group: "lam-sang", roles: ["doctor", "nurse", "admin"], isActive: true, isVisible: true,
  },
  {
    id: "6", slug: "outpatient",         label: "Ngoại trú",               icon: "NG",
    description: "Lịch khám, danh sách chờ, kết quả xét nghiệm ngoại trú.",
    sortOrder: 5, group: "lam-sang", roles: ["doctor", "nurse", "admin"], isActive: true, isVisible: true,
  },
  // thêm để designer vẫn có data cũ
  {
    id: "7", slug: "patient-flow",       label: "Luồng bệnh nhân",        icon: "LB",
    description: "Theo dõi luồng di chuyển và phân tầng nguy cơ bệnh nhân.",
    sortOrder: 6, group: "lam-sang", roles: ["doctor", "nurse"], isActive: true, isVisible: true,
  },
  {
    id: "8", slug: "bed-management",     label: "Quản lý giường",         icon: "GB",
    description: "Tình trạng giường bệnh viện real-time theo khoa.",
    sortOrder: 7, group: "lam-sang", roles: ["nurse", "admin"], isActive: true, isVisible: true,
  },
];

// ─── Widget schemas ───────────────────────────────────────────────────────────

export const MOCK_SCHEMAS: WidgetSchemaEntry[] = [
  // visualization
  { chartType: "kpi",              category: "visualization", label: "KPI Card",          description: "Thẻ chỉ số đơn",             icon: "📊", sortOrder: 0 },
  { chartType: "kpi_grid",         category: "visualization", label: "KPI Grid",          description: "Lưới thẻ chỉ số",            icon: "🔢", sortOrder: 1 },
  { chartType: "line_chart",       category: "visualization", label: "Biểu đồ đường",    description: "Xu hướng theo thời gian",    icon: "📈", sortOrder: 2 },
  { chartType: "bar_chart",        category: "visualization", label: "Biểu đồ cột",      description: "So sánh theo danh mục",      icon: "📊", sortOrder: 3 },
  { chartType: "area_chart",       category: "visualization", label: "Biểu đồ vùng",     description: "Diện tích tích lũy",         icon: "📉", sortOrder: 4 },
  { chartType: "pie_chart",        category: "visualization", label: "Biểu đồ tròn",     description: "Phân bố phần trăm",          icon: "🥧", sortOrder: 5 },
  { chartType: "donut_chart",      category: "visualization", label: "Biểu đồ Donut",    description: "Phân bố dạng donut",         icon: "⭕", sortOrder: 6 },
  { chartType: "gauge",            category: "visualization", label: "Đồng hồ đo",       description: "Chỉ số dạng gauge",          icon: "⏱️", sortOrder: 7 },
  { chartType: "simple_table",     category: "visualization", label: "Bảng đơn giản",    description: "Bảng dữ liệu cơ bản",       icon: "📋", sortOrder: 8 },
  { chartType: "advanced_table",   category: "visualization", label: "Bảng nâng cao",    description: "Bảng với sort/filter",      icon: "🗃️", sortOrder: 9 },
  { chartType: "heatmap",          category: "visualization", label: "Heatmap",           description: "Bản đồ nhiệt",               icon: "🌡️", sortOrder: 10 },
  { chartType: "scatter",          category: "visualization", label: "Phân tán",          description: "Tương quan 2 biến",          icon: "✦",  sortOrder: 11 },
  // healthcare
  { chartType: "patient_flow_stages", category: "healthcare", label: "Luồng bệnh nhân",  description: "Giai đoạn điều trị",         icon: "🔄", sortOrder: 0 },
  { chartType: "bed_grid",            category: "healthcare", label: "Lưới giường",      description: "Trạng thái từng giường",    icon: "🛏️", sortOrder: 1 },
  { chartType: "risk_tiers",          category: "healthcare", label: "Phân tầng nguy cơ",description: "Mức độ nguy cơ bệnh nhân", icon: "⚠️", sortOrder: 2 },
  { chartType: "news2_bars",          category: "healthcare", label: "NEWS2 Bars",        description: "Chỉ số cảnh báo sớm",       icon: "🔔", sortOrder: 3 },
  { chartType: "alert_list",          category: "healthcare", label: "Danh sách cảnh báo",description: "Cảnh báo ưu tiên",         icon: "🚨", sortOrder: 4 },
  { chartType: "timeline_vertical",   category: "healthcare", label: "Timeline dọc",      description: "Lịch sử sự kiện",           icon: "📅", sortOrder: 5 },
  { chartType: "progress_rows",       category: "healthcare", label: "Tiến trình",        description: "Thanh tiến trình hàng",     icon: "▶️", sortOrder: 6 },
  // filter
  { chartType: "filter_dropdown",   category: "filter", label: "Dropdown",        description: "Lọc bằng dropdown",       icon: "▼",  sortOrder: 0 },
  { chartType: "filter_date_range", category: "filter", label: "Khoảng ngày",    description: "Chọn khoảng thời gian",   icon: "📅", sortOrder: 1 },
  { chartType: "filter_search",     category: "filter", label: "Ô tìm kiếm",    description: "Tìm kiếm văn bản",        icon: "🔍", sortOrder: 2 },
  { chartType: "filter_slider",     category: "filter", label: "Thanh trượt",    description: "Lọc theo khoảng số",     icon: "🎚️", sortOrder: 3 },
  // layout
  { chartType: "text_widget",      category: "layout", label: "Văn bản",         description: "Tiêu đề / mô tả",         icon: "📝", sortOrder: 0 },
  { chartType: "flow_steps",       category: "layout", label: "Flow Steps",       description: "Các bước quy trình",       icon: "➡️", sortOrder: 1 },
  { chartType: "map_pins",         category: "layout", label: "Bản đồ pin",       description: "Vị trí trên bản đồ",      icon: "📍", sortOrder: 2 },
  { chartType: "room_status_grid", category: "layout", label: "Lưới phòng",       description: "Trạng thái phòng ban",    icon: "🏠", sortOrder: 3 },
  // ai
  { chartType: "chat_panel", category: "ai", label: "AI Chat",           description: "Trợ lý AI tương tác",     icon: "🤖", sortOrder: 0 },
  { chartType: "funnel",     category: "ai", label: "Phễu phân tích",    description: "Phân tích theo phễu",     icon: "🔺", sortOrder: 1 },
];

// ─── Providers & operations ───────────────────────────────────────────────────

export const MOCK_PROVIDERS: ProviderInfo[] = [
  { id: "hdos-rest",    name: "HDOS REST API" },
  { id: "hdos-graphql", name: "HDOS GraphQL" },
  { id: "signalr-hub",  name: "SignalR Hub" },
  { id: "mock",         name: "Mock / Static" },
];

export const MOCK_OPERATIONS: OperationEntry[] = [
  { pattern: "patient.list",            providerId: "hdos-rest" },
  { pattern: "patient.vitals",          providerId: "hdos-rest" },
  { pattern: "patient.risk",            providerId: "hdos-rest" },
  { pattern: "bed.status",              providerId: "hdos-rest" },
  { pattern: "bed.occupancy",           providerId: "hdos-rest" },
  { pattern: "lab.results",             providerId: "hdos-rest" },
  { pattern: "lab.pending",             providerId: "hdos-rest" },
  { pattern: "pharmacy.prescriptions",  providerId: "hdos-rest" },
  { pattern: "emergency.queue",         providerId: "hdos-rest" },
  { pattern: "emergency.triage",        providerId: "hdos-rest" },
  { pattern: "vitals.realtime",         providerId: "signalr-hub" },
  { pattern: "alerts.stream",           providerId: "signalr-hub" },
  { pattern: "patient.query",           providerId: "hdos-graphql" },
  { pattern: "static.demo",             providerId: "mock" },
];

// ─── Module layouts ───────────────────────────────────────────────────────────

const MOCK_LAYOUTS: Record<string, ModuleLayout> = {
  "patient-flow": {
    slug: "patient-flow",
    label: "Luồng bệnh nhân",
    tabs: [
      {
        id: "pf-tab-1", slug: "overview", label: "Tổng quan", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "kpi_admitted",   title: "Đang nhập viện",   subtitle: "Realtime",    chartType: "kpi",                  gridX: 0, gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"status":"admitted"}',   visualConfig: '{"color":"blue"}',  filterBindings: [],                interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_waiting",    title: "Đang chờ",          subtitle: "",             chartType: "kpi",                  gridX: 3, gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"status":"waiting"}',    visualConfig: '{"color":"amber"}', filterBindings: [],                interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_discharged", title: "Xuất viện hôm nay", subtitle: "",             chartType: "kpi",                  gridX: 6, gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"status":"discharged"}', visualConfig: '{"color":"green"}', filterBindings: [],                interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_bed_occ",    title: "Công suất giường",  subtitle: "",             chartType: "gauge",                gridX: 9, gridY: 0, gridW: 3, gridH: 2, operationPattern: "bed.occupancy",  providerId: "hdos-rest",   paramsTemplate: "{}",               visualConfig: "{}",                filterBindings: [],                interactions: "{}", filterKey: "" },
          { widgetKey: "flow_stages_1",  title: "Luồng điều trị",    subtitle: "",             chartType: "patient_flow_stages",  gridX: 0, gridY: 2, gridW: 12, gridH: 4, operationPattern: "patient.list",  providerId: "hdos-rest",   paramsTemplate: "{}",               visualConfig: "{}",                filterBindings: [],                interactions: "{}", filterKey: "" },
          { widgetKey: "alert_list_1",   title: "Cảnh báo",          subtitle: "",             chartType: "alert_list",           gridX: 0, gridY: 6, gridW: 6, gridH: 4,  operationPattern: "alerts.stream",  providerId: "signalr-hub", paramsTemplate: "{}",               visualConfig: "{}",                filterBindings: [],                interactions: "{}", filterKey: "" },
          { widgetKey: "line_admits",    title: "Nhập viện 7 ngày",  subtitle: "",             chartType: "line_chart",           gridX: 6, gridY: 6, gridW: 6, gridH: 4,  operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"days":7}',       visualConfig: "{}",                filterBindings: [],                interactions: "{}", filterKey: "" },
        ],
      },
      {
        id: "pf-tab-2", slug: "risk", label: "Phân tầng nguy cơ", sortOrder: 1, isDefault: false,
        widgets: [
          { widgetKey: "risk_1",   title: "Nguy cơ theo khoa", subtitle: "", chartType: "risk_tiers",  gridX: 0, gridY: 0, gridW: 6, gridH: 4, operationPattern: "patient.risk",   providerId: "hdos-rest",  paramsTemplate: "{}", visualConfig: "{}", filterBindings: [],            interactions: "{}", filterKey: "" },
          { widgetKey: "news2_1",  title: "NEWS2 Score",        subtitle: "", chartType: "news2_bars",  gridX: 6, gridY: 0, gridW: 6, gridH: 4, operationPattern: "patient.vitals", providerId: "hdos-rest",  paramsTemplate: "{}", visualConfig: "{}", filterBindings: [],            interactions: "{}", filterKey: "" },
          { widgetKey: "tl_risk",  title: "Lịch sử nguy cơ",   subtitle: "", chartType: "timeline_vertical", gridX: 0, gridY: 4, gridW: 4, gridH: 6, operationPattern: "patient.risk", providerId: "hdos-rest", paramsTemplate: "{}", visualConfig: "{}", filterBindings: [],           interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },
  "bed-management": {
    slug: "bed-management",
    label: "Quản lý giường",
    tabs: [
      {
        id: "bm-tab-1", slug: "main", label: "Tổng quan", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "ward_dd",    title: "Lọc khoa",         subtitle: "", chartType: "filter_dropdown", gridX: 0, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "",              providerId: "",           paramsTemplate: "{}", visualConfig: '{"options":["ICU","Nội","Ngoại","Sản","Nhi"]}', filterBindings: [],           interactions: "{}", filterKey: "ward_filter" },
          { widgetKey: "occ_gauge",  title: "Tỷ lệ sử dụng",   subtitle: "", chartType: "gauge",           gridX: 9, gridY: 0, gridW: 3,  gridH: 4, operationPattern: "bed.occupancy", providerId: "hdos-rest",  paramsTemplate: "{}", visualConfig: "{}", filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "bed_grid_1", title: "Lưới giường bệnh", subtitle: "", chartType: "bed_grid",        gridX: 0, gridY: 2, gridW: 9,  gridH: 5, operationPattern: "bed.status",    providerId: "hdos-rest",  paramsTemplate: "{}", visualConfig: "{}", filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "room_grid",  title: "Sơ đồ phòng",     subtitle: "", chartType: "room_status_grid",gridX: 0, gridY: 7, gridW: 12, gridH: 4, operationPattern: "bed.status",    providerId: "hdos-rest",  paramsTemplate: "{}", visualConfig: "{}", filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },
  "vitals-monitor": {
    slug: "vitals-monitor",
    label: "Giám sát sinh hiệu",
    tabs: [
      {
        id: "vm-tab-1", slug: "main", label: "Realtime", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "kpi_hr",    title: "Nhịp tim TB",       subtitle: "bpm",  chartType: "kpi",        gridX: 0, gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"hr"}',  visualConfig: '{"color":"red"}',    filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_spo2",  title: "SpO2 TB",           subtitle: "%",    chartType: "kpi",        gridX: 3, gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"spo2"}', visualConfig: '{"color":"blue"}',   filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_temp",  title: "Nhiệt độ TB",       subtitle: "°C",   chartType: "kpi",        gridX: 6, gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"temp"}', visualConfig: '{"color":"orange"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_bp",    title: "Huyết áp TB",       subtitle: "mmHg", chartType: "kpi",        gridX: 9, gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"bp"}',   visualConfig: '{"color":"purple"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "line_hr",   title: "Nhịp tim theo giờ", subtitle: "",     chartType: "line_chart",  gridX: 0, gridY: 2, gridW: 6, gridH: 4, operationPattern: "patient.vitals",  providerId: "hdos-rest",   paramsTemplate: '{"metric":"hr","hours":24}', visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "news2_main",title: "NEWS2 Heatmap",      subtitle: "",     chartType: "news2_bars",  gridX: 6, gridY: 2, gridW: 6, gridH: 4, operationPattern: "patient.vitals",  providerId: "hdos-rest",   paramsTemplate: "{}", visualConfig: "{}", filterBindings: [],              interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },
};

// ─── Mock API (same shape as adminApi) ───────────────────────────────────────

export const mockAdminApi: AdminApiType = {
  listModules: async (): Promise<AdminModule[]> => {
    await delay(300);
    return MOCK_MODULES;
  },

  listSchemas: async (): Promise<WidgetSchemaEntry[]> => {
    await delay(200);
    return MOCK_SCHEMAS;
  },

  listProviders: async (): Promise<ProviderInfo[]> => {
    await delay(150);
    return MOCK_PROVIDERS;
  },

  listOperations: async (): Promise<OperationEntry[]> => {
    await delay(150);
    return MOCK_OPERATIONS;
  },

  getModuleLayout: async (slug: string): Promise<ModuleLayout> => {
    if (slug === "dashboard") {
      return adminApi.getModuleLayout(slug);
    }
    await delay(350);
    return MOCK_LAYOUTS[slug] ?? {
      slug,
      label: MOCK_MODULES.find((m) => m.slug === slug)?.label ?? slug,
      tabs: [{ id: `${slug}-tab-1`, slug: "main", label: "Tab chính", sortOrder: 0, isDefault: true, widgets: [] }],
    };
  },

  createTab: async (slug, body) => {
    await delay(200);
    void slug;
    return { id: `tab_${Date.now().toString(36)}`, slug: body.slug };
  },

  updateTab: async () => {
    await delay(100);
  },

  deleteTab: async () => {
    await delay(100);
  },

  saveWidgets: async (slug, tabId, widgets) => {
    await delay(500);
    void slug; void tabId;
    return { saved: widgets.length };
  },

  // Module CRUD — not used through mockAdminApi; stubs satisfy type
  createModule: async () => { throw new Error("use adminApi"); },
  updateModule: async () => { throw new Error("use adminApi"); },
  deleteModule: async () => { /* no-op */ },

  // Provider / Operation CRUD — not used through mockAdminApi; stubs satisfy type
  listFullProviders:  async () => { throw new Error("use adminApi"); },
  createProvider:     async () => { throw new Error("use adminApi"); },
  updateProvider:     async () => { throw new Error("use adminApi"); },
  deleteProvider:     async () => { /* no-op */ },
  listFullOperations: async () => { throw new Error("use adminApi"); },
  createOperation:    async () => { throw new Error("use adminApi"); },
  updateOperation:    async () => { throw new Error("use adminApi"); },
  deleteOperation:    async () => { /* no-op */ },
};
