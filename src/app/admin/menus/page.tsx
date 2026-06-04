"use client";

import { LayoutDashboard, Plus } from "lucide-react";
import { useMenuManager }  from "./_hooks/useMenuManager";
import { TreeSidebar }     from "./_components/TreeSidebar";
import { EditorPanel }     from "./_components/EditorPanel";
import { ScreenDesigner }  from "./_components/ScreenDesigner";

function LoadingSkeleton() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-64 shrink-0 border-r border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col animate-pulse">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1f2937] flex items-center justify-between">
          <div className="h-3.5 w-24 rounded bg-gray-100 dark:bg-[#1f2937]" />
          <div className="h-6 w-6 rounded-md bg-gray-100 dark:bg-[#1f2937]" />
        </div>
        <div className="px-2 py-3 space-y-1">
          {[80, 64, 72, 56, 68].map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-2">
              <div className="h-4 w-4 rounded bg-gray-100 dark:bg-[#1f2937]" />
              <div className="h-3 rounded bg-gray-100 dark:bg-[#1f2937]" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1f2937]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-36 rounded bg-gray-100 dark:bg-[#1f2937]" />
            <div className="h-2.5 w-28 rounded bg-gray-100 dark:bg-[#1f2937]" />
          </div>
        </div>
        <div className="p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-[#1f2937]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenusPage() {
  const m = useMenuManager();

  if (m.loading) return <LoadingSkeleton />;

  if (m.designer) {
    return (
      <ScreenDesigner
        state={m.designer}
        saving={m.saving}
        onSave={m.saveDesigner}
        onClose={m.closeDesigner}
        onChange={m.setDesigner}
      />
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <TreeSidebar
        menus={m.menus}
        selId={m.selId}
        expanded={m.expanded}
        onSelect={m.selectMenu}
        onToggle={m.toggleExpand}
        onCreate={m.createMenu}
      />

      {m.selectedMenu ? (
        <EditorPanel
          menu={m.selectedMenu}
          screens={m.screens}
          perms={m.perms}
          activeTab={m.tab}
          saving={m.saving}
          onTabChange={m.setTab}
          onDesign={m.openDesigner}
          onAddScreen={m.createScreen}
          onDeleteScreen={m.deleteScreen}
          onAddPerm={m.addPerm}
          onTogglePerm={m.togglePerm}
          onDeletePerm={m.deletePerm}
          onSaveInfo={m.updateMenuInfo}
          onDeleteMenu={m.deleteMenu}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-gray-50/40 dark:bg-[#010409]/40 p-8">
          {m.menus.length === 0 ? (
            <>
              <div className="flex flex-col items-center gap-2 opacity-30 dark:opacity-20 select-none">
                <div className="w-10 h-10 rounded-xl bg-gray-300 dark:bg-[#30363d]" />
                <div className="w-px h-4 bg-gray-300 dark:bg-[#30363d]" />
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-[#30363d]" />
                  <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-[#30363d]" />
                  <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-[#30363d]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold m-0 text-gray-600 dark:text-[#8b949e]">
                  Chưa có menu báo cáo nào
                </p>
                <p className="text-xs m-0 mt-1 text-gray-400 dark:text-[#484f58]">
                  Nhấn{" "}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-[#1f2937] text-gray-600 dark:text-[#8b949e] font-semibold text-[11px]">
                    <Plus size={9} /> Tạo menu
                  </span>
                  {" "}ở thanh bên trái để bắt đầu
                </p>
              </div>
            </>
          ) : (
            <>
              <LayoutDashboard size={40} className="text-gray-200 dark:text-[#21262d]" />
              <div className="text-center">
                <p className="text-sm font-semibold m-0 text-gray-500 dark:text-[#8b949e]">Chọn menu để quản lý</p>
                <p className="text-xs m-0 mt-1 text-gray-400 dark:text-[#484f58]">Chọn một mục trong danh sách bên trái</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
