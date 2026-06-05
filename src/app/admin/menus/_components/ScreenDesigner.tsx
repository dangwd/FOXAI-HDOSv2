"use client";

import type React from "react";
import { useRef, useState } from "react";
import { App, Button, Input, InputNumber, Select, Space } from "antd";
import {
  ArrowLeft, BarChart2, GripVertical, LineChart, Palette, PieChart,
  Save, Table2, TrendingUp, Type, X,
  type LucideProps,
} from "lucide-react";
import type { DesignerState, DesignerWidget, RefreshMode, WidgetType } from "../_lib/types";
import { SWATCH_COLORS, SPAN_OPTIONS } from "../_lib/constants";
import { WidgetPreview } from "./WidgetPreview";
import { ProviderOperationSelect } from "./ProviderOperationSelect";

// ─── Widget meta ──────────────────────────────────────────────────────────────

type LucideComp = React.ComponentType<LucideProps>;

const WIDGET_META: Record<WidgetType, { Icon: LucideComp; color: string; label: string }> = {
  kpi:   { Icon: TrendingUp, color: "#059669", label: "KPI"        },
  line:  { Icon: LineChart,  color: "#3b82f6", label: "Line Chart"  },
  bar:   { Icon: BarChart2,  color: "#10b981", label: "Bar Chart"   },
  pie:   { Icon: PieChart,   color: "#f59e0b", label: "Pie Chart"   },
  table: { Icon: Table2,     color: "#6b7280", label: "Table"       },
  text:  { Icon: Type,       color: "#ec4899", label: "Text"        },
};

const DEFAULT_SPANS: Record<WidgetType, number> = {
  kpi: 3, line: 6, bar: 6, pie: 4, table: 12, text: 6,
};

const SPAN_META: Record<number, { fraction: string }> = {
  2:  { fraction: "1/6"  },
  3:  { fraction: "1/4"  },
  4:  { fraction: "1/3"  },
  6:  { fraction: "1/2"  },
  8:  { fraction: "2/3"  },
  12: { fraction: "Full" },
};

// ─── Widget Card ──────────────────────────────────────────────────────────────

