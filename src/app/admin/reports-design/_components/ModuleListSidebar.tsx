"use client";

import type { AdminModule } from "@/infrastructure/http/adminApi";
import { useMemo } from "react";
import { ModuleRow } from "./ModuleRow";

interface Props {
  modules:      AdminModule[];
  selectedSlug: string;
  onSelect:     (slug: string) => void;
}

export function ModuleListSidebar({ modules, selectedSlug, onSelect }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, { groupSlug: string; groupLabel: string; items: AdminModule[] }>();
    for (const mod of modules) {
      const key   = mod.groupSlug || "__ungrouped";
      const label = mod.groupLabel || "Chưa phân nhóm";
      if (!map.has(key)) map.set(key, { groupSlug: key, groupLabel: label, items: [] });
      map.get(key)!.items.push(mod);
    }
    return [...map.values()];
  }, [modules]);

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1f2937] shrink-0">
        <span className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3]">
          Pages
        </span>
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
          {modules.length} page · {grouped.length} module
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {grouped.map((group) => (
          <div key={group.groupSlug} className="mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#484f58] truncate">
                {group.groupLabel}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-[#1f2937]" />
              <span className="text-[9px] text-gray-300 dark:text-[#30363d] font-mono shrink-0">
                {group.items.length}
              </span>
            </div>

            <div className="px-1.5 space-y-0.5">
              {group.items.map((mod) => (
                <ModuleRow
                  key={mod.slug}
                  module={mod}
                  active={mod.slug === selectedSlug}
                  onClick={() => { if (mod.slug !== selectedSlug) onSelect(mod.slug); }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
