export interface ChartDataPoint {
  label: string;
  value: number;
  /** Cho multi-series: thêm các key tùy ý, ví dụ { label, revenue, cost } */
  [key: string]: string | number;
}

/** Props chung cho tất cả chart widget */
export interface BaseChartProps {
  data: ChartDataPoint[];
  /** Key lấy giá trị — mặc định "value" */
  dataKey?: string;
  /** Multi-series: nhiều key + màu tương ứng */
  series?: { key: string; color: string; name?: string }[];
  title?: string;
  height?: number;
  color?: string;
  /** Hiện legend */
  legend?: boolean;
  /** Định dạng trục Y / tooltip */
  unit?: string;
}
