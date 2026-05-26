"use client";

import { useState, useId } from "react";
import { Tag } from "antd";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WidgetInstance {
  uid: string;
  type: string;
  span: number;
}

interface Row {
  id: string;
  components: WidgetInstance[];
}

interface ScreenDef {
  id: string;
  label: string;
  group: string;
  tabs: boolean;
  components: number;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const MODULES: ScreenDef[] = [
  { id: "dashboard",         label: "Executive Dashboard",       group: "TỔNG QUAN",  tabs: false, components: 12 },
  { id: "bao-cao-truc-quan", label: "Báo cáo trực quan",         group: "TỔNG QUAN",  tabs: false, components: 1  },
  { id: "patient-exam",      label: "Khám chữa bệnh",            group: "LÂM SÀNG",   tabs: false, components: 14 },
  { id: "inpatient",         label: "Giường & Nội trú",          group: "LÂM SÀNG",   tabs: false, components: 5  },
  { id: "cdha",              label: "Cận lâm sàng (XN + CĐHA)", group: "LÂM SÀNG",   tabs: true,  components: 18 },
  { id: "surgery",           label: "Phẫu thuật & Gây mê",       group: "LÂM SÀNG",   tabs: false, components: 9  },
  { id: "cdss",              label: "AI Lâm sàng (CDSS)",        group: "LÂM SÀNG",   tabs: false, components: 8  },
  { id: "finance",           label: "Tài chính (RCM + DRG)",     group: "QUẢN TRỊ",   tabs: true,  components: 22 },
  { id: "supply",            label: "Chuỗi cung ứng",            group: "QUẢN TRỊ",   tabs: false, components: 3  },
  { id: "quality",           label: "Chất lượng & ATBT",         group: "QUẢN TRỊ",   tabs: false, components: 6  },
  { id: "patient-journey",   label: "Patient Journey",           group: "NGOẠI VIỆN", tabs: false, components: 6  },
  { id: "ecosystem",         label: "Ecosystem Integration",     group: "NGOẠI VIỆN", tabs: false, components: 6  },
  { id: "executive-kpi",     label: "Executive KPI",             group: "CHIẾN LƯỢC", tabs: false, components: 6  },
  { id: "ai-chatbot",        label: "AI Chatbot & Voice",        group: "CHIẾN LƯỢC", tabs: false, components: 6  },
  { id: "hr-credential",     label: "Nhân sự & Credentialing",   group: "CHIẾN LƯỢC", tabs: false, components: 6  },
  { id: "incident",          label: "Runbook & Incident",        group: "CHIẾN LƯỢC", tabs: false, components: 3  },
  { id: "digital-twin",      label: "Digital Twin",              group: "QUỐC TẾ",    tabs: false, components: 3  },
  { id: "clinical-path",     label: "Clinical Pathway",          group: "QUỐC TẾ",    tabs: false, components: 1  },
  { id: "population-health", label: "Population Health",         group: "QUỐC TẾ",    tabs: false, components: 4  },
  { id: "research",          label: "Research Platform",         group: "QUỐC TẾ",    tabs: false, components: 4  },
  { id: "multi-hospital",    label: "Multi-Hospital Network",    group: "QUỐC TẾ",    tabs: false, components: 4  },
];

const WIDGET_DEFS = [
  { type: "KpiCard",          desc: "Thẻ chỉ số KPI",             category: "Metric",  defaultSpan: 6  },
  { type: "DataTable",        desc: "Bảng dữ liệu động",           category: "Data",    defaultSpan: 24 },
  { type: "ChartBar",         desc: "Biểu đồ cột",                 category: "Chart",   defaultSpan: 12 },
  { type: "ChartLine",        desc: "Biểu đồ đường",               category: "Chart",   defaultSpan: 12 },
  { type: "ChartArea",        desc: "Biểu đồ vùng",                category: "Chart",   defaultSpan: 12 },
  { type: "ChartPie",         desc: "Biểu đồ tròn / donut",        category: "Chart",   defaultSpan: 8  },
  { type: "ProgressList",     desc: "Danh sách thanh tiến trình",  category: "List",    defaultSpan: 12 },
  { type: "AlertList",        desc: "Danh sách cảnh báo",          category: "List",    defaultSpan: 8  },
  { type: "BulletList",       desc: "Danh sách bullet",            category: "List",    defaultSpan: 8  },
  { type: "FlowPipeline",     desc: "Sơ đồ luồng giai đoạn",      category: "Visual",  defaultSpan: 16 },
  { type: "AlertBanner",      desc: "Banner thông báo",            category: "Visual",  defaultSpan: 24 },
  { type: "StatsSummary",     desc: "Tóm tắt thống kê",            category: "Metric",  defaultSpan: 8  },
  { type: "WardBedGrid",      desc: "Heatmap giường bệnh",         category: "Visual",  defaultSpan: 24 },
  { type: "OrRoomGrid",       desc: "Trạng thái phòng mổ",         category: "Visual",  defaultSpan: 24 },
  { type: "VoiceEMR",         desc: "Ghi âm hồ sơ bệnh án",       category: "Special", defaultSpan: 12 },
  { type: "BaoCaoKhoaWidget", desc: "Báo cáo theo khoa",           category: "Special", defaultSpan: 24 },
];

const CATEGORY_COLOR: Record<string, string> = {
  Metric: "blue", Data: "purple", Chart: "cyan", List: "green", Visual: "orange", Special: "volcano",
};

const GROUPS = [...new Set(MODULES.map((m) => m.group))];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function makeDefaultRows(screenId: string): Row[] {
  if (screenId === "dashboard") {
    return [
      { id: uid(), components: [
        { uid: uid(), type: "KpiCard", span: 6 },
        { uid: uid(), type: "KpiCard", span: 6 },
        { uid: uid(), type: "KpiCard", span: 6 },
        { uid: uid(), type: "KpiCard", span: 6 },
      ]},
      { id: uid(), components: [
        { uid: uid(), type: "ProgressList", span: 16 },
        { uid: uid(), type: "AlertList",    span: 8  },
      ]},
      { id: uid(), components: [
        { uid: uid(), type: "FlowPipeline", span: 16 },
        { uid: uid(), type: "ChartPie",     span: 8  },
      ]},
    ];
  }
  return [{ id: uid(), components: [] }];
}

// ─── Widget chip in palette ───────────────────────────────────────────────────

function PaletteChip({ type, desc, category }: { type: string; desc: string; category: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette::${type}`,
    data: { source: "palette", type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none
        bg-white dark:bg-[#0d1117]
        border-gray-200 dark:border-[#30363d]
        hover:border-violet-400 dark:hover:border-violet-600
        hover:shadow-sm
        ${isDragging ? "opacity-40 scale-95" : ""}`}
    >
      <DragHandle />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 m-0 truncate">{type}</p>
        <p className="text-[10px] text-gray-400 dark:text-[#8b949e] m-0 truncate">{desc}</p>
      </div>
      <Tag color={CATEGORY_COLOR[category]} style={{ fontSize: 9, padding: "0 4px", lineHeight: "16px", margin: 0 }}>
        {category}
      </Tag>
    </div>
  );
}

