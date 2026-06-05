"use client";

import { Table, Tag, Button, Space, Typography, Tooltip } from "antd";
import { Zap, Key, Unplug } from "lucide-react";
import type { TableColumnsType } from "antd";
import type { Provider, ProviderStatus } from "../_lib/types";
import { STATUS_META, priorityMeta, providerColor } from "../_lib/constants";

const { Text } = Typography;

// ─── Provider avatar ──────────────────────────────────────────────────────────

function ProviderAvatar({ provider }: { provider: Provider }) {
  const color = providerColor(provider.providerId);
  const initials = provider.providerId.split("-").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const isOnline = provider.status === "active" && !!provider.lastConnectedAt;

  return (
    <div className="relative shrink-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold"
        style={{ background: color }}
      >
        {initials}
      </div>
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#161b22]" />
      )}
    </div>
  );
}

// ─── Operations cell ──────────────────────────────────────────────────────────

function OperationsCell({ ops }: { ops: string[] }) {
  const preview = ops.slice(0, 2);
  const rest = ops.length - 2;
  return (
    <div className="flex flex-col gap-0.5">
      {preview.map((op) => (
        <Text key={op} code className="!text-[10px] !text-gray-500 dark:!text-[#8b949e] break-all leading-snug block">
          {op}
        </Text>
      ))}
      {rest > 0 && (
        <Tooltip
          title={
            <div className="flex flex-col gap-0.5">
              {ops.slice(2).map((op) => <code key={op} className="block text-xs">{op}</code>)}
            </div>
          }
        >
          <span className="text-[10px] text-emerald-600 cursor-pointer hover:underline">+{rest} nữa</span>
        </Tooltip>
      )}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function ProviderTable({
  providers,
  hasFilter,
  loading,
  onEdit,
  onProbe,
  onCredentials,
  onDelete,
  onSetStatus,
}: {
  providers:     Provider[];
  hasFilter:     boolean;
  loading?:      boolean;
  onEdit:        (p: Provider) => void;
  onProbe:       (p: Provider) => void;
  onCredentials: (p: Provider) => void;
  onDelete:      (p: Provider) => void;
  onSetStatus:   (p: Provider, s: ProviderStatus) => void;
}) {
  const columns: TableColumnsType<Provider> = [
    {
      title: "Provider",
      key: "provider",
      render: (_, p) => (
        <div className="flex items-center gap-3">
          <ProviderAvatar provider={p} />
          <div className="min-w-0">
            <div className="font-semibold text-sm text-gray-800 dark:text-[#e6edf3] leading-tight truncate">
              {p.displayName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Text code className="!text-[10px]">{p.providerId}</Text>
              {p.lastConnectedAt && (
                <span className="text-[9px] text-gray-400">
                  · {new Date(p.lastConnectedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Operations",
      key: "operations",
      width: 200,
      render: (_, p) => <OperationsCell ops={p.operations} />,
    },
    {
      title: "Priority",
      key: "priority",
      width: 110,
      render: (_, p) => {
        const pm = priorityMeta(p.priority);
        return (
          <Tag style={{ color: pm.color, background: pm.bg, border: "none", fontWeight: 600 }}>
            {pm.label}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, p) => {
        const meta = STATUS_META[p.status];
        return (
          <Tag
            style={{ color: meta.color, background: meta.bg, border: "none", fontWeight: 600 }}
            icon={<span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: meta.color }} />}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Circuit",
      key: "circuit",
      width: 100,
      render: (_, p) =>
        p.status === "active" ? (
          <Tag color="success" style={{ fontWeight: 600 }}>CLOSED</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "",
      key: "actions",
      width: 280,
      render: (_, p) => {
        const nextStatus: ProviderStatus = p.status === "active" ? "suspended" : "active";
        const toggleLabel = p.status === "active" ? "Tạm dừng" : "Kích hoạt";
        return (
          <Space size={4} wrap>
            <Button size="small" icon={<Zap size={12} />} onClick={() => onProbe(p)}>Probe</Button>
            <Button size="small" icon={<Key size={12} />} onClick={() => onCredentials(p)}>Creds</Button>
            <Button size="small" onClick={() => onEdit(p)}>Sửa</Button>
            <Button size="small" danger onClick={() => onDelete(p)}>Xóa</Button>
            <Button
              size="small"
              style={
                p.status === "active"
                  ? { color: "#fa8c16", borderColor: "#ffd591" }
                  : { color: "#0ca678", borderColor: "#95de64" }
              }
              onClick={() => onSetStatus(p, nextStatus)}
            >
              {toggleLabel}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<Provider>
      columns={columns}
      dataSource={providers}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
      locale={{
        emptyText: (
          <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
            <Unplug size={36} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm m-0">
              {hasFilter ? "Không tìm thấy provider nào" : "Chưa có provider nào"}
            </p>
          </div>
        ),
      }}
    />
  );
}
