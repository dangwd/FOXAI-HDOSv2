"use client";

import { Tabs } from "antd";
import { FileText, Lock, Info } from "lucide-react";
import type { AdminMenuNode, AdminPermission, AdminScreen } from "@/infrastructure/http/adminApi";
import type { MenuUpsertForm } from "../_lib/types";
import { ScreensTab } from "./ScreensTab";
import { PermsTab }   from "./PermsTab";
import { InfoTab }    from "./InfoTab";

export function EditorPanel({
  menu,
  screens,
  perms,
  activeTab,
  saving,
  onTabChange,
  onDesign,
  onAddScreen,
  onDeleteScreen,
  onAddPerm,
  onTogglePerm,
  onDeletePerm,
  onSaveInfo,
  onDeleteMenu,
}: {
  menu:           AdminMenuNode;
  screens:        AdminScreen[];
  perms:          AdminPermission[];
  activeTab:      "screens" | "perms" | "info";
  saving:         boolean;
  onTabChange:    (t: "screens" | "perms" | "info") => void;
  onDesign:       (s: AdminScreen) => void;
  onAddScreen:    (name: string, icon: string, refreshMode: string, refreshIntervalS: number) => Promise<void>;
  onDeleteScreen: (id: string) => Promise<void>;
  onAddPerm:      (type: "role" | "user", value: string) => Promise<void>;
  onTogglePerm:   (id: string, field: "canView" | "canExport") => Promise<void>;
  onDeletePerm:   (id: string) => Promise<void>;
  onSaveInfo:     (partial: Partial<MenuUpsertForm>) => Promise<void>;
  onDeleteMenu:   (id: string) => Promise<void>;
}) {
  function countBadge(n: number) {
    if (n === 0) return null;
    return (
      <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e] tabular-nums">
        {n}
      </span>
    );
  }

  const tabItems = [
    {
      key:      "screens",
      label:    <span className="flex items-center gap-1.5"><FileText size={12} />Màn hình{countBadge(screens.length)}</span>,
      children: (
        <ScreensTab
          screens={screens}
          onDesign={onDesign}
          onAdd={onAddScreen}
          onDelete={onDeleteScreen}
        />
      ),
    },
    {
      key:      "perms",
      label:    <span className="flex items-center gap-1.5"><Lock size={12} />Phân quyền{countBadge(perms.length)}</span>,
      children: (
        <PermsTab
          perms={perms}
          onAdd={onAddPerm}
          onToggle={onTogglePerm}
          onDelete={onDeletePerm}
        />
      ),
    },
    {
      key:      "info",
      label:    <span className="flex items-center gap-1.5"><Info size={12} />Thông tin</span>,
      children: (
        <InfoTab
          key={menu.id}
          menu={menu}
          saving={saving}
          onSave={onSaveInfo}
          onDelete={onDeleteMenu}
        />
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/40 dark:bg-[#010409]/40">

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex items-center gap-3.5 shrink-0">
        <span className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#1f2937] border border-gray-100 dark:border-[#1f2937] shrink-0">
          {menu.icon || "📊"}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight truncate">
            {menu.name}
          </h2>
          <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <code className="text-emerald-600 dark:text-emerald-400">/reports/{menu.slug}</code>
            {!menu.isVisible && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold">
                Ẩn
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-base font-bold text-gray-800 dark:text-[#e6edf3] m-0 leading-none tabular-nums">{screens.length}</p>
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">screen</p>
          </div>
          <div className="w-px h-7 bg-gray-100 dark:bg-[#1f2937]" />
          <div className="text-right">
            <p className="text-base font-bold text-gray-800 dark:text-[#e6edf3] m-0 leading-none tabular-nums">{perms.length}</p>
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">quyền</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-5 pb-8">
          <Tabs
            activeKey={activeTab}
            onChange={(k) => onTabChange(k as "screens" | "perms" | "info")}
            items={tabItems}
            size="small"
          />
        </div>
      </div>
    </div>
  );
}
