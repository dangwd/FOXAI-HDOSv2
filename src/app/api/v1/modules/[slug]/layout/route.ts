import { NextResponse } from "next/server";
import type { ModuleLayout } from "@/infrastructure/http/adminApi";

// ─── Fake module layouts ──────────────────────────────────────────────────────
// Mirrors the structure that the admin panel configures and the real backend would serve.
// Swap this file for a real proxy to the backend when the API is ready.

const LAYOUTS: Record<string, ModuleLayout> = {

  // ── Executive Dashboard ─────────────────────────────────────────────────────
  dashboard: {
    slug: "dashboard",
    label: "Executive Dashboard",
    description: "Tổng quan điều hành toàn viện · Cập nhật realtime",
    tabs: [
      {
        id: "db-tab-1", slug: "overview", label: "Tổng quan", sortOrder: 0, isDefault: true,
        widgets: [
          // ── Row 1: 5 KPI cards (2+2+3+3+2 = 12) ─────────────────────────────
          { widgetKey: "kpi_visits",    title: "Lượt khám hôm nay", subtitle: "+42% hôm qua",      chartType: "kpi", gridX: 0,  gridY: 0, gridW: 2, gridH: 2, operationPattern: "patient.list",    providerId: "hdos-rest",   paramsTemplate: '{}', visualConfig: '{"color":"blue"}',   filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_revenue",   title: "Doanh thu",         subtitle: "+8% so kế hoạch",   chartType: "kpi", gridX: 2,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "static.demo",     providerId: "mock",        paramsTemplate: '{"metric":"revenue_day"}', visualConfig: '{"color":"green"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_inpatient", title: "BN nội trú",        subtitle: "+14 so sáng nay",   chartType: "kpi", gridX: 5,  gridY: 0, gridW: 2, gridH: 2, operationPattern: "bed.status",      providerId: "hdos-rest",   paramsTemplate: '{"status":"occupied"}', visualConfig: '{"color":"purple"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_bor",       title: "BOR toàn viện",     subtitle: "+2.1%",             chartType: "kpi", gridX: 7,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "bed.occupancy",   providerId: "hdos-rest",   paramsTemplate: '{}', visualConfig: '{"color":"orange"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_alerts",    title: "Cảnh báo active",   subtitle: "8 cần xử lý ngay",  chartType: "kpi", gridX: 10, gridY: 0, gridW: 2, gridH: 2, operationPattern: "alerts.stream",   providerId: "signalr-hub", paramsTemplate: '{}', visualConfig: '{"color":"red"}',    filterBindings: [], interactions: "{}", filterKey: "" },
          // ── Row 2: Progress rows (w=7) + Alert list (w=5) ────────────────────
          { widgetKey: "prog_capacity", title: "Công suất giường theo khoa", subtitle: "", chartType: "progress_rows", gridX: 0, gridY: 2, gridW: 7, gridH: 7, operationPattern: "bed.occupancy", providerId: "hdos-rest", paramsTemplate: "{}", visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "alert_main",    title: "Cảnh báo đang kích hoạt",   subtitle: "", chartType: "alert_list",    gridX: 7, gridY: 2, gridW: 5, gridH: 7, operationPattern: "alerts.stream",  providerId: "signalr-hub", paramsTemplate: "{}", visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          // ── Row 3: Stats summary (w=7) + Donut chart (w=5) ───────────────────
          { widgetKey: "stats_flow",    title: "Dòng bệnh nhân hôm nay", subtitle: "", chartType: "stats_summary", gridX: 0, gridY: 9, gridW: 7, gridH: 3, operationPattern: "patient.list", providerId: "hdos-rest", paramsTemplate: "{}", visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "donut_rev",     title: "Phân loại doanh thu",     subtitle: "", chartType: "donut_chart",   gridX: 7, gridY: 9, gridW: 5, gridH: 6, operationPattern: "static.demo",  providerId: "mock",        paramsTemplate: '{"metric":"revenue_source"}', visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
      {
        id: "db-tab-2", slug: "finance", label: "Tài chính", sortOrder: 1, isDefault: false,
        widgets: [
          { widgetKey: "kpi_rev_day",   title: "Doanh thu hôm nay", subtitle: "+8% so kế hoạch",   chartType: "kpi",        gridX: 0,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "static.demo", providerId: "mock", paramsTemplate: '{"metric":"revenue_day"}',   visualConfig: '{"color":"green"}',  filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_rev_month", title: "Doanh thu tháng",   subtitle: "₫ 42.3B",           chartType: "kpi",        gridX: 3,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "static.demo", providerId: "mock", paramsTemplate: '{"metric":"revenue_month"}', visualConfig: '{"color":"blue"}',   filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_cost",      title: "Chi phí tháng",     subtitle: "₫ 38.1B",           chartType: "kpi",        gridX: 6,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "static.demo", providerId: "mock", paramsTemplate: '{"metric":"cost_month"}',    visualConfig: '{"color":"orange"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_profit",    title: "Lợi nhuận tháng",  subtitle: "+12.5%",             chartType: "kpi",        gridX: 9,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "static.demo", providerId: "mock", paramsTemplate: '{"metric":"profit_month"}',  visualConfig: '{"color":"purple"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "bar_rev_trend", title: "Doanh thu 12 tháng", subtitle: "",                  chartType: "bar_chart",  gridX: 0,  gridY: 2, gridW: 8, gridH: 5, operationPattern: "static.demo", providerId: "mock", paramsTemplate: '{"metric":"revenue","months":12}', visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "pie_rev_src",   title: "Nguồn doanh thu",   subtitle: "",                  chartType: "donut_chart",gridX: 8,  gridY: 2, gridW: 4, gridH: 5, operationPattern: "static.demo", providerId: "mock", paramsTemplate: '{"metric":"revenue_source"}',     visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },

  // ── Patient Flow ─────────────────────────────────────────────────────────────
  "patient-flow": {
    slug: "patient-flow",
    label: "Luồng bệnh nhân",
    tabs: [
      {
        id: "pf-tab-1", slug: "overview", label: "Tổng quan", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "kpi_admitted",   title: "Đang nhập viện",     subtitle: "Realtime",  chartType: "kpi",                  gridX: 0,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"status":"admitted"}',   visualConfig: '{"color":"blue"}',  filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_waiting",    title: "Đang chờ khám",      subtitle: "",          chartType: "kpi",                  gridX: 3,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"status":"waiting"}',    visualConfig: '{"color":"amber"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_discharged", title: "Xuất viện hôm nay",  subtitle: "",          chartType: "kpi",                  gridX: 6,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"status":"discharged"}', visualConfig: '{"color":"green"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_avg_los",    title: "LOS trung bình",     subtitle: "ngày",      chartType: "kpi",                  gridX: 9,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"metric":"avg_los"}',    visualConfig: '{"color":"cyan"}',  filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "flow_stages",    title: "Luồng điều trị",     subtitle: "",          chartType: "patient_flow_stages",  gridX: 0,  gridY: 2, gridW: 12, gridH: 4, operationPattern: "patient.list",  providerId: "hdos-rest",   paramsTemplate: "{}",                      visualConfig: "{}",                filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "alert_clinical", title: "Cảnh báo lâm sàng",  subtitle: "",          chartType: "alert_list",           gridX: 0,  gridY: 6, gridW: 5, gridH: 5, operationPattern: "alerts.stream",  providerId: "signalr-hub", paramsTemplate: "{}",                      visualConfig: "{}",                filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "area_admits",    title: "Nhập/Xuất viện",     subtitle: "7 ngày",    chartType: "area_chart",           gridX: 5,  gridY: 6, gridW: 7, gridH: 5, operationPattern: "patient.list",   providerId: "hdos-rest",   paramsTemplate: '{"days":7,"groupBy":"day"}', visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
      {
        id: "pf-tab-2", slug: "risk", label: "Phân tầng nguy cơ", sortOrder: 1, isDefault: false,
        widgets: [
          { widgetKey: "risk_tiers",    title: "Nguy cơ theo khoa",  subtitle: "",          chartType: "risk_tiers",           gridX: 0, gridY: 0, gridW: 6, gridH: 5, operationPattern: "patient.risk",   providerId: "hdos-rest",   paramsTemplate: "{}",               visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "news2_main",    title: "NEWS2 Score",         subtitle: "",          chartType: "news2_bars",           gridX: 6, gridY: 0, gridW: 6, gridH: 5, operationPattern: "patient.vitals", providerId: "hdos-rest",   paramsTemplate: "{}",               visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "tl_events",     title: "Sự kiện lâm sàng",   subtitle: "",          chartType: "timeline_vertical",    gridX: 0, gridY: 5, gridW: 4, gridH: 6, operationPattern: "patient.risk",   providerId: "hdos-rest",   paramsTemplate: "{}",               visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "table_risk",    title: "Danh sách nguy cơ",  subtitle: "",          chartType: "simple_table",         gridX: 4, gridY: 5, gridW: 8, gridH: 6, operationPattern: "patient.risk",   providerId: "hdos-rest",   paramsTemplate: '{"severity":"high"}', visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },

  // ── Bed Management ────────────────────────────────────────────────────────────
  "bed-management": {
    slug: "bed-management",
    label: "Quản lý giường",
    tabs: [
      {
        id: "bm-tab-1", slug: "main", label: "Tổng quan", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "dd_ward",       title: "Lọc khoa",           subtitle: "",       chartType: "filter_dropdown",  gridX: 0,  gridY: 0, gridW: 3,  gridH: 2, operationPattern: "",             providerId: "",          paramsTemplate: "{}", visualConfig: '{"options":["ICU","Hồi sức","Nội tổng hợp","Ngoại","Sản","Nhi","Tim mạch"]}', filterBindings: [],            interactions: "{}", filterKey: "ward_filter" },
          { widgetKey: "kpi_total",     title: "Tổng giường",        subtitle: "toàn viện",  chartType: "kpi",          gridX: 3,  gridY: 0, gridW: 3,  gridH: 2, operationPattern: "bed.status",   providerId: "hdos-rest", paramsTemplate: '{"metric":"total"}',    visualConfig: '{"color":"blue"}',   filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_occupied",  title: "Đang sử dụng",       subtitle: "",           chartType: "kpi",          gridX: 6,  gridY: 0, gridW: 3,  gridH: 2, operationPattern: "bed.status",   providerId: "hdos-rest", paramsTemplate: '{"status":"occupied"}', visualConfig: '{"color":"orange"}', filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "gauge_occ",     title: "Công suất (%)",      subtitle: "",           chartType: "gauge",        gridX: 9,  gridY: 0, gridW: 3,  gridH: 2, operationPattern: "bed.occupancy",providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: '{"max":100}',        filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "bed_grid_main", title: "Sơ đồ giường bệnh",  subtitle: "",           chartType: "bed_grid",     gridX: 0,  gridY: 2, gridW: 8,  gridH: 6, operationPattern: "bed.status",   providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: "{}",                 filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "prog_wards",    title: "Công suất theo khoa","subtitle": "",         chartType: "progress_rows",gridX: 8,  gridY: 2, gridW: 4,  gridH: 6, operationPattern: "bed.occupancy",providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: '{"showFraction":true}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "room_grid",     title: "Sơ đồ phòng",        subtitle: "",           chartType: "room_status_grid",gridX: 0,gridY: 8, gridW: 12, gridH: 4, operationPattern: "bed.status",  providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: "{}",                 filterBindings: ["ward_filter"], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },

  // ── Vitals Monitor ────────────────────────────────────────────────────────────
  "vitals-monitor": {
    slug: "vitals-monitor",
    label: "Giám sát sinh hiệu",
    tabs: [
      {
        id: "vm-tab-1", slug: "realtime", label: "Realtime", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "kpi_hr",     title: "Nhịp tim TB",    subtitle: "bpm",  chartType: "kpi",        gridX: 0,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"hr"}',   visualConfig: '{"color":"red"}',    filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_spo2",   title: "SpO2 TB",        subtitle: "%",    chartType: "kpi",        gridX: 3,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"spo2"}', visualConfig: '{"color":"blue"}',   filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_temp",   title: "Nhiệt độ TB",    subtitle: "°C",   chartType: "kpi",        gridX: 6,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"temp"}', visualConfig: '{"color":"orange"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_bp",     title: "Huyết áp TB",    subtitle: "mmHg", chartType: "kpi",        gridX: 9,  gridY: 0, gridW: 3, gridH: 2, operationPattern: "vitals.realtime", providerId: "signalr-hub", paramsTemplate: '{"metric":"bp"}',   visualConfig: '{"color":"purple"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "line_hr",    title: "Nhịp tim 24h",   subtitle: "",     chartType: "line_chart",  gridX: 0,  gridY: 2, gridW: 6, gridH: 5, operationPattern: "patient.vitals",  providerId: "hdos-rest",   paramsTemplate: '{"metric":"hr","hours":24}', visualConfig: '{"color":"#ef4444"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "line_spo2",  title: "SpO2 24h",       subtitle: "",     chartType: "area_chart",  gridX: 6,  gridY: 2, gridW: 6, gridH: 5, operationPattern: "patient.vitals",  providerId: "hdos-rest",   paramsTemplate: '{"metric":"spo2","hours":24}', visualConfig: '{"color":"#3b82f6"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "news2_vital",title: "NEWS2 Score",     subtitle: "",     chartType: "news2_bars",  gridX: 0,  gridY: 7, gridW: 6, gridH: 5, operationPattern: "patient.vitals",  providerId: "hdos-rest",   paramsTemplate: "{}", visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "alert_vital",title: "Cảnh báo sinh hiệu", subtitle: "", chartType: "alert_list",  gridX: 6,  gridY: 7, gridW: 6, gridH: 5, operationPattern: "alerts.stream",   providerId: "signalr-hub", paramsTemplate: '{"category":"vitals"}', visualConfig: "{}", filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },

  // ── Patient Exam ──────────────────────────────────────────────────────────────
  "patient-exam": {
    slug: "patient-exam",
    label: "Khám bệnh",
    tabs: [
      {
        id: "pe-tab-1", slug: "main", label: "Phòng khám", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "search_pt",     title: "Tìm bệnh nhân",     subtitle: "",          chartType: "filter_search",    gridX: 0, gridY: 0, gridW: 4,  gridH: 2, operationPattern: "",              providerId: "",          paramsTemplate: "{}", visualConfig: '{"placeholder":"Nhập tên / mã BN..."}', filterBindings: [],             interactions: "{}", filterKey: "patient_search" },
          { widgetKey: "dd_dept",       title: "Lọc phòng khám",    subtitle: "",          chartType: "filter_dropdown",  gridX: 4, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "",              providerId: "",          paramsTemplate: "{}", visualConfig: '{"options":["Nội","Ngoại","Sản","Nhi","Tim mạch","Thần kinh"]}', filterBindings: [], interactions: "{}", filterKey: "dept_filter" },
          { widgetKey: "kpi_waiting",   title: "Đang chờ",          subtitle: "bệnh nhân", chartType: "kpi",              gridX: 7, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"status":"waiting"}',  visualConfig: '{"color":"orange"}', filterBindings: ["dept_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_done",      title: "Đã khám",           subtitle: "hôm nay",   chartType: "kpi",              gridX: 10,gridY: 0, gridW: 2,  gridH: 2, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"status":"done"}',     visualConfig: '{"color":"green"}',  filterBindings: ["dept_filter"], interactions: "{}", filterKey: "" },
          { widgetKey: "table_queue",   title: "Danh sách chờ khám","subtitle": "",        chartType: "advanced_table",   gridX: 0, gridY: 2, gridW: 8,  gridH: 7, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"status":"waiting"}',  visualConfig: "{}", filterBindings: ["dept_filter","patient_search"], interactions: "{}", filterKey: "" },
          { widgetKey: "bar_by_hour",   title: "Phân bố lượt khám", subtitle: "theo giờ", chartType: "bar_chart",        gridX: 8, gridY: 2, gridW: 4,  gridH: 7, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"groupBy":"hour"}',    visualConfig: "{}", filterBindings: ["dept_filter"], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },

  // Alias slugs for backward compat with HDOS menu
  inpatient: {
    slug: "inpatient",
    label: "Nội trú",
    tabs: [
      {
        id: "ip-tab-1", slug: "main", label: "Tổng quan", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "kpi_ip_total",    title: "Tổng bệnh nhân nội trú",subtitle: "",        chartType: "kpi",           gridX: 0, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"type":"inpatient"}', visualConfig: '{"color":"blue"}',   filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_ip_new",      title: "Nhập viện hôm nay",    subtitle: "",        chartType: "kpi",           gridX: 3, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"status":"admitted","today":true}', visualConfig: '{"color":"green"}',  filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_ip_out",      title: "Xuất viện hôm nay",    subtitle: "",        chartType: "kpi",           gridX: 6, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"status":"discharged","today":true}', visualConfig: '{"color":"orange"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_ip_los",      title: "LOS trung bình",       subtitle: "ngày",    chartType: "kpi",           gridX: 9, gridY: 0, gridW: 3,  gridH: 2, operationPattern: "patient.list",  providerId: "hdos-rest", paramsTemplate: '{"metric":"avg_los"}',  visualConfig: '{"color":"purple"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "bed_grid_ip",     title: "Sơ đồ giường bệnh",   subtitle: "",        chartType: "bed_grid",      gridX: 0, gridY: 2, gridW: 8,  gridH: 6, operationPattern: "bed.status",    providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: "{}",                 filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "prog_ip_cap",     title: "Công suất khoa",       subtitle: "",        chartType: "progress_rows", gridX: 8, gridY: 2, gridW: 4,  gridH: 6, operationPattern: "bed.occupancy", providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: '{"showFraction":true}', filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },

  // ── Surgery / OR ──────────────────────────────────────────────────────────────
  surgery: {
    slug: "surgery",
    label: "Phẫu thuật",
    tabs: [
      {
        id: "sx-tab-1", slug: "main", label: "Phòng mổ", sortOrder: 0, isDefault: true,
        widgets: [
          { widgetKey: "kpi_sx_active", title: "Đang phẫu thuật",   subtitle: "",         chartType: "kpi",              gridX: 0, gridY: 0, gridW: 3, gridH: 2, operationPattern: "emergency.triage", providerId: "hdos-rest", paramsTemplate: '{"status":"active"}',  visualConfig: '{"color":"blue"}',   filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_sx_done",   title: "Hoàn thành hôm nay","subtitle": "",       chartType: "kpi",              gridX: 3, gridY: 0, gridW: 3, gridH: 2, operationPattern: "emergency.triage", providerId: "hdos-rest", paramsTemplate: '{"status":"done"}',    visualConfig: '{"color":"green"}',  filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_sx_sched",  title: "Lịch mổ hôm nay",  subtitle: "",         chartType: "kpi",              gridX: 6, gridY: 0, gridW: 3, gridH: 2, operationPattern: "emergency.triage", providerId: "hdos-rest", paramsTemplate: '{"status":"scheduled"}',visualConfig: '{"color":"orange"}', filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "kpi_sx_delay",  title: "Trễ lịch",          subtitle: "",         chartType: "kpi",              gridX: 9, gridY: 0, gridW: 3, gridH: 2, operationPattern: "emergency.triage", providerId: "hdos-rest", paramsTemplate: '{"status":"delayed"}', visualConfig: '{"color":"red"}',    filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "or_grid",       title: "Phòng mổ",           subtitle: "",         chartType: "room_status_grid", gridX: 0, gridY: 2, gridW: 8, gridH: 5, operationPattern: "emergency.triage", providerId: "hdos-rest", paramsTemplate: "{}",                   visualConfig: "{}",                 filterBindings: [], interactions: "{}", filterKey: "" },
          { widgetKey: "bar_sx_trend",  title: "Lịch mổ 7 ngày",    subtitle: "",         chartType: "bar_chart",        gridX: 8, gridY: 2, gridW: 4, gridH: 5, operationPattern: "emergency.triage", providerId: "hdos-rest", paramsTemplate: '{"days":7}',           visualConfig: "{}",                 filterBindings: [], interactions: "{}", filterKey: "" },
        ],
      },
    ],
  },
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const layout = LAYOUTS[slug];

  if (!layout) {
    return NextResponse.json({ error: `Module "${slug}" not found` }, { status: 404 });
  }

  return NextResponse.json(layout);
}
