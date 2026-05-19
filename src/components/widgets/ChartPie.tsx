"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BaseChartProps } from "@/types/chart";

const DEFAULT_COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

interface ChartPieProps extends Omit<BaseChartProps, "series"> {
  /** "donut" vẽ innerRadius, "pie" vẽ đầy */
  variant?: "pie" | "donut";
  /** Màu từng slice theo thứ tự */
  colors?: string[];
}

export function ChartPie({
  data,
  dataKey = "value",
  title,
  height = 280,
  legend = true,
  unit,
  variant = "donut",
  colors = DEFAULT_COLORS,
}: ChartPieProps) {
  const innerRadius = variant === "donut" ? "55%" : 0;

  return (
    <div className="rounded-lg p-4 border border-gray-200 bg-white">
      {title && (
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="75%"
            paddingAngle={variant === "donut" ? 3 : 0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [`${v ?? ""}${unit ?? ""}`, ""]}
            contentStyle={{ fontSize: 12 }}
          />
          {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
