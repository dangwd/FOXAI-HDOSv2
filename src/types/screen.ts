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

export interface ScreenAction {
  label: string;
  /** "primary" = filled, "default" = outlined, "dashed" = dashed border */
  variant?: "primary" | "default" | "dashed";
  color?: string;
}

export interface ScreenTab {
  id: string;
  label: string;
  rows: RowConfig[];
}

export interface ScreenConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  /** Hiển thị chấm xanh "Live" bên cạnh badge */
  live?: boolean;
  /** Các button hiển thị góc trên bên phải header */
  actions?: ScreenAction[];
  /** Nếu có tabs, renderer dùng Tabs thay vì rows trực tiếp */
  tabs?: ScreenTab[];
  rows?: RowConfig[];
}
