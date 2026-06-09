/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import { KpiCard } from "@/components/widgets/KpiCard";
import { DataTable } from "@/components/widgets/DataTable";
import { AlertBanner } from "@/components/widgets/AlertBanner";
import { ChartBar } from "@/components/widgets/ChartBar";
import { ChartLine } from "@/components/widgets/ChartLine";
import { ChartArea } from "@/components/widgets/ChartArea";
import { ChartPie } from "@/components/widgets/ChartPie";
import { ChartScatter } from "@/components/widgets/ChartScatter";
import { ProgressList } from "@/components/widgets/ProgressList";
import { BulletList } from "@/components/widgets/BulletList";
import { StatsSummary } from "@/components/widgets/StatsSummary";
import { FlowPipeline } from "@/components/widgets/FlowPipeline";
import { AlertList } from "@/components/widgets/AlertList";
import { WardBedGrid } from "@/components/widgets/WardBedGrid";
import { OrRoomGrid } from "@/components/widgets/OrRoomGrid";
import { VoiceEMR } from "@/components/widgets/VoiceEMR";
import { BaoCaoKhoaWidget } from "@/components/widgets/BaoCaoKhoaWidget";
import { EmbedSduiPageWidget } from "@/components/widgets/EmbedSduiPage";
import { ReminderCard } from "@/components/widgets/ReminderCard";
import { ProjectListCard } from "@/components/widgets/ProjectListCard";
import { TeamCollaborationCard } from "@/components/widgets/TeamCollaborationCard";
import { TimeTrackerCard } from "@/components/widgets/TimeTrackerCard";

export const REGISTRY: Record<string, ComponentType<any>> = {
  // ── SDUI vocabulary (doc 57 §2) — BE Consumer được phép dùng ─────────────
  KpiCard,
  DataTable,
  AlertBanner,
  AlertList,
  ChartBar,
  ChartLine,
  ChartArea,
  ChartPie,
  ChartScatter,
  ProgressList,
  BulletList,
  StatsSummary,
  FlowPipeline,
  WardBedGrid,
  OrRoomGrid,
  VoiceEMR,
  BaoCaoKhoaWidget,
  embed_sdui_page: EmbedSduiPageWidget,  // doc 52 — nhúng chart qua Provider catalog
  // ── Internal dashboard widgets (không expose trong MANIFEST) ─────────────
  ReminderCard,
  ProjectListCard,
  TeamCollaborationCard,
  TimeTrackerCard,
};

