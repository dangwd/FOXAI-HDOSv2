import type { TabMeta } from "../_hooks/useDesignerState";
import { IconPencil, IconX } from "./shared";

interface TabBarProps {
  tabs:          TabMeta[];
  activeId:      string;
  editingId:     string | null;
  editLabel:     string;
  isAdding:      boolean;
  newLabel:      string;
  onSelect:      (id: string) => void;
  onStartEdit:   (tab: TabMeta) => void;
  onEditChange:  (v: string) => void;
  onEditCommit:  (id: string) => void;
  onDelete:      (id: string) => void;
  onStartAdd:    () => void;
  onNewLabelChange: (v: string) => void;
  onAddCommit:   () => void;
  onAddCancel:   () => void;
}

export function TabBar({
  tabs, activeId, editingId, editLabel, isAdding, newLabel,
  onSelect, onStartEdit, onEditChange, onEditCommit, onDelete,
  onStartAdd, onNewLabelChange, onAddCommit, onAddCancel,
}: TabBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] overflow-x-auto shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer shrink-0 select-none transition-all
              ${isActive
                ? "bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-600/20"
                : "text-gray-500 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#1f2937] hover:text-gray-700 dark:hover:text-[#e6edf3]"
              }`}
          >
            {editingId === tab.id ? (
              <input
                autoFocus
                className="text-xs w-24 bg-transparent border-b border-white/60 outline-none text-white placeholder-emerald-200"
                value={editLabel}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={() => onEditCommit(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") onEditCommit(tab.id);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span>{tab.label}</span>
                <span className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    className="opacity-70 hover:opacity-100 p-0.5 rounded"
                    onClick={(e) => { e.stopPropagation(); onStartEdit(tab); }}
                  >
                    <IconPencil size={9} />
                  </button>
                  {tabs.length > 1 && (
                    <button
                      className="opacity-70 hover:opacity-100 hover:text-red-300 p-0.5 rounded"
                      onClick={(e) => { e.stopPropagation(); onDelete(tab.id); }}
                    >
                      <IconX size={9} />
                    </button>
                  )}
                </span>
              </>
            )}
          </div>
        );
      })}

      {isAdding ? (
        <input
          autoFocus
          placeholder="Tên tab..."
          value={newLabel}
          onChange={(e) => onNewLabelChange(e.target.value)}
          onBlur={onAddCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAddCommit();
            if (e.key === "Escape") onAddCancel();
          }}
          className="text-xs w-24 px-2 py-1.5 rounded-lg border border-emerald-400 bg-white dark:bg-[#1f2937] text-gray-700 dark:text-[#e6edf3] outline-none"
        />
      ) : (
        <button
          onClick={onStartAdd}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 text-base
            hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-[#1f2937] transition-colors"
          title="Thêm tab"
        >
          +
        </button>
      )}
    </div>
  );
}
