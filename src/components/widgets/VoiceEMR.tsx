"use client";

import type { SSEConfig } from "@/core/sse/types";

interface Props {
  title?: string;
  badge?: string;
  badgeColor?: string;
  accuracy?: string;
  features?: string[];
  description?: string[];
  loading?: boolean;
  sse?: SSEConfig;
}

export function VoiceEMR({ title, badge, badgeColor = "#059669", accuracy, features, description, loading }: Props) {
  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-[#30363d] rounded-lg h-48" />;
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-[#1f2937] rounded-2xl shadow-sm p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        {title && (
          <h3 className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 flex-1">{title}</h3>
        )}
        {badge && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none shrink-0"
            style={{
              background: badgeColor + "22",
              color: badgeColor,
              border: `1px solid ${badgeColor}55`,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center flex-1 py-4 gap-3">
        {/* Mic icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "#05966922", border: "2px solid #05966955" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>

        <p className="text-sm font-semibold text-gray-700 dark:text-[#c9d1d9] m-0">
          Nhấn để ghi âm bệnh án
        </p>

        {description && description.length > 0 && (
          <div className="text-center space-y-0.5">
            {description.map((line, i) => (
              <p key={i} className="text-xs text-gray-400 dark:text-[#8b949e] m-0">{line}</p>
            ))}
          </div>
        )}

        {features && features.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-[#8b949e] m-0 text-center">
            {features.join(" · ")}
          </p>
        )}

        {accuracy && (
          <span className="text-[11px] text-gray-400 dark:text-[#8b949e]">{accuracy}</span>
        )}
      </div>
    </div>
  );
}
