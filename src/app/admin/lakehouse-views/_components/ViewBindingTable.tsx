"use client";

import { App, Badge, Button, Popconfirm, Space, Table, Tag, Typography, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import type { ViewBinding } from "../_lib/types";

const { Text } = Typography;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tách tiền tố "lakehouse:" để hiển thị gọn hơn */
function SourceSystemTag({ value }: { value: string }) {
  const { token } = theme.useToken();
  const isLakehouse = value.startsWith("lakehouse:");
  const label = isLakehouse ? value.slice("lakehouse:".length) : value;

  return (
    <Space size={4}>
      {isLakehouse && (
        <Tag
          style={{
            margin:     0,
            fontSize:   10,
            fontWeight: 600,
            background: "rgba(5,150,105,0.1)",
            border:     "1px solid rgba(5,150,105,0.25)",
            color:      "#34d399",
          }}
        >
          lakehouse
        </Tag>
      )}
      <Text code style={{ fontSize: 11, color: token.colorText }}>{label}</Text>
    </Space>
  );
}

// ─── ViewBindingTable ─────────────────────────────────────────────────────────

interface Props {
  bindings:    ViewBinding[];
  hasFilter:   boolean;
  loading:     boolean;
  syncing:     string | null; // id đang sync
  onEdit:      (b: ViewBinding) => void;
  onDelete:    (b: ViewBinding) => void;
  onSync:      (b: ViewBinding) => void;
}

export function ViewBindingTable({
  bindings,
  hasFilter,
  loading,
  syncing,
  onEdit,
  onDelete,
  onSync,
}: Props) {
  const { modal } = App.useApp();
  const { token } = theme.useToken();

  const columns: ColumnsType<ViewBinding> = [
    {
      title:     "View Name",
      dataIndex: "viewName",
      key:       "viewName",
      ellipsis:  true,
      render:    (v: string) => (
        <Text code style={{ fontSize: 12 }}>{v}</Text>
      ),
    },
    {
      title:     "Source System",
      dataIndex: "sourceSystem",
      key:       "sourceSystem",
      render:    (v: string) => <SourceSystemTag value={v} />,
    },
    {
      title:     "Record Type",
      dataIndex: "recordType",
      key:       "recordType",
      render:    (v: string) => (
        <Text code style={{ fontSize: 12 }}>{v}</Text>
      ),
    },
    {
      title:     "Business Key Col",
      dataIndex: "businessKeyColumn",
      key:       "businessKeyColumn",
      render:    (v: string) => (
        <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>{v}</Text>
      ),
    },
    {
      title:     "Poll (giây)",
      dataIndex: "pollIntervalSeconds",
      key:       "pollIntervalSeconds",
      width:     100,
      align:     "right",
      render:    (v: number) => (
        <Text style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{v}s</Text>
      ),
    },
    {
      title:  "Trạng thái",
      key:    "isActive",
      width:  100,
      render: (_, b) => (
        <Badge
          status={b.isActive ? "success" : "default"}
          text={
            <Text style={{ fontSize: 12 }}>
              {b.isActive ? "Active" : "Inactive"}
            </Text>
          }
        />
      ),
    },
    {
      title:  "Thao tác",
      key:    "actions",
      width:  130,
      align:  "right",
      render: (_, b) => (
        <Space size={4}>
          {/* Sync now */}
          <Button
            size="small"
            icon={<RefreshCw size={13} />}
            loading={syncing === b.id}
            title="Sync ngay"
            onClick={() => onSync(b)}
          />

          {/* Edit */}
          <Button
            size="small"
            icon={<Pencil size={13} />}
            title="Chỉnh sửa"
            onClick={() => onEdit(b)}
          />

          {/* Delete */}
          <Popconfirm
            title={`Xóa binding "${b.viewName}"?`}
            description="Sau khi xóa, WarehousePollerWorker sẽ không còn poll view này nữa."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(b)}
          >
            <Button
              size="small"
              danger
              icon={<Trash2 size={13} />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const emptyText = hasFilter
    ? "Không tìm thấy binding nào khớp với bộ lọc"
    : (
      <div style={{ padding: "32px 0", textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Chưa có ViewBinding nào.{" "}
          <Text style={{ color: token.colorSuccess, fontSize: 13 }}>
            Nhấn "+ Thêm Binding" để bắt đầu.
          </Text>
        </Text>
      </div>
    );

  void modal; // suppress unused var

  return (
    <Table<ViewBinding>
      rowKey="id"
      dataSource={bindings}
      columns={columns}
      loading={loading}
      locale={{ emptyText }}
      pagination={{
        pageSize:     20,
        showTotal:    (t) => `${t} bindings`,
        hideOnSinglePage: true,
      }}
      size="small"
    />
  );
}
