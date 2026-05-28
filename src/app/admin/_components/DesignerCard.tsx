import { Tag } from "antd";
import type { WidgetSchemaEntry } from "@/infrastructure/http/adminApi";
import { CATEGORY_COLOR, CATEGORY_LABELS } from "../_lib/constants";
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
  entry:    WidgetSchemaEntry | undefined;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex flex-col h-full rounded-xl border-2 cursor-pointer transition-all
        ${selected
          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md shadow-violet-500/15"
          : "border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-violet-300 dark:hover:border-violet-700"
        }`}
    >
      {/* Drag handle — .drag-handle class is required by ReactGridLayout */}
      <div className="drag-handle flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-100 dark:border-[#21262d] cursor-grab active:cursor-grabbing select-none">
        <IconGrip />
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider truncate max-w-20
          ${selected
            ? "bg-violet-200 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300"
            : "bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#8b949e]"
          }`}>
          {widget.chartType}
        </span>
        <span className="text-[11px] text-gray-700 dark:text-[#e6edf3] truncate flex-1 font-medium">
          {widget.title || widget.widgetKey}
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
        {entry?.icon && <span className="text-lg mb-0.5 leading-none">{entry.icon}</span>}
        <p className="text-[10px] text-gray-400 dark:text-[#8b949e] m-0 leading-tight line-clamp-2">
          {widget.subtitle || widget.operationPattern || "Chưa cấu hình"}
        </p>
        {entry && (
          <Tag
            color={CATEGORY_COLOR[entry.category]}
            style={{ fontSize: 9, padding: "0 3px", lineHeight: "14px", margin: "4px 0 0 0" }}
          >
            {CATEGORY_LABELS[entry.category]}
          </Tag>
        )}
      </div>

      {/* X/Y/W/H footer */}
      <div className="flex items-center gap-1 px-2 pb-1.5 justify-center">
        {(["X", "Y", "W", "H"] as const).map((lbl, i) => (
          <div key={lbl} className="text-center bg-gray-50 dark:bg-[#21262d] rounded px-1 py-0.5 min-w-6.5">
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
