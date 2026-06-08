"use client";

import { Button, Popconfirm, Space, Table, Tag, Tooltip, Typography, theme } from "antd";
import type { TableColumnsType } from "antd";
import { Database, Edit2, Trash2, Upload } from "lucide-react";
import type { SourceProfile } from "../_lib/types";

const { Text } = Typography;

// ─── Mapping tooltip ──────────────────────────────────────────────────────────

function MappingsCell({ mappings }: { mappings: Record<string, string> }) {
  const { token } = theme.useToken();
  const entries = Object.entries(mappings);
  const preview = entries.slice(0, 8);
  const rest    = entries.length - 8;

  const tooltipContent = (
    <div style={{ padding: "2px 0", minWidth: 200 }}>
      {preview.map(([src, can]) => (
        <div key={src} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <span style={{
            fontFamily:   "monospace",
            fontSize:     11,
            background:   "rgba(255,255,255,0.12)",
            padding:      "1px 5px",
            borderRadius: 4,
            color:        "#e6edf3",
            flexShrink:   0,
          }}>
            {src}
          </span>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, flexShrink: 0 }}>→</span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#34d399", fontWeight: 600 }}>
            {can}
          </span>
        </div>
      ))}
      {rest > 0 && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
          +{rest} mapping nữa…
        </div>
      )}
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="left">
      <span style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          24,
        height:         24,
        borderRadius:   "50%",
        background:     "rgba(5,150,105,.15)",
        color:          token.colorSuccess,
        fontSize:       11,
        fontWeight:     700,
        cursor:         "default",
      }}>
        {entries.length}
      </span>
    </Tooltip>
  );
}

// ─── SourceProfileTable ───────────────────────────────────────────────────────

export function SourceProfileTable({
  profiles,
  hasFilter,
  loading,
  onEdit,
  onDelete,
  onIngest,
}: {
  profiles:  SourceProfile[];
  hasFilter: boolean;
  loading?:  boolean;
  onEdit:    (p: SourceProfile) => void;
  onDelete:  (p: SourceProfile) => void;
  onIngest:  (p: SourceProfile) => void;
}) {
  const { token } = theme.useToken();

  const columns: TableColumnsType<SourceProfile> = [
    {
      title: "Nguồn",
      dataIndex: "sourceSystem",
      key: "sourceSystem",
      width: 130,
      render: (v: string) => (
        <Tag style={{
          color:      token.colorSuccess,
          background: `${token.colorSuccess}18`,
          border:     "none",
          fontFamily: "monospace",
          fontWeight: 600,
          fontSize:   11,
        }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Loại tài liệu",
      dataIndex: "recordType",
      key: "recordType",
      width: 150,
      render: (v: string) => (
        <Tag style={{
          color:      token.colorInfo,
          background: `${token.colorInfo}18`,
          border:     "none",
          fontFamily: "monospace",
          fontSize:   11,
        }}>
          {v}
        </Tag>
      ),
    },
    {
      title: "Tên hiển thị",
      dataIndex: "displayName",
      key: "displayName",
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: "Business Key",
      dataIndex: "businessKeyField",
      key: "businessKeyField",
      width: 155,
      render: (v: string) => (
        <Text code style={{ fontSize: 11, color: token.colorSuccess }}>{v}</Text>
      ),
    },
    {
      title: "Mappings",
      key: "mappings",
      width: 90,
      align: "center" as const,
      render: (_: unknown, r: SourceProfile) => <MappingsCell mappings={r.mappings} />,
    },
    {
      title: "",
      key: "actions",
      width: 114,
      align: "right" as const,
      render: (_: unknown, record: SourceProfile) => (
        <Space size={4}>
          <Tooltip title="Ingest JSON thủ công">
            <Button type="text" size="small" icon={<Upload size={13} />} onClick={() => onIngest(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" size="small" icon={<Edit2 size={13} />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa source profile này?"
            description={
              <>
                <Text strong>{record.displayName}</Text>
                <Text type="secondary" style={{ display: "block" }}>
                  Dữ liệu đã ingest không bị ảnh hưởng.
                </Text>
              </>
            }
            onConfirm={() => onDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" size="small" danger icon={<Trash2 size={13} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<SourceProfile>
      columns={columns}
      dataSource={profiles}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={{ pageSize: 20, hideOnSinglePage: true, showTotal: (t) => `${t} profiles` }}
      locale={{
        emptyText: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 12 }}>
            <Database size={36} style={{ color: token.colorTextQuaternary }} />
            <Text type="secondary">
              {hasFilter ? "Không tìm thấy source profile nào" : "Chưa có source profile nào được đăng ký"}
            </Text>
          </div>
        ),
      }}
    />
  );
}
