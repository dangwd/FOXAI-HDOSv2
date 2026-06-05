"use client";

import { useState } from "react";
import { ICON_REGISTRY, formatIconName } from "../_lib/icons";
import { IconPickerModal } from "./IconPickerModal";

export function IconPickerField({
  value,
  groupColor = "#8b949e",
  onChange,
}: {
  value:       string;
  groupColor?: string;
  onChange:    (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const LucideComp = ICON_REGISTRY[value];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group text-left"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ background: groupColor }}
        >
          {LucideComp
            ? <LucideComp size={16} />
            : <span>{value ? value.slice(0, 2).toUpperCase() : "?"}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          {value ? (
            <>
              <p className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3] m-0 truncate">
                {formatIconName(value)}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0">
                lucide-react · {value}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-[#484f58] m-0 italic">
              Chưa chọn — click để mở thư viện icon
            </p>
          )}
        </div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0 group-hover:underline">
          {value ? "Đổi" : "Chọn →"}
        </span>
      </button>

      {open && (
        <IconPickerModal
          current={value}
          onSelect={(name) => { onChange(name); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
