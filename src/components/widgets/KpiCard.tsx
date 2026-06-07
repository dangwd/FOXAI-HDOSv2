"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { useSSE } from "@/core/sse/useSSE";
import type { SSEConfig } from "@/core/sse/types";

interface KpiLiveData {
  value: string | number;
  hint?: string;
  hintColor?: string;
}

interface TrendInfo {
  isUp: boolean;
  label: string;
}

interface KpiCardProps {
  title: string;
  value?: ReactNode;
  hint?: ReactNode;
  hintColor?: string;
  loading?: boolean;
  className?: string;
  /** Accent color: draws a 3px left border and a matching dot next to the title */
  accent?: string;
  /** Trend indicator — shows arrow icon top-right + chip below value */
  trend?: TrendInfo;
  /** SSE config — khi có, giá trị live sẽ đè lên props tĩnh */
  sse?: SSEConfig;
}

function ArrowUpRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ArrowDownRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="7" x2="17" y2="17" />
      <polyline points="17 7 17 17 7 17" />
    </svg>
  );
}

export function KpiCard({
  title,
  value,
  hint,
  hintColor,
  loading = false,
  className,
  accent,
  trend,
  sse,
}: KpiCardProps): ReactNode {
  const { data: live } = useSSE<KpiLiveData>(sse);

  const displayValue     = live?.value     ?? value;
  const displayHint      = live?.hint      ?? hint;
  const displayHintColor = live?.hintColor ?? hintColor;

  const containerStyle: CSSProperties = accent
    ? { borderLeftWidth: 4, borderLeftColor: accent }
    : {};

  return (
    <div
      className={cn(
        "relative rounded-2xl px-5 py-4 border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden",
        className,
      )}
      style={containerStyle}
    >
      {/* Decorative accent blob — top-right depth */}
      {accent && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full"
          style={{ background: accent, opacity: 0.07 }}
        />
      )}

      {/* Trend icon — top-right */}
      {trend && !loading && (
        <div className={cn(
          "absolute top-3.5 right-4 w-8 h-8 rounded-xl flex items-center justify-center",
          trend.isUp
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        )}>
          {trend.isUp ? <ArrowUpRight /> : <ArrowDownRight />}
        </div>
      )}

      {/* Title row */}
      <p className="text-[10px] font-bold text-gray-400 dark:text-[#8b949e] uppercase tracking-widest m-0 mb-3 flex items-center gap-1.5 pr-10 leading-none">
        {accent && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: accent }}
          />
        )}
        {title}
      </p>

      {loading ? (
        <>
          <div className="animate-pulse bg-gray-200 dark:bg-[#30363d] rounded-lg h-10 w-28 mt-1" />
          <div className="animate-pulse bg-gray-200 dark:bg-[#30363d] rounded h-3 w-32 mt-3" />
        </>
      ) : (
        <>
          <p className="text-4xl font-bold tabular-nums text-gray-900 dark:text-[#e6edf3] m-0 leading-none">
            {displayValue}
          </p>

          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-full text-[11px] font-semibold",
              trend.isUp
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {trend.label}
            </div>
          )}

          {displayHint != null && !trend && (
            <p
              className="text-xs m-0 mt-2 text-gray-500 dark:text-[#8b949e]"
              style={displayHintColor ? { color: displayHintColor } : undefined}
            >
              {displayHint}
            </p>
          )}
        </>
      )}
    </div>
  );
}
