"use client";

import type { SSEConfig } from "@/core/sse/types";

export type OrRoomStatus = "active" | "preparing" | "cleaning" | "available" | "emergency";

export interface OrRoomData {
  code: string;
  procedure?: string;
  status: OrRoomStatus;
  hint?: string;
}

interface Props {
  title?: string;
  rooms: OrRoomData[];
  loading?: boolean;
  sse?: SSEConfig;
}

const STATUS: Record<OrRoomStatus, { label: string; color: string }> = {
  active:    { label: "ĐANG MỔ",  color: "#1677ff" },
  preparing: { label: "CHUẨN BỊ", color: "#d46b08" },
  cleaning:  { label: "VỆ SINH",  color: "#722ed1" },
  available: { label: "SẴN SÀNG", color: "#389e0d" },
  emergency: { label: "CẤP CỨU",  color: "#cf1322" },
};

export function OrRoomGrid({ title, rooms, loading }: Props) {
  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-[#30363d] rounded-lg h-48" />;
  }

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
      {title && (
        <h3 className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 mb-3">{title}</h3>
      )}
      <div className="grid grid-cols-3 gap-3">
        {rooms.map((room) => {
          const cfg = STATUS[room.status];
          return (
            <div
              key={room.code}
              className="rounded-md border p-3"
              style={{
                borderColor: cfg.color + "55",
                background: cfg.color + "10",
              }}
            >
              <div className="flex items-center justify-between mb-1 gap-1">
                <span className="font-mono text-sm font-bold" style={{ color: cfg.color }}>
                  {room.code}
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none shrink-0"
                  style={{
                    background: cfg.color + "22",
                    color: cfg.color,
                    border: `1px solid ${cfg.color}55`,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              {room.procedure ? (
                <div className="text-xs text-gray-700 dark:text-[#c9d1d9] font-medium truncate">
                  {room.procedure}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-[#8b949e]">Không có lịch</div>
              )}
              {room.hint && (
                <div className="text-[11px] text-gray-400 dark:text-[#8b949e] mt-0.5">{room.hint}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
