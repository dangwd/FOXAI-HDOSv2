import { Input, Tag } from "antd";
import { Search } from "lucide-react";
import type { WidgetSchemaEntry } from "@/infrastructure/http/adminApi";
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_COLOR } from "../_lib/constants";

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
      className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all select-none
        bg-white dark:bg-[#0d1117] border-gray-200 dark:border-[#30363d]
        hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-sm hover:bg-violet-50/50 dark:hover:bg-violet-950/10"
    >
      <span className="text-base leading-none shrink-0">{entry.icon ?? "📊"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0 truncate">{entry.label}</p>
        {entry.description && (
          <p className="text-[10px] text-gray-400 dark:text-[#8b949e] m-0 truncate">{entry.description}</p>
        )}
      </div>
      <Tag
        color={CATEGORY_COLOR[entry.category]}
        style={{ fontSize: 9, padding: "0 4px", lineHeight: "16px", margin: 0 }}
      >
        {CATEGORY_LABELS[entry.category]}
      </Tag>
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
  const filtered = catalog.filter(
    (e) =>
      e.label.toLowerCase().includes(search.toLowerCase()) ||
      e.chartType.toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: filtered.filter((e) => e.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="p-2 border-b border-gray-200 dark:border-[#30363d] shrink-0">
        <Input
          size="small"
          prefix={<Search size={13} className="text-gray-400" />}
          placeholder="Tìm widget..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          allowClear
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {catalog.length === 0 ? (
          <p className="text-xs text-center text-gray-400 dark:text-[#484f58] pt-8">Đang tải...</p>
        ) : grouped.length === 0 ? (
          <p className="text-xs text-center text-gray-400 dark:text-[#484f58] pt-8">Không tìm thấy widget</p>
        ) : (
          grouped.map(({ cat, items }) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider px-1 mb-1.5">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="space-y-1">
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
          ))
        )}
      </div>
    </>
  );
}
