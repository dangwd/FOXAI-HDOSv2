"use client";

import { cn } from "@/shared/utils/cn";

interface FlowStage {
  label: string;
  value: number | string;
  color?: string;
  warn?: boolean;
}

interface FlowPipelineProps {
  title?: string;
  footer?: string;
  stages: FlowStage[];
  className?: string;
  /** Hiển thị chip xanh "Realtime" ở góc trên phải header */
  realtimeBadge?: boolean;
}

export function FlowPipeline({ title, footer, stages, className, realtimeBadge }: FlowPipelineProps) {
  return (
    <div
      className={cn(
        "rounded-lg px-5 py-3 border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22]",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider m-0">
            {title}
          </p>
          {realtimeBadge && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Realtime
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-center shrink-0">
            {/* Stage box */}
            <div className="flex flex-col items-center px-3 min-w-[72px]">
              <span
                className="text-xl font-bold tabular-nums leading-tight"
                style={{ color: stage.color ?? (stage.warn ? "#ff4d4f" : "#1677ff") }}
              >
                {stage.value}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-[#8b949e] text-center mt-0.5 leading-tight whitespace-nowrap">
                {stage.label}
              </span>
            </div>

            {/* Arrow connector */}
            {i < stages.length - 1 && (
              <svg
                className="text-gray-300 dark:text-[#30363d] shrink-0"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M4 8h8M9 5l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {footer && (
        <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mt-2">{footer}</p>
      )}
    </div>
  );
}
