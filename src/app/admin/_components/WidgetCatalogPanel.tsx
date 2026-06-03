"use client";

import { createElement } from "react";
import type { WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { Input } from "antd";
import * as LucideIcons from "lucide-react";
import { GripVertical, Layers, Search, type LucideProps } from "lucide-react";

type LucideComp = React.ComponentType<LucideProps>;

const CATEGORY_COLORS: Record<string, string> = {
  visualization: "#6366f1",
  healthcare: "#22c55e",
  filter: "#f59e0b",
  layout: "#3b82f6",
  ai: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  visualization: "Biểu đồ",
  healthcare: "Y tế",
  filter: "Bộ lọc",
  layout: "Bố cục",
  ai: "AI",
  other: "Khác",
};

function getEntryColor(entry: WidgetCatalogEntry): string {
  if (entry.category && CATEGORY_COLORS[entry.category])
    return CATEGORY_COLORS[entry.category];
  return "#6366f1";
}

function getEntryIcon(entry: WidgetCatalogEntry): LucideComp {
  if (entry.icon) {
    const found = (LucideIcons as Record<string, unknown>)[entry.icon] as
      | LucideComp
      | undefined;
    if (found && typeof found === "function") return found;
  }
  return LucideIcons.LayoutDashboard;
}

function CatalogItem({
  entry,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  entry: WidgetCatalogEntry;
  onAdd: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const color = getEntryColor(entry);

  return (
    <div
      draggable
      unselectable="on"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", entry.widgetType);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onAdd}
      className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing
        transition-all select-none overflow-hidden
        hover:bg-gray-50 dark:hover:bg-[#161b22]"
    >
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: color }}
      />
      <div
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: color + "18" }}
      >
        {createElement(getEntryIcon(entry), { size: 15, style: { color } })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3] m-0 truncate leading-tight">
          {entry.label}
        </p>
        {entry.description && (
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 truncate mt-0.5">
            {entry.description}
          </p>
        )}
      </div>
      <GripVertical
        size={12}
        className="shrink-0 text-gray-300 dark:text-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

export function WidgetCatalogPanel({
  catalog,
  search,
  onSearch,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  catalog: WidgetCatalogEntry[];
  search: string;
  onSearch: (q: string) => void;
  onAdd: (entry: WidgetCatalogEntry) => void;
  onDragStart: (entry: WidgetCatalogEntry) => void;
  onDragEnd: () => void;
}) {
  const q = search.toLowerCase();
  const filtered = catalog.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.widgetType.toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q),
  );

  const groups = filtered.reduce<Record<string, WidgetCatalogEntry[]>>(
    (acc, e) => {
      const key = e.category ?? "other";
      (acc[key] ??= []).push(e);
      return acc;
    },
    {},
  );

  return (
    <>
      <div className="px-2.5 pt-2.5 pb-2 border-b border-gray-100 dark:border-[#21262d] shrink-0">
        <Input
          size="small"
          prefix={<Search size={12} className="text-gray-400" />}
          placeholder="Tìm widget..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          allowClear
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {catalog.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-12 text-gray-400 dark:text-[#484f58]">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
              <Layers size={18} className="text-gray-300 dark:text-[#30363d]" />
            </div>
            <p className="text-xs m-0">Đang tải widget...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-12 text-gray-400 dark:text-[#484f58]">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
              <Search size={16} className="text-gray-300 dark:text-[#30363d]" />
            </div>
            <p className="text-xs m-0">Không tìm thấy widget</p>
            <p className="text-[10px] text-gray-300 dark:text-[#30363d] m-0">
              Thử từ khoá khác
            </p>
          </div>
        ) : (
          <div className="px-1.5 space-y-3">
            {Object.entries(groups).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#484f58]">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {items.map((entry) => (
                    <CatalogItem
                      key={entry.widgetType}
                      entry={entry}
                      onAdd={() => onAdd(entry)}
                      onDragStart={() => onDragStart(entry)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
