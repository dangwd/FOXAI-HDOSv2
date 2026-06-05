"use client";

import { useSSE } from "@/core/sse/useSSE";
import type { SSEConfig } from "@/core/sse/types";

interface ProgressItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  secondaryColor?: string;
  suffix?: string;
}

interface FooterAction {
  label: string;
  variant?: "link" | "default";
  color?: string;
}

interface ProgressListProps {
  title?: string;
  /** Link shown on the right of the header (e.g. "Xem chi tiết →") */
  headerAction?: string;
  /** Green "● Realtime" chip in the header */
  realtimeBadge?: boolean;
  items: ProgressItem[];
  maxValue?: number;
  /** Show "value/secondaryValue  pct%" instead of just "pct%" */
  showFraction?: boolean;
  footerActions?: FooterAction[];
  loading?: boolean;
  sse?: SSEConfig;
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ProgressList({
  title,
  headerAction,
  realtimeBadge,
  items,
  maxValue = 100,
  showFraction,
  footerActions,
  loading = false,
  sse,
}: ProgressListProps) {
  const { data: live } = useSSE<{ items: ProgressItem[] }>(sse);
  const displayItems = live?.items ?? items;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm h-full flex flex-col">
      {/* Header */}
      {(title || realtimeBadge || headerAction) && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          {title && (
            <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
              {title}
            </p>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {realtimeBadge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded
                bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Realtime
              </span>
            )}
            {headerAction && (
              <button className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline transition-colors cursor-pointer">
                {headerAction}
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1.5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${SK} h-2.5 w-36 shrink-0`} />
                <div className="flex-1 h-2 rounded-sm bg-gray-100 dark:bg-[#30363d] overflow-hidden">
                  <div className={`${SK} h-full`} style={{ width: `${30 + i * 10}%` }} />
                </div>
                <div className={`${SK} h-2.5 w-8 shrink-0`} />
              </div>
            ))
          : displayItems.map((item, i) => {
              let barPct: number;
              let displayRight: string;

              if (showFraction && item.secondaryValue != null && item.secondaryValue > 0) {
                const pct = Math.round((item.value / item.secondaryValue) * 100);
                barPct = Math.min(pct, 100);
                displayRight = `${item.value}/${item.secondaryValue}`;
              } else {
                barPct = Math.min((item.value / maxValue) * 100, 100);
                displayRight = `${item.value}${item.suffix ?? "%"}`;
              }

              const barColor = item.color ?? (barPct >= 85 ? "#ff4d4f" : barPct >= 70 ? "#fa8c16" : "#52c41a");

              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-44 shrink-0 text-[11px] text-gray-700 dark:text-[#c9d1d9] truncate leading-none">
                    {item.label}
                  </span>
                  <div className="flex-1 h-2 rounded-sm bg-gray-100 dark:bg-[#30363d] overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{ width: `${barPct}%`, background: barColor }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums"
                    style={{ color: barColor }}>
                    {showFraction ? `${Math.round(barPct)}%` : displayRight}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Footer */}
      {footerActions && footerActions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100 dark:border-[#21262d] shrink-0">
          {footerActions.map((action, i) =>
            action.variant === "link" ? (
              <button
                key={i}
                className="text-xs transition-colors cursor-pointer"
                style={{ color: action.color ?? "#059669" }}
              >
                {action.label}
              </button>
            ) : (
              <button
                key={i}
                className="ml-auto text-xs px-3 py-1 rounded-md border border-gray-200 dark:border-[#30363d]
                  text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
                style={action.color ? { color: action.color, borderColor: `${action.color}55` } : undefined}
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
