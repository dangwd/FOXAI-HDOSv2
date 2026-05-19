"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BaseChartProps } from "@/types/chart";

export function ChartBar({
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
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit={unit} />
          <Tooltip
            formatter={(v) => [`${v ?? ""}${unit ?? ""}`, ""]}
            contentStyle={{ fontSize: 12 }}
          />
          {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}

          {series ? (
            series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name ?? s.key} fill={s.color} radius={[3, 3, 0, 0]} />
            ))
          ) : (
            <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
