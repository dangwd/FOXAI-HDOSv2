"use client";

import type { TableColumnsType } from "antd";
import { Button, Input, Space, Table, Tag, Typography } from "antd";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { useOperationManager } from "../_hooks/useOperationManager";
import { OPERATION_HANDLER_META } from "../_lib/constants";
import type { Operation, OperationForm, Provider } from "../_lib/types";
import { BLANK_OPERATION_FORM } from "../_lib/types";
import { OperationFormDrawer } from "./OperationFormDrawer";

const { Text } = Typography;

type DrawerState = { mode: "create" } | { mode: "edit"; target: Operation };

function toForm(o: Operation): OperationForm {
  return {
    pattern: o.pattern,
    handler: o.handler,
    providerId: o.providerId,
    timeoutMs: o.timeoutMs,
    cacheSeconds: o.cacheSeconds,
    status: o.status,
  };
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function OperationsTab({ providers }: { providers: Provider[] }) {
  const manager = useOperationManager();
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  function handleSubmit(form: OperationForm) {
    if (!drawer) return;
    if (drawer.mode === "create") manager.create(form);
    else manager.update(drawer.target.id, form);
    setDrawer(null);
  }

  function handleDelete(op: Operation) {
    if (!confirm(`Xóa operation "${op.pattern}"?`)) return;
    manager.remove(op.id);
  }

  const columns: TableColumnsType<Operation> = [
    {
      title: "Pattern",
      key: "pattern",
      render: (_, o) => (
        <Text code className="!text-[12px] break-all leading-snug">
          {o.pattern}
        </Text>
      ),
    },
    {
      title: "Handler",
      key: "handler",
      width: 110,
      render: (_, o) => {
        const meta = OPERATION_HANDLER_META[o.handler];
        return (
          <Tag
            style={{
              color: meta.color,
              background: meta.bg,
              border: "none",
              fontWeight: 600,
            }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Provider",
      key: "provider",
      width: 160,
      render: (_, o) => (
        <Text code className="!text-[11px]">
          {o.providerId}
        </Text>
      ),
    },
    {
      title: "Timeout",
      key: "timeout",
      width: 110,
      render: (_, o) => (
        <span className="text-[11px] text-gray-600 dark:text-[#8b949e]">
          {o.timeoutMs.toLocaleString()} ms
        </span>
      ),
    },
    {
      title: "Cache",
      key: "cache",
      width: 80,
      render: (_, o) =>
        o.cacheSeconds === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {o.cacheSeconds >= 3600
              ? `${o.cacheSeconds / 3600}h`
              : o.cacheSeconds >= 60
                ? `${o.cacheSeconds / 60}m`
                : `${o.cacheSeconds}s`}
          </span>
        ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 100,
      render: (_, o) =>
        o.status === "active" ? (
          <Tag color="success" style={{ fontWeight: 600 }}>
            active
          </Tag>
        ) : (
          <Tag color="default" style={{ fontWeight: 600 }}>
            inactive
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "right" as const,
      render: (_, o) => (
        <Space size={8}>
          <Button
            type="link"
            size="small"
            className="!p-0"
            onClick={() => setDrawer({ mode: "edit", target: o })}
          >
            Sửa
          </Button>
          <Button
            type="link"
            size="small"
            danger
            className="!p-0"
            onClick={() => handleDelete(o)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input.Search
          value={manager.search}
          onChange={(e) => manager.setSearch(e.target.value)}
          onSearch={(v) => manager.setSearch(v)}
          placeholder="Tìm pattern, provider..."
          allowClear
          style={{ maxWidth: 320 }}
        />
        <div className="flex-1" />
        <Button icon={<RefreshCw size={14} />} onClick={manager.refresh}>
          Làm mới
        </Button>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => setDrawer({ mode: "create" })}
        >
          Thêm operation
        </Button>
      </div>

      {/* Table */}
      <Table<Operation>
        columns={columns}
        dataSource={manager.filtered}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{
          emptyText: (
            <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
              <Search size={28} className="text-gray-300 dark:text-[#30363d]" />
              <p className="text-sm m-0">Không tìm thấy operation nào</p>
            </div>
          ),
        }}
      />

      {/* Drawer */}
      <OperationFormDrawer
        open={drawer !== null}
        isEdit={drawer?.mode === "edit"}
        initial={
          drawer?.mode === "edit" ? toForm(drawer.target) : BLANK_OPERATION_FORM
        }
        providers={providers}
        onSubmit={handleSubmit}
        onClose={() => setDrawer(null)}
      />
    </div>
  );
}