function WidgetCard({
  widget,
  selected,
  dragging,
  dropBefore,
  dropAfter,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDelete,
  onResizeStart,
}: {
  widget:        DesignerWidget;
  selected:      boolean;
  dragging:      boolean;
  dropBefore:    boolean;
  dropAfter:     boolean;
  onSelect:      () => void;
  onDragStart:   () => void;
  onDragEnd:     () => void;
  onDragOver:    (e: React.DragEvent, side: "before" | "after") => void;
  onDrop:        (side: "before" | "after") => void;
  onDelete:      () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const meta = WIDGET_META[widget.type];

  return (
    <div
      style={{ gridColumn: `span ${widget.span}` }}
      className={`relative group min-w-0 ${dragging ? "opacity-40" : ""}`}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
    >
      {/* Drop zone: left half */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/2 z-10"
        onDragOver={(e) => { e.preventDefault(); onDragOver(e, "before"); }}
        onDrop={(e) => { e.preventDefault(); onDrop("before"); }}
      >
        {dropBefore && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-emerald-500 rounded-full" />}
      </div>
      {/* Drop zone: right half */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1/2 z-10"
        onDragOver={(e) => { e.preventDefault(); onDragOver(e, "after"); }}
        onDrop={(e) => { e.preventDefault(); onDrop("after"); }}
      >
        {dropAfter && <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-emerald-500 rounded-full" />}
      </div>

      <div
        onClick={onSelect}
        className={`relative h-28 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
          selected
            ? "border-emerald-500 shadow-[0_0_0_2px_rgba(124,58,237,0.2)]"
            : "border-gray-100 dark:border-[#1f2937] hover:border-emerald-300 dark:hover:border-emerald-700"
        } bg-white dark:bg-[#0f172a]`}
      >
        {/* Card toolbar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-300 dark:text-[#484f58] cursor-grab active:cursor-grabbing">
              <GripVertical size={12} />
            </span>
            <span
              className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: meta.color + "22", color: meta.color }}
            >
              <meta.Icon size={8} strokeWidth={2} />
              {widget.type}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-300 dark:text-[#484f58] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <X size={10} />
          </button>
        </div>

        {/* Widget title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-1 pt-2 bg-gradient-to-t from-white/90 dark:from-[#161b22]/90 to-transparent z-10">
          <p className="text-[10px] text-gray-500 dark:text-[#8b949e] truncate m-0">{widget.title || meta.label}</p>
        </div>

        {/* Preview */}
        <div className="absolute inset-0 pt-5 pb-5">
          <WidgetPreview widget={widget} />
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-end justify-end cursor-se-resize z-20 text-gray-300 dark:text-[#484f58] hover:text-emerald-600 transition-colors"
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e); }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M8 8L0 8 8 0Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-[#1f2937]" />
    </div>
  );
}

// ─── Config Panel ─────────────────────────────────────────────────────────────

function ConfigPanel({ widget, onChange }: { widget: DesignerWidget; onChange: (w: DesignerWidget) => void }) {
  const meta = WIDGET_META[widget.type];

  function set<K extends keyof DesignerWidget>(k: K, v: DesignerWidget[K]) {
    onChange({ ...widget, [k]: v });
  }

  return (
    <div className="h-full flex flex-col">

      {/* Panel header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1f2937] shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: meta.color + "18" }}
          >
            <meta.Icon size={16} style={{ color: meta.color }} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight">{meta.label}</p>
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 uppercase tracking-wide">
              Cấu hình widget
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Type */}
        <div>
          <SectionLabel>Loại widget</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.entries(WIDGET_META) as [WidgetType, typeof WIDGET_META[WidgetType]][]).map(([type, m]) => {
              const active = widget.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("type", type)}
                  title={m.label}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                    active
                      ? "border-transparent text-white"
                      : "border-gray-100 dark:border-[#1f2937] text-gray-500 dark:text-[#8b949e] hover:border-gray-300 dark:hover:border-[#484f58]"
                  }`}
                  style={active ? { background: m.color } : undefined}
                >
                  <m.Icon size={13} strokeWidth={2} />
                  <span className="text-[10px] font-semibold leading-none">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* General */}
        <div>
          <SectionLabel>Chung</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Tiêu đề</label>
              <Input
                size="small"
                value={widget.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Tên hiển thị..."
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Nguồn dữ liệu</label>
              <ProviderOperationSelect value={widget.ds} onChange={(v) => set("ds", v)} />
            </div>
          </div>
        </div>

        {/* Field mappings */}
        {widget.type !== "text" && (
          <div>
            <SectionLabel>Trường dữ liệu</SectionLabel>
            {widget.type === "kpi" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Giá trị</label>
                  <Input size="small" value={widget.valField ?? ""} onChange={(e) => set("valField", e.target.value)} placeholder="revenue" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Xu hướng</label>
                  <Input size="small" value={widget.trendField ?? ""} onChange={(e) => set("trendField", e.target.value)} placeholder="growth" />
                </div>
              </div>
            )}
            {(widget.type === "line" || widget.type === "bar") && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Trục X</label>
                  <Input size="small" value={widget.xField ?? ""} onChange={(e) => set("xField", e.target.value)} placeholder="month" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Trục Y</label>
                  <Input size="small" value={widget.yField ?? ""} onChange={(e) => set("yField", e.target.value)} placeholder="revenue" />
                </div>
              </div>
            )}
            {widget.type === "pie" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Danh mục</label>
                  <Input size="small" value={widget.catField ?? ""} onChange={(e) => set("catField", e.target.value)} placeholder="category" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">Giá trị</label>
                  <Input size="small" value={widget.valField ?? ""} onChange={(e) => set("valField", e.target.value)} placeholder="value" />
                </div>
              </div>
            )}
            {widget.type === "table" && (
              <div>
                <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-1">
                  Cột (phân cách bằng dấu phẩy)
                </label>
                <Input
                  size="small"
                  value={widget.cols?.join(", ") ?? ""}
                  onChange={(e) => set("cols", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="col1, col2, col3"
                />
              </div>
            )}
          </div>
        )}

        {/* Layout */}
        <div>
          <SectionLabel>Bố cục</SectionLabel>
          <label className="text-[11px] font-medium text-gray-600 dark:text-[#8b949e] block mb-2">Độ rộng cột</label>
          <div className="space-y-1.5">
            {SPAN_OPTIONS.map((s) => {
              const active = widget.span === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("span", s)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border-2 transition-all ${
                    active
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-gray-100 dark:border-[#1f2937] hover:border-emerald-300 dark:hover:border-emerald-700"
                  }`}
                >
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-[#1f2937] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(s / 12) * 100}%`, background: active ? "#059669" : "#9ca3af" }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold w-8 text-right shrink-0 ${
                    active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-[#484f58]"
                  }`}>
                    {SPAN_META[s].fraction}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color */}
        <div>
          <SectionLabel>Màu sắc</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {SWATCH_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => set("color", col)}
                className={`aspect-square rounded-lg transition-all hover:scale-105 ${
                  widget.color === col ? "ring-2 ring-offset-2 ring-emerald-500 scale-105" : ""
                }`}
                style={{ background: col }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Screen Designer ──────────────────────────────────────────────────────────

export function ScreenDesigner({
  state,
  saving,
  onSave,
  onClose,
  onChange,
}: {
  state:    DesignerState;
  saving:   boolean;
  onSave:   () => Promise<void>;
  onClose:  () => void;
  onChange: (s: DesignerState) => void;
}) {
  const { message } = App.useApp();
  const [dragFromPalType, setDragFromPalType] = useState<WidgetType | null>(null);
  const [dragCanvasIdx,   setDragCanvasIdx]   = useState<number | null>(null);
  const [dropTarget,      setDropTarget]      = useState<{ idx: number; side: "before" | "after" } | null>(null);
  const [palSearch,       setPalSearch]       = useState("");
  const canvasRef    = useRef<HTMLDivElement>(null);
  const widgetSeqRef = useRef(0);
  const resizeRef = useRef<{ idx: number; startX: number; startSpan: number } | null>(null);

  const selWidget = state.selWgId
    ? (state.widgets.find((w) => w.id === state.selWgId) ?? null)
    : null;

  const palEntries = (Object.entries(WIDGET_META) as [WidgetType, typeof WIDGET_META[WidgetType]][])
    .filter(([, meta]) => !palSearch || meta.label.toLowerCase().includes(palSearch.toLowerCase()));

  function update(partial: Partial<DesignerState>) {
    onChange({ ...state, ...partial });
  }

  function setWidgets(widgets: DesignerWidget[]) {
    update({ widgets });
  }

  // ── Drag from palette ──────────────────────────────────────────────────────
  function handlePalDragStart(type: WidgetType) {
    setDragFromPalType(type);
    setDragCanvasIdx(null);
  }

  function addWidget(type: WidgetType) {
    const id = `wg_${(++widgetSeqRef.current).toString(36)}`;
    const w: DesignerWidget = { id, type, title: "", span: DEFAULT_SPANS[type], color: WIDGET_META[type].color, ds: state.palDs };
    onChange({ ...state, widgets: [...state.widgets, w], selWgId: id });
  }

  // ── Canvas drag/drop ───────────────────────────────────────────────────────
  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropTarget(null);
    if (dragFromPalType) {
      addWidget(dragFromPalType);
      setDragFromPalType(null);
    }
  }

  function handleWidgetDrop(idx: number, side: "before" | "after") {
    setDropTarget(null);
    if (dragCanvasIdx === null || dragCanvasIdx === idx) return;
    const list = [...state.widgets];
    const [moved] = list.splice(dragCanvasIdx, 1);
    const target = idx > dragCanvasIdx ? idx - 1 : idx;
    list.splice(side === "before" ? target : target + 1, 0, moved);
    setWidgets(list);
    setDragCanvasIdx(null);
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  function handleResizeStart(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    // subtract p-4 padding (32px) and 11 gaps of gap-3 (132px) → actual column width
    const colWidth = (canvas.clientWidth - 32 - 132) / 12;
    resizeRef.current = { idx, startX: e.clientX, startSpan: state.widgets[idx].span };

    function onMove(me: MouseEvent) {
      if (!resizeRef.current) return;
      const { idx: i, startX, startSpan } = resizeRef.current;
      const newSpan = Math.max(2, Math.min(12, Math.round(startSpan + (me.clientX - startX) / colWidth)));
      setWidgets(state.widgets.map((w, j) => j === i ? { ...w, span: newSpan } : w));
    }
    function onUp() {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-[#010409]">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="h-12 bg-white dark:bg-[#0a0f1a] border-b border-gray-200 dark:border-[#1f2937] flex items-center px-4 gap-3 shrink-0">
        <Button
          type="text"
          size="small"
          icon={<ArrowLeft size={14} />}
          onClick={onClose}
          className="!text-gray-500 dark:!text-[#8b949e]"
        >
          Quay lại
        </Button>

        <div className="w-px h-5 bg-gray-200 dark:bg-[#30363d]" />

        <span className="text-base">{state.screenIcon}</span>
        <Input
          size="small"
          value={state.screenName}
          onChange={(e) => update({ screenName: e.target.value })}
          className="!w-44 font-medium"
        />

        <div className="w-px h-5 bg-gray-200 dark:bg-[#30363d]" />

        <Select
          size="small"
          value={state.refreshMode}
          onChange={(v) => update({ refreshMode: v as RefreshMode })}
          style={{ width: 130 }}
          options={[
            { value: "none",  label: "Không refresh" },
            { value: "timer", label: "Tự động" },
            { value: "sse",   label: "● Live SSE" },
          ]}
        />
        {state.refreshMode === "timer" && (
          <Space size={4}>
            <InputNumber
              size="small"
              min={5} max={3600}
              value={state.refreshIntervalS}
              onChange={(v) => update({ refreshIntervalS: v ?? 60 })}
              style={{ width: 72 }}
            />
            <span className="text-xs text-gray-400 dark:text-[#484f58]">giây</span>
          </Space>
        )}
        {state.refreshMode === "sse" && (
          <span className="text-xs text-emerald-500 font-semibold animate-pulse">● Live</span>
        )}

        <div className="flex-1" />

        <span className="text-[11px] text-gray-400 dark:text-[#484f58] tabular-nums">
          {state.widgets.length} widget
        </span>

        <Button
          type="primary"
          size="small"
          icon={<Save size={13} />}
          loading={saving}
          onClick={() => onSave().catch(() => message.error("Lưu thất bại"))}
        >
          Lưu &amp; Xuất bản
        </Button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Palette */}
        <aside className="w-48 shrink-0 border-r border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col">
          {/* Palette header */}
          <div className="px-2.5 pt-2.5 pb-2 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
            <Input
              size="small"
              placeholder="Tìm widget..."
              value={palSearch}
              onChange={(e) => setPalSearch(e.target.value)}
              allowClear
            />
          </div>

          {/* Widget list */}
          <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
            {palEntries.map(([type, meta]) => (
              <div
                key={type}
                draggable
                onDragStart={() => handlePalDragStart(type)}
                onDragEnd={() => setDragFromPalType(null)}
                onClick={() => addWidget(type)}
                className="group relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-grab active:cursor-grabbing
                  transition-all select-none overflow-hidden
                  hover:bg-gray-50 dark:hover:bg-[#161b22]"
              >
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: meta.color }}
                />
                <div
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: meta.color + "18" }}
                >
                  <meta.Icon size={14} style={{ color: meta.color }} strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-[#c9d1d9] flex-1 truncate">
                  {meta.label}
                </span>
                <GripVertical
                  size={11}
                  className="shrink-0 text-gray-300 dark:text-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
            {palEntries.length === 0 && (
              <p className="text-xs text-center text-gray-400 dark:text-[#484f58] py-6 m-0">Không tìm thấy</p>
            )}
          </div>

          {/* Default data source */}
          <div className="p-2 border-t border-gray-100 dark:border-[#1f2937] space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest m-0">
              DS mặc định
            </p>
            <ProviderOperationSelect
              value={state.palDs}
              onChange={(v) => update({ palDs: v })}
            />
          </div>
        </aside>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          {state.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-64 gap-3 text-gray-400 dark:text-[#484f58]">
              <Palette size={40} className="text-gray-300 dark:text-[#30363d]" />
              <p className="text-sm font-medium m-0 text-gray-600 dark:text-[#8b949e]">Canvas đang trống</p>
              <p className="text-xs m-0 text-center">Kéo widget từ palette bên trái hoặc click để thêm</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
              {state.widgets.map((w, idx) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  selected={state.selWgId === w.id}
                  dragging={dragCanvasIdx === idx}
                  dropBefore={dropTarget?.idx === idx && dropTarget.side === "before"}
                  dropAfter={dropTarget?.idx === idx && dropTarget.side === "after"}
                  onSelect={() => update({ selWgId: state.selWgId === w.id ? null : w.id })}
                  onDragStart={() => { setDragCanvasIdx(idx); setDragFromPalType(null); }}
                  onDragEnd={() => { setDragCanvasIdx(null); setDropTarget(null); }}
                  onDragOver={(_, side) => setDropTarget({ idx, side })}
                  onDrop={(side) => handleWidgetDrop(idx, side)}
                  onDelete={() => {
                    const updated = state.widgets.filter((_, i) => i !== idx);
                    update({ widgets: updated, selWgId: state.selWgId === w.id ? null : state.selWgId });
                  }}
                  onResizeStart={(e) => handleResizeStart(e, idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Config panel */}
        {selWidget && (
          <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a]">
            <ConfigPanel
              widget={selWidget}
              onChange={(updated) => setWidgets(state.widgets.map((w) => w.id === updated.id ? updated : w))}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
