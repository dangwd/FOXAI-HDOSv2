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
import { useSSE } from "@/core/sse/useSSE";
import type { SSEConfig } from "@/core/sse/types";

const DEFAULT_COLORS = ["#059669", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

interface ChartPieProps extends Omit<BaseChartProps, "series"> {
  variant?: "pie" | "donut";
  colors?: string[];
  sse?: SSEConfig;
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ChartPie({
  data,
  dataKey = "value",
  title,
  height = 280,
  legend = true,
  unit,
  variant = "donut",
  colors = DEFAULT_COLORS,
  loading = false,
  sse,
}: ChartPieProps) {
  const { data: live } = useSSE<{ data: typeof data }>(sse);
  const displayData = live?.data ?? data;
  const innerRadius = variant === "donut" ? "55%" : 0;

  if (loading) {
    const circleSize = Math.round(height * 0.6);
    return (
      <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full">
        {title && <div className={`${SK} h-3 w-32 mb-3`} />}
        <div className="flex justify-center items-center" style={{ height }}>
          <div className={`${SK} rounded-full`} style={{ width: circleSize, height: circleSize }} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      {title && (
        <p className="text-[11px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-3 shrink-0">
          {title}
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              dataKey={dataKey}
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius="65%"
              paddingAngle={variant === "donut" ? 3 : 0}
            >
              {displayData.map((_, i) => (
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
    </div>
  );
}
