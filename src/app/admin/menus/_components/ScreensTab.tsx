"use client";

import type { AdminScreen } from "@/infrastructure/http/adminApi";
import { Button, message, Popconfirm, Space, Tag } from "antd";
import { Layers, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ScreenFormDrawer, type ScreenFormData } from "./ScreenFormDrawer";

const STATUS_META = {
  published: { label: "Đã xuất bản", color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
  draft:     { label: "Bản nháp",    color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
} as const;

function RefreshBadge({ mode, intervalS }: { mode: string; intervalS: number }) {
  if (mode === "sse")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live SSE
      </span>
    );
  if (mode === "timer")
    return <span className="text-[11px] font-semibold text-amber-500">⏱ {intervalS}s</span>;
  return <span className="text-[11px] text-gray-400 dark:text-[#484f58]">Tĩnh</span>;
}

function ScreenCard({
  screen,
  onDesign,
  onDelete,
}: {
  screen:   AdminScreen;
  onDesign: () => void;
  onDelete: () => void;
}) {
  const status = STATUS_META[screen.status as keyof typeof STATUS_META] ?? STATUS_META.draft;

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md transition-all">
      {/* Gradient accent on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Status badge */}
      <div className="absolute top-3 right-3">
        <Tag style={{ color: status.color, background: status.bg, border: "none", fontWeight: 600, fontSize: 10, margin: 0 }}>
          {status.label}
        </Tag>
      </div>

      {/* Body */}
      <div className="p-4 flex-1">
        <div className="flex items-start gap-3 pr-20">
          <span className="text-xl w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#1f2937] shrink-0 border border-gray-100 dark:border-[#1f2937]">
            {screen.icon || "📊"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight truncate">
              {screen.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
              {screen.widgetCount} widget
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-gray-100 dark:border-[#1f2937] bg-gray-50/50 dark:bg-[#0a0f1a]/50">
        <RefreshBadge mode={screen.refreshMode} intervalS={screen.refreshIntervalS} />
        <Space size={4}>
          <Button
            type="primary"
            ghost
            size="small"
            className="!text-xs !px-2.5 !h-6"
            onClick={onDesign}
          >
            Thiết kế
          </Button>
          <Popconfirm
            title={`Xóa màn hình "${screen.name}"?`}
            description="Toàn bộ widget bên trong sẽ bị xóa theo."
            okText="Xóa"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={onDelete}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={11} />}
              className="!h-6 !w-6 !p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
}

export function ScreensTab({
  screens,
  onDesign,
  onAdd,
  onDelete,
}: {
  screens:  AdminScreen[];
  onDesign: (s: AdminScreen) => void;
  onAdd:    (data: ScreenFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleAdd(data: ScreenFormData) {
    await onAdd(data);
    setDrawerOpen(false);
  }

  if (screens.length === 0) {
    return (
      <>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-3 py-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#1f2937] text-gray-400 dark:text-[#484f58] hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
        >
          <Layers size={32} className="opacity-50" />
          <div className="text-center">
            <p className="text-sm font-semibold m-0">Chưa có màn hình nào</p>
            <p className="text-xs m-0 mt-1">Nhấn để thêm màn hình đầu tiên</p>
          </div>
        </button>

        <ScreenFormDrawer
          open={drawerOpen}
          screen={null}
          onSubmit={handleAdd}
          onClose={() => setDrawerOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {screens.map((s) => (
          <ScreenCard
            key={s.id}
            screen={s}
            onDesign={() => onDesign(s)}
            onDelete={() => onDelete(s.id).catch(() => message.error("Xóa thất bại"))}
          />
        ))}

        {/* Add card */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#1f2937] min-h-[120px] text-gray-400 dark:text-[#484f58] hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
        >
          <Plus size={20} />
          <span className="text-xs font-semibold">Thêm màn hình</span>
        </button>
      </div>

      <ScreenFormDrawer
        open={drawerOpen}
        screen={null}
        onSubmit={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
