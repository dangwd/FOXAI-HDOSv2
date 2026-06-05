/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import { KpiCard } from "@/components/widgets/KpiCard";
import { DataTable } from "@/components/widgets/DataTable";
import { AlertBanner } from "@/components/widgets/AlertBanner";
import { ChartBar } from "@/components/widgets/ChartBar";
import { ChartLine } from "@/components/widgets/ChartLine";
import { ChartArea } from "@/components/widgets/ChartArea";
import { ChartPie } from "@/components/widgets/ChartPie";
import { ProgressList } from "@/components/widgets/ProgressList";
import { BulletList } from "@/components/widgets/BulletList";
import { StatsSummary } from "@/components/widgets/StatsSummary";
import { FlowPipeline } from "@/components/widgets/FlowPipeline";
import { AlertList } from "@/components/widgets/AlertList";
import { WardBedGrid } from "@/components/widgets/WardBedGrid";
import { OrRoomGrid } from "@/components/widgets/OrRoomGrid";
import { VoiceEMR } from "@/components/widgets/VoiceEMR";
import { BaoCaoKhoaWidget } from "@/components/widgets/BaoCaoKhoaWidget";
import { ReminderCard } from "@/components/widgets/ReminderCard";
import { ProjectListCard } from "@/components/widgets/ProjectListCard";
import { TeamCollaborationCard } from "@/components/widgets/TeamCollaborationCard";
import { TimeTrackerCard } from "@/components/widgets/TimeTrackerCard";

export const REGISTRY: Record<string, ComponentType<any>> = {
  KpiCard,
  DataTable,
  AlertBanner,
  AlertList,
  ChartBar,
  ChartLine,
  ChartArea,
  ChartPie,
  ProgressList,
  BulletList,
  StatsSummary,
  FlowPipeline,
  WardBedGrid,
  OrRoomGrid,
  VoiceEMR,
  BaoCaoKhoaWidget,
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
  },
} as const;
