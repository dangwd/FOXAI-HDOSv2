"use client";

import { Alert, App, Button, Input } from "antd";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { ModuleFormDrawer } from "./_components/ModuleFormDrawer";
import { ModuleTable } from "./_components/ModuleTable";
import { useModuleManager } from "./_hooks/useModuleManager";
import type { ModuleForm } from "./_lib/types";

export default function ModuleManagerPage() {
  const { message } = App.useApp();
  const manager = useModuleManager();
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  async function handleSubmit(form: ModuleForm) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await manager.create(form);
      setDrawerOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
        setSubmitError("Code này đã tồn tại. Vui lòng chọn code khác.");
      } else {
        setSubmitError(msg);
        message.error("Tạo module thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
            Quản lý Module
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
            {manager.modules.length} module · DynamicFormService
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => { setSubmitError(null); setDrawerOpen(true); }}
        >
          Tạo Module mới
        </Button>
      </div>

      {/* Load error */}
      {manager.loadError && (
        <Alert
          type="error"
          showIcon
          message="Không tải được danh sách module"
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
          placeholder="Tìm theo code, tên, mô tả..."
          allowClear
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      <ModuleTable
        modules={manager.filtered}
        search={manager.search}
        loading={manager.loading}
      />

      {/* Create drawer */}
      <ModuleFormDrawer
        open={drawerOpen}
        onSubmit={handleSubmit}
        onClose={() => setDrawerOpen(false)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  );
}
