"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BaseChartProps } from "@/types/chart";

const DEFAULT_COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1"];

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ChartArea({
  data,
  dataKey = "value",
  series,
  title,
  height = 220,
  color = "#1677ff",
  legend = false,
  unit,
  loading = false,
}: BaseChartProps) {
  if (loading) {
    return (
      <div className="rounded-lg p-4 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] h-full">
        {title && <div className={`${SK} h-3 w-32 mb-3`} />}
        <div className={`${SK} w-full`} style={{ height }} />
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] h-full flex flex-col">
      {title && (
        <p className="text-[11px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-3 shrink-0">
          {title}
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <defs>
              {series ? (
                series.map((s, i) => {
                  const c = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                  return (
                    <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  );
                })
              ) : (
                <linearGradient id="grad-default" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit={unit} />
            <Tooltip
              formatter={(v) => [`${v ?? ""}${unit ?? ""}`, ""]}
              contentStyle={{ fontSize: 12 }}
            />
            {legend && <Legend wrapperStyle={{ fontSize: 12 }} />}

            {series ? (
              series.map((s, i) => {
                const c = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                return (
                  <Area
                    key={s.key}
                    dataKey={s.key}
                    name={s.name ?? s.key}
                    stroke={c}
                    fill={`url(#grad-${s.key})`}
                    strokeWidth={2}
                  />
                );
              })
            ) : (
              <Area dataKey={dataKey} stroke={color} fill="url(#grad-default)" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