// ─── Sortable widget in canvas ────────────────────────────────────────────────

function CanvasWidget({
  widget,
  onRemove,
  onSpanChange,
}: {
  widget: WidgetInstance;
  onRemove: () => void;
  onSpanChange: (span: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.uid,
    data: { source: "canvas", uid: widget.uid, type: widget.type },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    flexBasis: `${(widget.span / 24) * 100}%`,
    minWidth: 0,
  };

  const def = WIDGET_DEFS.find((d) => d.type === widget.type);

  return (
    <div ref={setNodeRef} style={style} className="relative group shrink-0">
      <div className="border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-xl bg-violet-50 dark:bg-violet-950/20 h-24 flex flex-col items-center justify-center gap-1 hover:border-violet-500 dark:hover:border-violet-500 transition-colors">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1.5 left-1.5 cursor-grab active:cursor-grabbing text-gray-300 dark:text-[#30363d] hover:text-violet-400 p-0.5"
        >
          <DragHandle />
        </div>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded text-gray-300 dark:text-[#30363d] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 m-0">{widget.type}</p>
        <p className="text-[10px] text-gray-400 dark:text-[#8b949e] m-0">{def?.desc}</p>

        {/* Span selector */}
        <div className="flex items-center gap-1 mt-1">
          {[6, 8, 10, 12, 16, 24].map((s) => (
            <button
              key={s}
              onClick={() => onSpanChange(s)}
              className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                widget.span === s
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#30363d]"
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-[9px] text-gray-400 dark:text-[#8b949e]">/24</span>
        </div>
      </div>
    </div>
  );
}

// ─── Drop zone (row) ──────────────────────────────────────────────────────────

function RowDropZone({
  row,
  rowIndex,
  onRemoveWidget,
  onSpanChange,
  onRemoveRow,
  isOver,
}: {
  row: Row;
  rowIndex: number;
  onRemoveWidget: (uid: string) => void;
  onSpanChange: (uid: string, span: number) => void;
  onRemoveRow: () => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `row::${row.id}` });
  const usedSpan = row.components.reduce((s, c) => s + c.span, 0);

  return (
    <div className={`rounded-xl border-2 transition-colors ${
      isOver
        ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20"
        : "border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#0d1117]"
    }`}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-[#30363d]">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-wider">
          Row {rowIndex + 1}
        </span>
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#21262d] rounded-full overflow-hidden mx-2">
          <div
            className={`h-full rounded-full transition-all ${usedSpan > 24 ? "bg-red-400" : "bg-violet-400"}`}
            style={{ width: `${Math.min((usedSpan / 24) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono ${usedSpan > 24 ? "text-red-500" : "text-gray-400 dark:text-[#8b949e]"}`}>
          {usedSpan}/24
        </span>
        <button
          onClick={onRemoveRow}
          className="text-gray-300 dark:text-[#30363d] hover:text-red-400 transition-colors ml-1"
          title="Xóa row"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Drop area */}
      <div ref={setNodeRef} className="p-3 min-h-[7rem] flex gap-2 flex-wrap">
        <SortableContext items={row.components.map((c) => c.uid)} strategy={horizontalListSortingStrategy}>
          {row.components.map((w) => (
            <CanvasWidget
              key={w.uid}
              widget={w}
              onRemove={() => onRemoveWidget(w.uid)}
              onSpanChange={(span) => onSpanChange(w.uid, span)}
            />
          ))}
        </SortableContext>

        {row.components.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-[#8b949e]">
            Kéo widget vào đây
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drag handle icon ─────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
      <circle cx="9"  cy="6"  r="1.5" /><circle cx="15" cy="6"  r="1.5" />
      <circle cx="9"  cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9"  cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

// ─── Module list sidebar ──────────────────────────────────────────────────────

function ModuleRow({ m, active, onClick }: { m: ScreenDef; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm
        ${active
          ? "bg-blue-50 dark:bg-[#1f6feb22] border border-blue-300 dark:border-[#1f6feb66] text-blue-700 dark:text-[#e6edf3] font-medium"
          : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3]"
        }`}
    >
      <span className="flex-1 truncate">{m.label}</span>
      <span className="text-[10px] text-gray-400 dark:text-[#8b949e] shrink-0">{m.components}w</span>
      {m.tabs && (
        <span className="text-[10px] bg-gray-100 dark:bg-[#30363d] text-gray-500 dark:text-[#8b949e] px-1.5 py-0.5 rounded">
          tabs
        </span>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThietKeBaoCaoPage() {
  const [selectedId, setSelectedId] = useState("dashboard");
  const [rowsMap, setRowsMap] = useState<Record<string, Row[]>>({
    dashboard: makeDefaultRows("dashboard"),
  });
  const [overRowId, setOverRowId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<{ type: string; fromCanvas: boolean } | null>(null);
  const [rightTab, setRightTab] = useState<"palette" | "json">("palette");
  const id = useId();

  const rows = rowsMap[selectedId] ?? [];

  function setRows(next: Row[]) {
    setRowsMap((m) => ({ ...m, [selectedId]: next }));
  }

  function selectModule(mid: string) {
    setSelectedId(mid);
    if (!rowsMap[mid]) {
      setRowsMap((m) => ({ ...m, [mid]: makeDefaultRows(mid) }));
    }
  }

  function addRow() {
    setRows([...rows, { id: uid(), components: [] }]);
  }

  function removeRow(rowId: string) {
    setRows(rows.filter((r) => r.id !== rowId));
  }

  function removeWidget(rowId: string, wuid: string) {
    setRows(rows.map((r) => r.id !== rowId ? r : { ...r, components: r.components.filter((c) => c.uid !== wuid) }));
  }

  function setSpan(rowId: string, wuid: string, span: number) {
    setRows(rows.map((r) => r.id !== rowId ? r : {
      ...r,
      components: r.components.map((c) => c.uid !== wuid ? c : { ...c, span }),
    }));
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(event: DragStartEvent) {
    const { data } = event.active;
    setActiveItem({
      type: data.current?.type ?? "",
      fromCanvas: data.current?.source === "canvas",
    });
  }

  function handleDragOver(event: DragOverEvent) {
    const over = event.over?.id as string | undefined;
    if (over?.startsWith("row::")) {
      setOverRowId(over.replace("row::", ""));
    } else {
      // Check if over a widget uid → find its row
      const row = rows.find((r) => r.components.some((c) => c.uid === over));
      setOverRowId(row?.id ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setOverRowId(null);
    setActiveItem(null);

    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overId = over.id as string;

    // ── From palette → row ───────────────────────────────────────────────────
    if (activeData?.source === "palette") {
      const type = activeData.type as string;
      const def = WIDGET_DEFS.find((d) => d.type === type);
      const newWidget: WidgetInstance = { uid: uid(), type, span: def?.defaultSpan ?? 12 };

      let targetRowId: string | null = null;
      if (overId.startsWith("row::")) {
        targetRowId = overId.replace("row::", "");
      } else {
        targetRowId = rows.find((r) => r.components.some((c) => c.uid === overId))?.id ?? null;
      }

      if (!targetRowId) {
        // Drop onto no row → add to last row or create one
        if (rows.length === 0) {
          setRows([{ id: uid(), components: [newWidget] }]);
        } else {
          setRows(rows.map((r, i) => i === rows.length - 1 ? { ...r, components: [...r.components, newWidget] } : r));
        }
        return;
      }

      setRows(rows.map((r) => {
        if (r.id !== targetRowId) return r;
        const overIndex = r.components.findIndex((c) => c.uid === overId);
        const insertAt = overIndex >= 0 ? overIndex : r.components.length;
        const next = [...r.components];
        next.splice(insertAt, 0, newWidget);
        return { ...r, components: next };
      }));
      return;
    }

    // ── Reorder within canvas ─────────────────────────────────────────────────
    if (activeData?.source === "canvas") {
      const activeUid = activeData.uid as string;
      const fromRow = rows.find((r) => r.components.some((c) => c.uid === activeUid));
      if (!fromRow) return;

      let toRowId: string | null = null;
      if (overId.startsWith("row::")) {
        toRowId = overId.replace("row::", "");
      } else {
        toRowId = rows.find((r) => r.components.some((c) => c.uid === overId))?.id ?? null;
      }

      if (!toRowId) return;

      if (fromRow.id === toRowId) {
        // Same row reorder
        const idx1 = fromRow.components.findIndex((c) => c.uid === activeUid);
        const idx2 = fromRow.components.findIndex((c) => c.uid === overId);
        if (idx1 < 0 || idx2 < 0) return;
        setRows(rows.map((r) => r.id !== fromRow.id ? r : {
          ...r,
          components: arrayMove(r.components, idx1, idx2),
        }));
      } else {
        // Move across rows
        const widget = fromRow.components.find((c) => c.uid === activeUid)!;
        setRows(rows.map((r) => {
          if (r.id === fromRow.id) return { ...r, components: r.components.filter((c) => c.uid !== activeUid) };
          if (r.id === toRowId) {
            const overIndex = r.components.findIndex((c) => c.uid === overId);
            const next = [...r.components];
            next.splice(overIndex >= 0 ? overIndex : next.length, 0, widget);
            return { ...r, components: next };
          }
          return r;
        }));
      }
    }
  }

  // Build JSON preview
  const jsonPreview = JSON.stringify({
    title: MODULES.find((m) => m.id === selectedId)?.label,
    rows: rows.map((r) => ({
      components: r.components.map((c) => ({
        type: c.type,
        span: c.span,
        props: {},
      })),
    })),
  }, null, 2);

  return (
    <DndContext
      id={id}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">

        {/* ── Col 1: Module list ── */}
        <div className="w-56 shrink-0 border-r border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col h-full">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3]">Modules</span>
            <button className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors">+ Tạo mới</button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-wider px-2 mb-1">{group}</p>
                {MODULES.filter((m) => m.group === group).map((m) => (
                  <ModuleRow key={m.id} m={m} active={m.id === selectedId} onClick={() => selectModule(m.id)} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Col 2: Canvas ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Canvas header */}
          <div className="px-5 py-2.5 border-b border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex items-center gap-3 shrink-0">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0">
                {MODULES.find((m) => m.id === selectedId)?.label}
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-[#8b949e] m-0">
                GET /api/screen/<code className="text-violet-600 dark:text-violet-400">{selectedId}</code>
                {" · "}{rows.length} row · {rows.reduce((s, r) => s + r.components.length, 0)} widget
              </p>
            </div>
            <a
              href={`/hdos?module=${selectedId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#30363d] transition-colors"
            >
              Xem trực tiếp ↗
            </a>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors font-medium">
              Lưu cấu hình
            </button>
          </div>

          {/* Canvas body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50 dark:bg-[#010409]">
            {rows.map((row, i) => (
              <RowDropZone
                key={row.id}
                row={row}
                rowIndex={i}
                isOver={overRowId === row.id}
                onRemoveWidget={(wuid) => removeWidget(row.id, wuid)}
                onSpanChange={(wuid, span) => setSpan(row.id, wuid, span)}
                onRemoveRow={() => removeRow(row.id)}
              />
            ))}

            {/* Add row */}
            <button
              onClick={addRow}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#30363d] text-xs text-gray-400 dark:text-[#8b949e] hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              + Thêm row mới
            </button>
          </div>
        </div>

        {/* ── Col 3: Palette / JSON ── */}
        <div className="w-64 shrink-0 border-l border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col h-full">
          {/* Tab */}
          <div className="flex border-b border-gray-200 dark:border-[#30363d]">
            {(["palette", "json"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  rightTab === t
                    ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400"
                    : "text-gray-400 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3]"
                }`}
              >
                {t === "palette" ? "Widget Palette" : "JSON Preview"}
              </button>
            ))}
          </div>

          {rightTab === "palette" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <p className="text-[10px] text-gray-400 dark:text-[#8b949e] px-1 mb-2">
                Kéo widget vào canvas
              </p>
              {WIDGET_DEFS.map((w) => (
                <PaletteChip key={w.type} type={w.type} desc={w.desc} category={w.category} />
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#010409]">
              <pre className="font-mono text-[10px] text-gray-700 dark:text-[#e6edf3] whitespace-pre-wrap leading-relaxed m-0">
                {jsonPreview}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="px-3 py-2 rounded-lg border-2 border-violet-500 bg-white dark:bg-[#0d1117] shadow-xl text-xs font-semibold text-violet-600 dark:text-violet-400 cursor-grabbing opacity-90">
            {activeItem.type}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
