"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

export interface ScatterDataPoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
  [key: string]: unknown;
}

interface ChartScatterProps {
  data: ScatterDataPoint[];
  xField?: string;
  yField?: string;
  zField?: string;
  title?: string;
  color?: string;
  xUnit?: string;
  yUnit?: string;
  loading?: boolean;
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ChartScatter({
  data,
  xField = "x",
  yField = "y",
  zField,
  title,
  color = "#059669",
  xUnit,
  yUnit,
  loading = false,
}: ChartScatterProps) {
  if (loading) {
    return (
      <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full">
        {title && <div className={`${SK} h-3 w-32 mb-3`} />}
        <div className={`${SK} w-full flex-1`} style={{ minHeight: 160 }} />
      </div>
    );
  }

  // Normalise: map xField/yField → recharts expects { x, y } keys on the Scatter dataKey
  const normalised = data.map((item) => ({
    x: Number(item[xField] ?? 0),
    y: Number(item[yField] ?? 0),
    ...(zField ? { z: Number(item[zField] ?? 1) } : {}),
    name: item.name ?? String(item[xField] ?? ""),
  }));

  return (
    <div className="rounded-2xl p-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      {title && (
        <p className="text-[11px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider mb-3 shrink-0">
          {title}
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="x"
              type="number"
              name={xField}
              tick={{ fontSize: 11 }}
              unit={xUnit}
            />
            <YAxis
              dataKey="y"
              type="number"
              name={yField}
              tick={{ fontSize: 11 }}
              unit={yUnit}
            />
            {zField && <ZAxis dataKey="z" range={[40, 400]} />}
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ fontSize: 12 }}
              formatter={(v, name) => [`${v ?? ""}`, name as string]}
            />
            <Scatter data={normalised} fill={color} fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
