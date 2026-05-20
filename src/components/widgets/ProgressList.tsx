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
  headerAction?: string;
  /** Hiển thị chip xanh "Realtime" ở góc trên phải header */
  realtimeBadge?: boolean;
  items: ProgressItem[];
  maxValue?: number;
  /** Chế độ capacity: bar = value/secondaryValue, hiển thị "value/secondaryValue  pct%" */
  showFraction?: boolean;
  footerActions?: FooterAction[];
  loading?: boolean;
  sse?: SSEConfig;
}

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

export function ProgressList({ title, headerAction, realtimeBadge, items, maxValue = 100, showFraction, footerActions, loading = false, sse }: ProgressListProps) {
  const { data: live } = useSSE<{ items: ProgressItem[] }>(sse);
  const displayItems = live?.items ?? items;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] h-full flex flex-col">
      {title && (
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
            {title}
          </p>
          {realtimeBadge ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Realtime
            </span>
          ) : headerAction ? (
            <button className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
              {headerAction}
            </button>
          ) : null}
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-3" style={{ maxHeight: 480 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${SK} h-2.5 w-36 shrink-0`} />
                <div className="flex-1 h-2 rounded-sm bg-gray-100 dark:bg-[#30363d] overflow-hidden">
                  <div className={`${SK} h-full`} style={{ width: `${30 + i * 12}%` }} />
                </div>
                <div className={`${SK} h-2 w-16 shrink-0`} />
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
            displayRight = `${item.value}${item.suffix ?? '%'}`;
          }

          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-40 shrink-0 text-gray-600 dark:text-[#8b949e] truncate text-[11px]">
                {item.label}
              </span>
              <div className="flex-1">
                <div className="h-2 rounded-sm bg-gray-100 dark:bg-[#30363d] overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{ width: `${barPct}%`, background: item.color ?? '#52c41a' }}
                  />
                </div>
              </div>
              <div className="w-24 shrink-0 text-right text-gray-500 dark:text-[#8b949e] text-[10px] tabular-nums">
                {displayRight}
                {showFraction && item.secondaryValue != null && (
                  <span className="ml-1 text-gray-400 dark:text-[#6e7681]">{barPct}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {footerActions && footerActions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 dark:border-[#30363d]">
          {footerActions.map((action, i) => {
            if (action.variant === 'link') {
              return (
                <button key={i} className="text-xs text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
                  {action.label}
                </button>
              );
            }
            return (
              <button
                key={i}
                className="ml-auto text-xs px-3 py-1 rounded-md border border-gray-200 dark:border-[#30363d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
                style={action.color ? { color: action.color, borderColor: action.color + '55' } : undefined}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
