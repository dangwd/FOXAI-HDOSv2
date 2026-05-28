import type { WidgetCategory } from "@/infrastructure/http/adminApi";

export const CATEGORY_ORDER: WidgetCategory[] = [
  "visualization",
  "healthcare",
  "filter",
  "layout",
  "ai",
];

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  visualization: "Trực quan hóa",
  healthcare:    "Y tế",
  filter:        "Bộ lọc",
  layout:        "Bố cục",
  ai:            "AI",
};

export const CATEGORY_COLOR: Record<WidgetCategory, string> = {
  visualization: "blue",
  healthcare:    "green",
  filter:        "orange",
  layout:        "purple",
  ai:            "cyan",
};

export const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  kpi:                  { w: 3,  h: 2 },
  kpi_grid:             { w: 6,  h: 3 },
  line_chart:           { w: 6,  h: 4 },
  bar_chart:            { w: 6,  h: 4 },
  area_chart:           { w: 6,  h: 4 },
  pie_chart:            { w: 4,  h: 4 },
  donut_chart:          { w: 4,  h: 4 },
  gauge:                { w: 4,  h: 4 },
  heatmap:              { w: 8,  h: 5 },
  funnel:               { w: 6,  h: 5 },
  scatter:              { w: 6,  h: 4 },
  simple_table:         { w: 8,  h: 5 },
  advanced_table:       { w: 12, h: 6 },
  pivot_table:          { w: 12, h: 6 },
  progress_rows:        { w: 6,  h: 4 },
  alert_list:           { w: 6,  h: 5 },
  flow_steps:           { w: 12, h: 3 },
  patient_flow_stages:  { w: 12, h: 4 },
  risk_tiers:           { w: 6,  h: 4 },
  bed_grid:             { w: 8,  h: 5 },
  room_status_grid:     { w: 6,  h: 4 },
  map_pins:             { w: 8,  h: 5 },
  timeline_vertical:    { w: 4,  h: 6 },
  news2_bars:           { w: 6,  h: 4 },
  filter_dropdown:      { w: 3,  h: 2 },
  filter_date_range:    { w: 4,  h: 2 },
  filter_slider:        { w: 3,  h: 2 },
  filter_search:        { w: 3,  h: 2 },
  text_widget:          { w: 6,  h: 2 },
  chat_panel:           { w: 6,  h: 8 },
};
