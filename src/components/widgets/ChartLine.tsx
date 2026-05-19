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

const DEFAULT_COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1"];

export function ChartLine({
  data,
  dataKey = "value",
  series,
  title,
  height = 280,
  color = "#1677ff",
  legend = false,
  unit,
}: BaseChartProps) {
  return (
    <div className="rounded-lg p-4 border border-gray-200 bg-white">
      {title && (
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={height}>
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
  );
}
