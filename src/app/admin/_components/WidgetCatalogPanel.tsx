"use client";

import type React from "react";
import { Input } from "antd";
import { Search, GripVertical,
  TrendingUp, BarChart2, BarChart, LineChart, AreaChart, PieChart,
  Activity, Gauge, ScatterChart, Table2, Table, Filter,
  Grid2X2, Grid3X3, LayoutGrid, LayoutDashboard,
  List, FileText, MessageSquare, Bot,
  Heart, HeartPulse, BedDouble, AlertTriangle,
  Stethoscope, Syringe, FlaskConical, UserRound,
  GitFork, ArrowRightLeft, CircleDot, Clock, Layers, Hash,
  type LucideProps,
} from "lucide-react";
import type { WidgetCategory, WidgetSchemaEntry } from "@/infrastructure/http/adminApi";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "../_lib/constants";

// ─── Icon registry ─────────────────────────────────────────────────────────────

type LucideComp = React.ComponentType<LucideProps>;

const ICON_REGISTRY: Record<string, LucideComp> = {
  TrendingUp, BarChart2, BarChart, LineChart, AreaChart, PieChart,
  Activity, Gauge, ScatterChart, Table2, Table,
  Filter, Grid2X2, Grid3X3, LayoutGrid, LayoutDashboard,
  List, FileText, MessageSquare, Bot,
  Heart, HeartPulse, BedDouble, AlertTriangle,
  Stethoscope, Syringe, FlaskConical, UserRound,
  GitFork, ArrowRightLeft, CircleDot, Clock, Layers, Hash,
};

const CATEGORY_FALLBACK: Record<WidgetCategory, LucideComp> = {
  visualization: BarChart2,
  healthcare:    HeartPulse,
  filter:        Filter,
  layout:        LayoutGrid,
  ai:            Bot,
};

const CATEGORY_ACCENT: Record<WidgetCategory, string> = {
  visualization: "#6366f1",
  healthcare:    "#22c55e",
  filter:        "#f59e0b",
  layout:        "#8b5cf6",
  ai:            "#06b6d4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmoji(s: string) {
  return s && s.codePointAt(0)! > 0x2000;
}

function WidgetIcon({ entry, size = 15 }: { entry: WidgetSchemaEntry; size?: number }) {
  const accent = CATEGORY_ACCENT[entry.category];

  if (entry.icon && isEmoji(entry.icon)) {
    return (
      <span className="text-base leading-none">{entry.icon}</span>
    );
  }

  const Comp = (entry.icon ? ICON_REGISTRY[entry.icon] : null) ?? CATEGORY_FALLBACK[entry.category];
  return <Comp size={size} style={{ color: accent }} strokeWidth={1.75} />;
}

// ─── CatalogItem ──────────────────────────────────────────────────────────────

function CatalogItem({
  entry,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  entry:       WidgetSchemaEntry;
  onAdd:       () => void;
  onDragStart: () => void;
  onDragEnd:   () => void;
}) {
  const accent = CATEGORY_ACCENT[entry.category];

  return (
    <div
      draggable
      unselectable="on"
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", entry.chartType);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onAdd}
      className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing
        transition-all select-none overflow-hidden
        hover:bg-gray-50 dark:hover:bg-[#161b22]"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: accent }}
      />

      {/* Icon badge */}
      <div
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: accent + "15" }}
      >
        <WidgetIcon entry={entry} size={15} />
      </div>

      {/* Text */}
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

      {/* Drag grip */}
      <GripVertical
        size={12}
        className="shrink-0 text-gray-300 dark:text-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}

// ─── WidgetCatalogPanel ───────────────────────────────────────────────────────

export function WidgetCatalogPanel({
  catalog,
  search,
  onSearch,
  onAdd,
  onDragStart,
  onDragEnd,
}: {
  catalog:     WidgetSchemaEntry[];
  search:      string;
  onSearch:    (q: string) => void;
  onAdd:       (entry: WidgetSchemaEntry) => void;
  onDragStart: (entry: WidgetSchemaEntry) => void;
  onDragEnd:   () => void;
}) {
  const q = search.toLowerCase();
  const filtered = catalog.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.chartType.toLowerCase().includes(q) ||
      (e.description ?? "").toLowerCase().includes(q),
  );
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: filtered.filter((e) => e.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* Search */}
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

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto py-2">
        {catalog.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-12 text-gray-400 dark:text-[#484f58]">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
              <Layers size={18} className="text-gray-300 dark:text-[#30363d]" />
            </div>
            <p className="text-xs m-0">Đang tải widget...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-12 text-gray-400 dark:text-[#484f58]">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
              <Search size={16} className="text-gray-300 dark:text-[#30363d]" />
            </div>
            <p className="text-xs m-0">Không tìm thấy widget</p>
            <p className="text-[10px] text-gray-300 dark:text-[#30363d] m-0">Thử từ khoá khác</p>
          </div>
        ) : (
          grouped.map(({ cat, items }) => {
            const accent = CATEGORY_ACCENT[cat];
            return (
              <div key={cat} className="mb-1">
                {/* Category header */}
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <div className="flex-1 h-px ml-0.5" style={{ background: accent + "30" }} />
                  <span className="text-[9px] font-mono" style={{ color: accent + "80" }}>
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="px-1.5">
                  {items.map((entry) => (
                    <CatalogItem
                      key={entry.chartType}
                      entry={entry}
                      onAdd={() => onAdd(entry)}
                      onDragStart={() => onDragStart(entry)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