export const MANIFEST = {
  version: "1.0",
  components: {
    KpiCard: {
      description: "Thẻ chỉ số KPI",
      props: {
        title:     { type: "string",  required: true },
        value:     { type: "any",     required: false },
        hint:      { type: "string",  required: false },
        hintColor: { type: "string",  required: false },
        accent:    { type: "string",  required: false, description: "CSS color — border trái + dot" },
        loading:   { type: "boolean", required: false },
      },
    },
    DataTable: {
      description: "Bảng dữ liệu generic",
      props: {
        columns: {
          type: "ColConfig[]", required: true,
          schema: {
            key:       { type: "string" },
            title:     { type: "string" },
            render:    { type: "enum", values: ["tag"] },
            tagColors: { type: "Record<string,string>" },
          },
        },
        data:     { type: "Record[]", required: true },
        pageSize: { type: "number",   required: false },
      },
    },
    AlertBanner: {
      description: "Banner thông báo",
      props: {
        message:     { type: "string",  required: true },
        description: { type: "string",  required: false },
        type:        { type: "enum",    values: ["success", "info", "warning", "error"] },
        showIcon:    { type: "boolean", required: false },
      },
    },
    ChartBar: {
      description: "Biểu đồ cột",
      props: {
        data:    { type: "ChartDataPoint[]", required: true, description: "[{ label, value }]" },
        series:  { type: "{ key, color, name? }[]", required: false, description: "Multi-series" },
        dataKey: { type: "string",  required: false, description: "Mặc định 'value'" },
        title:   { type: "string",  required: false },
        height:  { type: "number",  required: false, description: "Mặc định 280" },
        color:   { type: "string",  required: false, description: "Mặc định '#1677ff'" },
        legend:  { type: "boolean", required: false },
        unit:    { type: "string",  required: false, description: "Ký hiệu đơn vị, vd: '%', 'tr.'" },
      },
    },
    ChartLine: {
      description: "Biểu đồ đường — phù hợp trend theo thời gian",
      props: {
        data:    { type: "ChartDataPoint[]", required: true },
        series:  { type: "{ key, color, name? }[]", required: false },
        dataKey: { type: "string",  required: false },
        title:   { type: "string",  required: false },
        height:  { type: "number",  required: false },
        color:   { type: "string",  required: false },
        legend:  { type: "boolean", required: false },
        unit:    { type: "string",  required: false },
      },
    },
    ChartArea: {
      description: "Biểu đồ vùng — giống ChartLine nhưng có fill gradient",
      props: {
        data:    { type: "ChartDataPoint[]", required: true },
        series:  { type: "{ key, color, name? }[]", required: false },
        dataKey: { type: "string",  required: false },
        title:   { type: "string",  required: false },
        height:  { type: "number",  required: false },
        color:   { type: "string",  required: false },
        legend:  { type: "boolean", required: false },
        unit:    { type: "string",  required: false },
      },
    },
    ChartPie: {
      description: "Biểu đồ tròn / donut",
      props: {
        data:    { type: "ChartDataPoint[]", required: true, description: "[{ label, value }]" },
        dataKey: { type: "string",  required: false },
        title:   { type: "string",  required: false },
        height:  { type: "number",  required: false },
        legend:  { type: "boolean", required: false },
        unit:    { type: "string",  required: false },
        variant: { type: "enum",    values: ["pie", "donut"], required: false, description: "Mặc định 'donut'" },
        colors:  { type: "string[]", required: false, description: "Màu từng slice theo thứ tự" },
      },
    },
    ChartScatter: {
      description: "Biểu đồ phân tán (scatter plot)",
      props: {
        data:   { type: "ScatterDataPoint[]", required: true, description: "[{ x, y, z?, name?, ...extra }]" },
        xField: { type: "string",  required: false, description: "Mặc định 'x'" },
        yField: { type: "string",  required: false, description: "Mặc định 'y'" },
        zField: { type: "string",  required: false, description: "Tên field bubble size" },
        title:  { type: "string",  required: false },
        color:  { type: "string",  required: false, description: "Hex color — mặc định '#1677ff'" },
        xUnit:  { type: "string",  required: false },
        yUnit:  { type: "string",  required: false },
      },
    },
    ProgressList: {
      description: "Top-N theo metric — danh sách progress bar",
      props: {
        title:         { type: "string",  required: false },
        headerAction:  { type: "string",  required: false, description: "Label nút góc trên phải" },
        maxValue:      { type: "number",  required: true,  description: "Giá trị tối đa (100 = %, hoặc max item)" },
        items: {
          type: "ProgressItem[]", required: true,
          schema: {
            label:          { type: "string" },
            value:          { type: "number" },
            secondaryValue: { type: "number",  required: false },
            color:          { type: "string",  required: false, description: "Hex color bar" },
          },
        },
        footerActions: { type: "FooterAction[]", required: false },
      },
    },
    BulletList: {
      description: "Danh sách bullet với status màu sắc",
      props: {
        title:        { type: "string",  required: false },
        headerAction: { type: "string",  required: false },
        items: {
          type: "BulletItem[]", required: true,
          schema: {
            text:   { type: "string" },
            status: { type: "enum", values: ["active", "pending", "done", "critical"], required: false },
            badge:  { type: "string | number", required: false },
          },
        },
        footerActions: { type: "FooterAction[]", required: false },
      },
    },
    StatsSummary: {
      description: "Block thống kê tóm tắt dạng ngang — nhiều số liệu cạnh nhau",
      props: {
        title:    { type: "string",  required: false },
        subtitle: { type: "string",  required: false },
        items: {
          type: "StatItem[]", required: true,
          schema: {
            label: { type: "string" },
            value: { type: "number | string" },
            color: { type: "string", required: false, description: "Hex color — mặc định inherit" },
          },
        },
      },
    },
    FlowPipeline: {
      description: "Pipeline N stage — funnel/dòng chảy",
      props: {
        title:  { type: "string",  required: false },
        footer: { type: "string",  required: false },
        stages: {
          type: "FlowStage[]", required: true,
          schema: {
            label: { type: "string" },
            value: { type: "number" },
            color: { type: "string", required: false, description: "Hex — mặc định '#1677ff'" },
          },
        },
      },
    },
    AlertList: {
      description: "Danh sách cảnh báo realtime (severity-colored)",
      props: {
        title:         { type: "string",  required: false },
        realtimeBadge: { type: "boolean", required: false, description: "Hiện chấm xanh 'Realtime'" },
        maxHeight:     { type: "number",  required: false, description: "px — scroll nếu vượt" },
        totalCount:    { type: "number",  required: true },
        items: {
          type: "AlertItem[]", required: true,
          schema: {
            code:     { type: "string" },
            text:     { type: "string" },
            patient:  { type: "string" },
            dept:     { type: "string" },
            time:     { type: "string",  description: "Chuỗi giờ hiển thị, vd '14:23'" },
            severity: { type: "enum",    values: ["critical", "warning", "info"] },
          },
        },
      },
    },
    WardBedGrid: {
      description: "Grid giường bệnh theo khoa — bor (bed occupancy rate) màu theo ngưỡng",
      props: {
        title: { type: "string",  required: false },
        wards: {
          type: "WardRow[]", required: true,
          schema: {
            code:     { type: "string" },
            total:    { type: "number" },
            occupied: { type: "number" },
            checkout: { type: "number", required: false },
            cleaning: { type: "number", required: false },
            bor:      { type: "number", description: "Bed occupancy rate 0-100 (%)" },
          },
        },
      },
    },
    OrRoomGrid: {
      description: "Grid phòng mổ theo trạng thái",
      props: {
        title: { type: "string", required: false },
        rooms: {
          type: "OrRoomData[]", required: true,
          schema: {
            code:      { type: "string" },
            procedure: { type: "string",  required: false, description: "Tên ca phẫu thuật" },
            status:    { type: "enum",    values: ["active", "preparing", "cleaning", "available", "emergency"] },
            hint:      { type: "string",  required: false },
          },
        },
      },
    },
    VoiceEMR: {
      description: "Panel EMR voice input — panel-specific, liên hệ FE team trước khi dùng",
      props: {},
    },
    BaoCaoKhoaWidget: {
      description: "Báo cáo khoa — widget custom bệnh viện, liên hệ FE team trước khi dùng",
      props: {},
    },
    embed_sdui_page: {
      description: "Nhúng SduiPage từ DataContract hoặc Lakehouse chart vào trong page (doc 52)",
      props: {
        providerCode: { type: "string", required: true,  description: "Mã provider trong catalog, vd 'lakehouse'" },
        operationKey: { type: "string", required: true,  description: "Operation key, vd 'chart-page'" },
        params:       { type: "Record<string,string>", required: true,  description: "Path params, vd {code: 'finance-daily'}" },
        queryParams:  { type: "Record<string,string>", required: false, description: "Query string extra, vd {date: '2026-06-09'}" },
        height:       { type: "number",  required: false, description: "min-height px — mặc định 400" },
      },
    },
  },
} as const;
