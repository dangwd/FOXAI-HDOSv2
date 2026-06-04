import type { WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { WIDGET_TYPE_LABELS } from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";
import { IconGrip, IconX } from "./shared";

export function DesignerCard({
  widget,
  selected,
  entry,
  onSelect,
  onDelete,
}: {
  widget:   DesignerWidget;
  selected: boolean;
  entry:    WidgetCatalogEntry | undefined;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const typeLabel = WIDGET_TYPE_LABELS[widget.widgetType] ?? widget.widgetType;

  return (
    <div
      onClick={onSelect}
      className={`group flex flex-col h-full rounded-xl border-2 cursor-pointer transition-all
        ${selected
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/15"
          : "border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0f172a] hover:border-emerald-300 dark:hover:border-emerald-700"
        }`}
    >
      {/* Drag handle — .drag-handle class is required by ReactGridLayout */}
      <div className="drag-handle flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-100 dark:border-[#1f2937] cursor-grab active:cursor-grabbing select-none">
        <IconGrip />
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider truncate max-w-20
          ${selected
            ? "bg-emerald-200 dark:bg-violet-900/60 text-emerald-700 dark:text-emerald-300"
            : "bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e]"
          }`}>
          {widget.widgetType}
        </span>
        <span className="text-[11px] text-gray-700 dark:text-[#e6edf3] truncate flex-1 font-medium">
          {widget.label || widget.widgetKey}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-4 h-4 flex items-center justify-center rounded text-gray-300 dark:text-[#484f58]
            hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors
            opacity-0 group-hover:opacity-100 shrink-0"
        >
          <IconX size={8} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
        <p className="text-xs font-medium text-gray-600 dark:text-[#8b949e] m-0 mb-1">
          {typeLabel}
        </p>
        {widget.referenceId && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 m-0 font-mono truncate max-w-full px-1">
            ref: {widget.referenceId.slice(0, 8)}…
          </p>
        )}
        {entry?.description && (
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 line-clamp-2 mt-0.5">
            {entry.description}
          </p>
        )}
      </div>

      {/* X/Y/W/H footer */}
      <div className="flex items-center gap-1 px-2 pb-1.5 justify-center">
        {(["X", "Y", "W", "H"] as const).map((lbl, i) => (
          <div key={lbl} className="text-center bg-gray-50 dark:bg-[#1f2937] rounded px-1 py-0.5 min-w-6.5">
            <div className="text-[8px] font-semibold text-gray-400 dark:text-[#484f58]">{lbl}</div>
            <div className="text-[9px] font-mono text-gray-600 dark:text-[#8b949e]">
              {[widget.gridX, widget.gridY, widget.gridW, widget.gridH][i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
