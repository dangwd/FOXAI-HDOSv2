// SDUI types cho GET /dm/pages/{code} — DataMatchingService (doc 48)

export type SduiActionVariant = "primary" | "default" | "danger";

export interface SduiAction {
  label:   string;
  variant: SduiActionVariant;
  color:   string | null;
}

export interface SduiRow {
  components: SduiComponent[];
}

export interface SduiPage {
  code:        string;
  title:       string;
  badge:       string | null;
  live:        boolean;
  subtitle:    string | null;
  actions:     SduiAction[];
  rows:        SduiRow[];
  generatedAt: string;   // ISO 8601 UTC
}

// ─── Component union (discriminator: "type") ──────────────────────────────────

export type SduiComponent =
  | KpiCardComponent
  | ProgressListComponent
  | AlertListComponent
  | FlowPipelineComponent
  | ChartPieComponent;

interface BaseComponent {
  span: number | null;   // 1..24, null = full width (24)
}

// KpiCard
export interface KpiCardProps {
  title:     string;
  value:     number | string;
  accent:    string | null;
  hint:      string | null;
  hintColor: string | null;
}
export interface KpiCardComponent extends BaseComponent {
  type:  "KpiCard";
  props: KpiCardProps;
}

// ProgressList
export interface SduiProgressItem {
  label:          string;
  value:          number;
  secondaryValue: number | null;
  color:          string | null;
}
export interface SduiFooterAction {
  label:   string;
  variant: string;
}
export interface ProgressListProps {
  title:         string;
  headerAction:  string | null;
  maxValue:      number;
  items:         SduiProgressItem[];
  footerActions: SduiFooterAction[] | null;
}
export interface ProgressListComponent extends BaseComponent {
  type:  "ProgressList";
  props: ProgressListProps;
}

// AlertList
export type AlertSeverity = "critical" | "warning" | "info";
export interface SduiAlertItem {
  code:     string;
  text:     string;
  patient:  string;
  dept:     string;
  time:     string;
  severity: AlertSeverity;
}
export interface AlertListProps {
  title:         string;
  realtimeBadge: boolean;
  maxHeight:     number | null;
  totalCount:    number;
  items:         SduiAlertItem[];
}
export interface AlertListComponent extends BaseComponent {
  type:  "AlertList";
  props: AlertListProps;
}

// FlowPipeline
export interface SduiFlowStage {
  label: string;
  value: number;
  color: string | null;
}
export interface FlowPipelineProps {
  title:  string;
  footer: string | null;
  stages: SduiFlowStage[];
}
export interface FlowPipelineComponent extends BaseComponent {
  type:  "FlowPipeline";
  props: FlowPipelineProps;
}

// ChartPie
export interface ChartPieDataPoint {
  label: string;
  value: number;
}
export interface ChartPieProps {
  title:   string;
  height:  number | null;
  variant: "pie" | "donut" | null;
  legend:  boolean;
  data:    ChartPieDataPoint[];
  colors:  string[] | null;
}
export interface ChartPieComponent extends BaseComponent {
  type:  "ChartPie";
  props: ChartPieProps;
}

// API envelope
export interface SduiApiResponse<T> {
  success: boolean;
  data:    T | null;
  error:   { code: string; message: string } | null;
}
