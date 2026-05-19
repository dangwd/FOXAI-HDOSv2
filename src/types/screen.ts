import type { SignalRConfig } from "@/core/signalr/types";

/** Một component trong màn hình — backend kiểm soát toàn bộ */
export interface ComponentConfig {
  type: string;
  props?: Record<string, unknown>;
  /** antd Col span (1-24). Mặc định chia đều theo số component trong row */
  span?: number;
  /** Nếu có, component tự kết nối SignalR độc lập và nhận live data */
  signalR?: SignalRConfig;
}

export interface RowConfig {
  gutter?: number;
  components: ComponentConfig[];
}

export interface ScreenConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  rows: RowConfig[];
}
