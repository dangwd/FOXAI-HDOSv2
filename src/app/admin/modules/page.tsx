"use client";

import type { AdminModule } from "@/infrastructure/http/adminApi";
import { Alert, App, Button, Input } from "antd";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { ModuleFormDrawer } from "./_components/ModuleFormDrawer";
import { ModuleTable } from "./_components/ModuleTable";
import { useModuleManager } from "./_hooks/useModuleManager";
import { BLANK_FORM, type ModuleForm } from "./_lib/types";

// ─── Drawer state ─────────────────────────────────────────────────────────────

type DrawerState = { mode: "create" } | { mode: "edit"; target: AdminModule };

function toForm(m: AdminModule, groups: { id: string; slug: string }[]): ModuleForm {
  const resolvedGroupId = m.groupId ?? groups.find((g) => g.slug === m.groupSlug)?.id ?? "";
  return {
    groupId:                resolvedGroupId,
    slug:                   m.slug,
    label:                  m.label,
    icon:                   m.icon,
    description:            m.description,
    sortOrder:              m.sortOrder,
    refreshIntervalSeconds: m.refreshIntervalSeconds?.toString() ?? "",
    isActive:               m.isActive ?? true,
    isVisible:              m.isVisible ?? true,
    requiredRoles:          m.requiredRoles ?? [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModuleManagerPage() {
  const { message } = App.useApp();
  const manager = useModuleManager();
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  async function handleSubmit(form: ModuleForm) {
    if (!drawer) return;
    try {
      if (drawer.mode === "create") await manager.create(form);
      else await manager.update(drawer.target.id, form);
      setDrawer(null);
    } catch {
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    }
  }

  async function handleDelete(module: AdminModule) {
    try {
      await manager.remove(module.id);
    } catch {
      message.error("Xóa thất bại. Vui lòng thử lại.");
    }
  }

  const drawerTitle   = drawer?.mode === "edit" ? `Sửa: ${drawer.target.label}` : "Tạo Module mới";
  const drawerInitial = drawer?.mode === "edit" ? toForm(drawer.target, manager.groups) : BLANK_FORM;

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
            Module Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
            {manager.modules.length} module · config-driven layout
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => setDrawer({ mode: "create" })}
        >
          Tạo Module mới
        </Button>
      </div>

      {/* Load error */}
      {manager.loadError && (
        <Alert
          type="error"
          showIcon
          title="Không tải được danh sách module"
          description={manager.loadError}
          className="mb-4"
        />
      )}

      {/* Search */}
      <div className="mb-4">
        <Input
          prefix={<Search size={14} className="text-gray-400" />}
          value={manager.search}
          onChange={(e) => manager.setSearch(e.target.value)}
          placeholder="Tìm theo tên, slug, mô tả..."
          allowClear
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      <ModuleTable
        groups={manager.groups}
        grouped={manager.grouped}
        groupColor={manager.groupColor}
        search={manager.search}
        onEdit={(m) => setDrawer({ mode: "edit", target: m })}
        onDelete={handleDelete}
        onToggle={manager.toggleActive}
      />

      {/* Drawer */}
      <ModuleFormDrawer
        open={drawer !== null}
        title={drawerTitle}
        initial={drawerInitial}
        groups={manager.groups}
        onSubmit={handleSubmit}
        onClose={() => setDrawer(null)}
      />
    </div>
  );
}
