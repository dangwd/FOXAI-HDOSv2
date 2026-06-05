"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BaseChartProps } from "@/types/chart";

const DEFAULT_COLORS = ["#059669", "#52c41a", "#faad14", "#ff4d4f", "#722ed1"];

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ChartLine({
  data,
  dataKey = "value",
  series,
  title,
  height = 220,
  color = "#059669",
  legend = false,
  unit,
  loading = false,
}: BaseChartProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full">
        {title && <div className={`${SK} h-3 w-32 mb-3`} />}
        <div className={`${SK} w-full flex-1`} style={{ height }} />
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
          <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit={unit} />
            <Tooltip
              formatter={(v) => [`${v ?? ""}${unit ?? ""}`, ""]}
              contentStyle={{ fontSize: 12 }}
            />
            {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}

            {series ? (
              series.map((s, i) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name ?? s.key}
                  stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))
            ) : (
              <Line dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
