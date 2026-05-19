"use client";

import type { CSSProperties, ReactNode } from "react";
import { Skeleton } from "antd";
import { cn } from "@/shared/utils/cn";

interface KpiCardProps {
  title: string;
  value?: ReactNode;
  hint?: ReactNode;
  hintColor?: string;
  loading?: boolean;
  className?: string;
  /** Accent color: draws a 3px left border and a matching dot next to the title */
  accent?: string;
}

export function KpiCard({
  title,
  value,
  hint,
  hintColor,
  loading = false,
  className,
  accent,
}: KpiCardProps): ReactNode {
  const borderStyle: CSSProperties = accent
    ? { borderLeftWidth: 3, borderLeftColor: accent }
    : {};

  return (
    <div
      className={cn(
        "rounded-lg p-4 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]",
        className,
      )}
      style={borderStyle}
    >
      <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0 mb-2 flex items-center gap-1.5">
        {accent && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: accent }}
          />
        )}
        {title}
      </p>
      {loading ? (
        <Skeleton.Input active size="small" />
      ) : (
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-[#e6edf3] m-0 leading-tight">
          {value}
        </p>
      )}
      {!loading && hint != null && (
        <p
          className="text-xs m-0 mt-1"
          style={hintColor ? { color: hintColor } : undefined}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
