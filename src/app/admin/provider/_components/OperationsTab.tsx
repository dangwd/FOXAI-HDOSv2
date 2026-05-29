"use client";

import type { TableColumnsType } from "antd";
import { Button, Input, message, Space, Table, Tag, Tooltip, Typography } from "antd";
import { CheckCircle2, MinusCircle, Plus, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { useOperationManager } from "../_hooks/useOperationManager";
import { OPERATION_HANDLER_META, OPERATION_STATUS_META, RESULT_CHART_TYPES } from "../_lib/constants";
import type { Operation, OperationForm } from "../_lib/types";
import { BLANK_OPERATION_FORM } from "../_lib/types";
import { OperationFormDrawer } from "./OperationFormDrawer";

const { Text } = Typography;

type DrawerState = { mode: "create" } | { mode: "edit"; target: Operation };

const CHART_LABEL = Object.fromEntries(RESULT_CHART_TYPES.map((t) => [t.value, t.label]));

function toForm(o: Operation): OperationForm {
  return {
    pattern:         o.pattern,
    handler:         o.handler,
    providerId:      o.providerId,
    timeoutMs:       o.timeoutMs,
    cacheSeconds:    o.cacheSeconds,
    idempotent:      o.idempotent,
    resultChartType: o.resultChartType,
    status:          o.status,
  };
}

function fmtCache(s: number): string {
  if (s >= 3600) return `${s / 3600}h`;
  if (s >= 60)   return `${s / 60}m`;
  return `${s}s`;
}

export function OperationsTab() {
  const manager = useOperationManager();
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  async function handleSubmit(form: OperationForm) {
    if (!drawer) return;
    try {
      if (drawer.mode === "create") await manager.create(form);
      else await manager.update(drawer.target.id, form);
      setDrawer(null);
    } catch {
      message.error(manager.error ?? "Thao tác thất bại");
    }
  }

  async function handleDelete(op: Operation) {
    if (!confirm(`Xóa operation "${op.pattern}"?`)) return;
    await manager.remove(op.id);
  }

  const columns: TableColumnsType<Operation> = [
    {
      title:     "Operation Pattern",
      key:       "pattern",
      ellipsis:  true,
      render: (_, o) => (
        <Tooltip title={o.pattern}>
          <Text code className="!text-[12px] !leading-snug whitespace-nowrap">
            {o.pattern}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Handler",
      key:   "handler",
      width: 100,
      render: (_, o) => {
        const meta = OPERATION_HANDLER_META[o.handler] ?? OPERATION_HANDLER_META.provider;
        return (
          <Tag style={{ color: meta.color, background: meta.bg, border: "none", fontWeight: 600, margin: 0 }}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Provider ID",
      key:   "provider",
      width: 150,
      ellipsis: true,
      render: (_, o) =>
        o.handler === "provider" && o.providerId ? (
          <Tooltip title={o.providerId}>
            <Text code className="!text-[11px]">{o.providerId}</Text>
          </Tooltip>
        ) : (
          <span className="text-gray-300 dark:text-[#484f58]">—</span>
        ),
    },
    {
      title: "Timeout",
      key:   "timeout",
      width: 82,
      align: "right" as const,
      render: (_, o) => (
        <span className="text-[11px] tabular-nums text-gray-500 dark:text-[#8b949e]">
          {(o.timeoutMs / 1000).toLocaleString()}s
        </span>
      ),
    },
    {
      title: "Cache",
      key:   "cache",
      width: 70,
      align: "center" as const,
      render: (_, o) =>
        o.cacheSeconds !== null ? (
          <span className="text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {fmtCache(o.cacheSeconds)}
          </span>
        ) : (
          <span className="text-gray-300 dark:text-[#484f58]">—</span>
        ),
    },
    {
      title: "Idempotent",
      key:   "idempotent",
      width: 92,
      align: "center" as const,
      render: (_, o) =>
        o.idempotent ? (
          <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
        ) : (
          <MinusCircle size={14} className="text-gray-300 dark:text-[#484f58] mx-auto" />
        ),
    },
    {
      title: "Widget",
      key:   "chart",
      width: 130,
      ellipsis: true,
      render: (_, o) =>
        o.resultChartType ? (
          <Tooltip title={o.resultChartType}>
            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-mono">
              {CHART_LABEL[o.resultChartType] ?? o.resultChartType}
            </span>
          </Tooltip>
        ) : (
          <span className="text-gray-300 dark:text-[#484f58]">—</span>
        ),
    },
    {
      title: "Status",
      key:   "status",
      width: 95,
      render: (_, o) => {
        const meta = OPERATION_STATUS_META[o.status];
        return (
          <Tag style={{ color: meta.color, background: meta.bg, border: "none", fontWeight: 600, margin: 0 }}>
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "",
      key:   "actions",
      width: 90,
      align: "right" as const,
      render: (_, o) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            className="!text-violet-600 dark:!text-violet-400 !px-2"
            onClick={() => setDrawer({ mode: "edit", target: o })}
          >
            Sửa
          </Button>
          <Button
            type="text"
            size="small"
            danger
            className="!px-2"
            onClick={() => handleDelete(o)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input.Search
          value={manager.search}
          onChange={(e) => manager.setSearch(e.target.value)}
          onSearch={(v) => manager.setSearch(v)}
          placeholder="Tìm pattern, provider, handler..."
          allowClear
          style={{ maxWidth: 300 }}
        />
        <div className="flex-1" />
        <Button
          icon={<RefreshCw size={14} />}
          onClick={manager.refresh}
          loading={manager.loading}
        >
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
        loading={manager.loading}
        scroll={{ x: 900 }}
        pagination={{
          pageSize: 15,
          showSizeChanger: false,
          showTotal: (t) => `${t} operations`,
          size: "small",
        }}
        locale={{
          emptyText: (
            <div className="flex flex-col items-center py-12 gap-2">
              <Search size={28} className="text-gray-200 dark:text-[#30363d]" />
              <p className="text-sm text-gray-400 m-0">Không tìm thấy operation nào</p>
            </div>
          ),
        }}
      />

      {/* Drawer */}
      <OperationFormDrawer
        open={drawer !== null}
        isEdit={drawer?.mode === "edit"}
        initial={drawer?.mode === "edit" ? toForm(drawer.target) : BLANK_OPERATION_FORM}
        onSubmit={handleSubmit}
        onClose={() => setDrawer(null)}
      />
    </div>
  );
}
