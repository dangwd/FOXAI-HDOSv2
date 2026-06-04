"use client";

import { useSSE } from "@/core/sse/useSSE";
import type { SSEConfig } from "@/core/sse/types";

interface AlertItem {
  code: string;
  text: string;
  patient?: string;
  dept?: string;
  time: string;
  severity?: "critical" | "warning" | "info";
}

interface AlertListProps {
  title?: string;
  totalCount?: number;
  items: AlertItem[];
  loading?: boolean;
  realtimeBadge?: boolean;
  sse?: SSEConfig;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-400",
  warning:  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  info:     "bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-400",
};

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function AlertList({
  title = "Cảnh báo",
  totalCount,
  items,
  loading = false,
  realtimeBadge,
  sse,
}: AlertListProps) {
  const { data: live } = useSSE<{ items: AlertItem[]; totalCount: number }>(sse);
  const displayItems      = live?.items      ?? items;
  const displayTotalCount = live?.totalCount ?? totalCount;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#30363d] shrink-0">
        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {realtimeBadge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded
              bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          {loading ? (
            <div className={`${SK} h-4 w-14 rounded-full`} />
          ) : displayTotalCount !== undefined ? (
            <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 px-2 py-0.5 rounded-full">
              {displayTotalCount} cảnh báo
            </span>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-gray-100 dark:divide-[#21262d]">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-start gap-3 px-4 py-3">
                <div className={`${SK} h-5 w-9 rounded-md mt-0.5 shrink-0`} />
                <div className="flex-1 space-y-1.5">
                  <div className={`${SK} h-2.5 w-full`} />
                  <div className={`${SK} h-2 w-2/3`} />
                </div>
                <div className={`${SK} h-2 w-10 shrink-0 mt-1`} />
              </div>
            ))
          : displayItems.map((item, idx) => {
              const badgeClass = SEVERITY_BADGE[item.severity ?? "info"] ?? SEVERITY_BADGE.info;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors"
                >
                  <span className={`mt-0.5 shrink-0 inline-flex items-center justify-center rounded-md px-1.5 py-0.5
                    text-[10px] font-bold leading-none min-w-[2.25rem] text-center ${badgeClass}`}>
                    {item.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-800 dark:text-[#e6edf3] leading-snug m-0">
                      {item.text}
                    </p>
                    {item.patient && (
                      <p className="text-[10px] text-gray-500 dark:text-[#8b949e] leading-tight m-0 mt-0.5">
                        {item.patient}
                      </p>
                    )}
                    {item.dept && (
                      <p className="text-[10px] text-gray-400 dark:text-[#6e7681] leading-tight m-0">
                        {item.dept}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-400 dark:text-[#6e7681] whitespace-nowrap mt-0.5">
                    {item.time}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
}
