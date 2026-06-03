"use client";

import { useState } from "react";
import { Alert, App, Button } from "antd";
import { RefreshCw, ScanLine } from "lucide-react";
import { useSchemaData } from "./_hooks/useSchemaData";
import { useSchemaEdit } from "./_hooks/useSchemaEdit";
import { StatsCards }          from "./_components/StatsCards";
import { SchemaToolbar }       from "./_components/SchemaToolbar";
import { SchemaTable }         from "./_components/SchemaTable";
import { CreateSchemaDrawer }  from "./_components/CreateSchemaDrawer";
import { EditSchemaDrawer }    from "./_components/EditSchemaDrawer";

function OcrConfigInner() {
  const { message } = App.useApp();
  const data = useSchemaData();
  const edit = useSchemaEdit();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleEditClick(record: Parameters<typeof edit.open>[0]) {
    try {
      await edit.open(record);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Tải schema thất bại");
    }
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#010409] p-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl px-6 py-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <ScanLine size={17} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight">
              Thiết lập chứng từ OCR
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
              Quản lý schema nhận dạng tài liệu cho hệ thống OCR
            </p>
          </div>
        </div>
        <Button
          icon={<RefreshCw size={13} />}
          loading={data.loading || data.statsLoading}
          onClick={data.refresh}
        >
          Làm mới
        </Button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <StatsCards stats={data.stats} loading={data.statsLoading} />

      {/* ── Load error ───────────────────────────────────────────────────────── */}
      {data.loadError && (
        <div className="mb-4">
          <Alert type="error" showIcon title="Không tải được danh sách schema" description={data.loadError} />
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <SchemaToolbar
        search={data.search}
        filterType={data.filterType}
        filterActive={data.filterActive}
        onSearch={data.setSearch}
        onFilterType={data.setFilterType}
        onFilterActive={data.setFilterActive}
        onCreate={() => setCreateOpen(true)}
      />

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <SchemaTable
        schemas={data.schemas}
        loading={data.loading}
        editLoading={edit.loading}
        onEdit={handleEditClick}
        onDeleted={data.refresh}
      />

      {/* ── Drawers ──────────────────────────────────────────────────────────── */}
      <CreateSchemaDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={data.refresh}
      />

      <EditSchemaDrawer
        schema={edit.schema}
        onClose={edit.close}
        onUpdated={(updated) => {
          edit.update(updated);
          data.patchListItem(updated);
        }}
      />
    </div>
  );
}

export default function OcrConfigPage() {
  return <OcrConfigInner />;
}
