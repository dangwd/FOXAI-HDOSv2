"use client";

// Drawer xem raw DM records của một ViewBinding sau khi sync.
// Hiện tối đa 20 records gần nhất — dùng để verify data đã vào DataMatchingService.

import { adminApi, type DmRecordDto } from "@/infrastructure/http/adminApi";
import { Badge, Button, Drawer, Spin, Table, Typography, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ViewBinding } from "../_lib/types";

const { Text, Paragraph } = Typography;

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    "success" | "processing" | "error" | "warning" | "default"
  > = {
    Matched: "success",
    Pending: "processing",
    Failed: "error",
    Cancelled: "default",
  };
  return (
    <Badge
      status={map[status] ?? "default"}
      text={<Text style={{ fontSize: 12 }}>{status}</Text>}
    />
  );
}

// ─── Canonical payload preview ────────────────────────────────────────────────

function PayloadPreview({ raw }: { raw: string }) {
  const { token } = theme.useToken();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  const entries = Object.entries(parsed).slice(0, 6);

  return (
    <div
      style={{
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        padding: "8px 10px",
        fontSize: 11,
        fontFamily: "monospace",
        maxWidth: 340,
      }}
    >
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "flex", gap: 6, marginBottom: 2 }}>
          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
            {k}:
          </Text>
          <Text style={{ fontSize: 11 }} ellipsis>
            {String(v)}
          </Text>
        </div>
      ))}
      {Object.keys(parsed).length > 6 && (
        <Text type="secondary" style={{ fontSize: 10 }}>
          + {Object.keys(parsed).length - 6} fields khác…
        </Text>
      )}
    </div>
  );
}

// ─── ViewRecordsDrawer ────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  binding: ViewBinding | null;
  onClose: () => void;
}

export function ViewRecordsDrawer({ open, binding, onClose }: Props) {
  const [records, setRecords] = useState<DmRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!binding) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDmRecords({
        sourceSystem: binding.sourceSystem,
        recordType: binding.recordType,
        limit: 20,
      });
      setRecords(data ?? []);
    } catch {
      setError(
        "Không thể tải records — kiểm tra DataMatchingService đang chạy",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && binding) load();
    else setRecords([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, binding?.id]);

  const columns: ColumnsType<DmRecordDto> = [
    {
      title: "Business Key",
      dataIndex: "businessKey",
      key: "businessKey",
      width: 120,
      render: (v: string) => (
        <Text code style={{ fontSize: 11 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, r) => <StatusBadge status={r.status} />,
    },
    {
      title: "Canonical Payload (preview)",
      key: "payload",
      render: (_, r) => <PayloadPreview raw={r.canonicalPayload} />,
    },
    {
      title: "Nhận lúc",
      key: "receivedAt",
      width: 140,
      render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(r.receivedAt).toLocaleString("vi-VN")}
        </Text>
      ),
    },
  ];

  const title = binding ? `Records: ${binding.viewName}` : "Records";

  const footer = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text type="secondary" style={{ fontSize: 11 }}>
        Hiển thị tối đa 20 records gần nhất · {binding?.sourceSystem}
      </Text>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="small"
          icon={<RefreshCw size={13} />}
          loading={loading}
          onClick={load}
        >
          Làm mới
        </Button>
        <Button size="small" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      styles={{ wrapper: { width: 760 } }}
      footer={footer}
      destroyOnHidden
    >
      {/* Error */}
      {error && (
        <Paragraph type="danger" style={{ fontSize: 12, marginBottom: 12 }}>
          ⚠ {error}
        </Paragraph>
      )}

      {/* Table */}
      <Spin spinning={loading && records.length === 0}>
        <Table<DmRecordDto>
          rowKey="id"
          dataSource={records}
          columns={columns}
          size="small"
          pagination={false}
          locale={{
            emptyText: loading ? (
              "Đang tải…"
            ) : (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Chưa có record nào.
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Bấm <strong>Sync</strong> trong bảng → đợi ~30s → Làm mới.
                </Text>
              </div>
            ),
          }}
          scroll={{ x: 680 }}
        />
      </Spin>

      {records.length > 0 && (
        <Text
          type="secondary"
          style={{ fontSize: 11, display: "block", marginTop: 8 }}
        >
          Tổng: {records.length} records (giới hạn 20)
        </Text>
      )}
    </Drawer>
  );
}
