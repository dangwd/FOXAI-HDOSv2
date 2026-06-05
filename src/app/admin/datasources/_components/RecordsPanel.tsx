"use client";

import {
  Badge,
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import { Search, X } from "lucide-react";
import type { DmRecordDto, DmRecordsQuery } from "@/infrastructure/http/adminApi";
import type { SourceProfile } from "../_lib/types";
import { useRecords } from "../_hooks/useRecords";

const { Text } = Typography;
const { RangePicker } = DatePicker;

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Pending:    "gold",
  Processing: "processing",
  Matched:    "success",
  Duplicate:  "orange",
  Failed:     "error",
};

function StatusTag({ status }: { status: string }) {
  return (
    <Badge
      status={(STATUS_COLOR[status] ?? "default") as Parameters<typeof Badge>[0]["status"]}
      text={<Text style={{ fontSize: 12 }}>{status}</Text>}
    />
  );
}

// ─── Canonical payload viewer ─────────────────────────────────────────────────

function CanonicalPayloadView({ raw }: { raw: string }) {
  const { token } = theme.useToken();
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(raw) as Record<string, unknown>; } catch { /* keep empty */ }
  const entries = Object.entries(parsed);

  if (!entries.length) {
    return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  }

  return (
    <Descriptions
      size="small"
      column={2}
      bordered
      styles={{
        label:   { fontSize: 11, fontFamily: "monospace", background: token.colorFillAlter, color: token.colorTextSecondary },
        content: { fontSize: 12, fontFamily: "monospace" },
      }}
      items={entries.map(([k, v]) => ({
        key: k,
        label: k,
        children: String(v ?? "—"),
      }))}
    />
  );
}

// ─── Filter form values ───────────────────────────────────────────────────────

interface FilterValues {
  sourceSystem?: string;
  recordType?:   string;
  field?:        string;
  value?:        string;
  dateRange?:    [dayjs.Dayjs, dayjs.Dayjs] | null;
  limit?:        number;
}

// ─── RecordsPanel ─────────────────────────────────────────────────────────────

export function RecordsPanel({ profiles }: { profiles: SourceProfile[] }) {
  const { token } = theme.useToken();
  const { records, loading, searched, search, clear } = useRecords();
  const [form] = Form.useForm<FilterValues>();

  const sourceSystem = Form.useWatch("sourceSystem", form) as string | undefined;

  const allSystems = [...new Set(profiles.map((p) => p.sourceSystem))].sort();
  const typesForSystem = profiles
    .filter((p) => !sourceSystem || p.sourceSystem === sourceSystem)
    .map((p) => p.recordType)
    .sort();

  async function handleSearch() {
    const v = form.getFieldsValue();
    const params: DmRecordsQuery = {};
    if (v.sourceSystem) params.sourceSystem = v.sourceSystem;
    if (v.recordType)   params.recordType   = v.recordType;
    if (v.field?.trim())  params.field  = v.field.trim();
    if (v.value?.trim())  params.value  = v.value.trim();
    if (v.dateRange?.[0]) params.from = v.dateRange[0].toISOString();
    if (v.dateRange?.[1]) params.to   = v.dateRange[1].toISOString();
    if (v.limit)          params.limit = v.limit;
    await search(params);
  }

  function handleReset() {
    form.resetFields();
    clear();
  }

  const columns: TableColumnsType<DmRecordDto> = [
    {
      title: "Nguồn",
      dataIndex: "sourceSystem",
      key: "sourceSystem",
      width: 110,
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
      title: "Loại",
      dataIndex: "recordType",
      key: "recordType",
      width: 120,
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
      title: "Business Key",
      dataIndex: "businessKey",
      key: "businessKey",
      width: 150,
      render: (v: string) => (
        <Text code style={{ fontSize: 11 }}>{v}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 115,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: "Nhận lúc",
      dataIndex: "receivedAt",
      key: "receivedAt",
      width: 155,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text style={{ fontSize: 12 }}>
            {dayjs(v).format("DD/MM/YYYY HH:mm:ss")}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Xử lý lúc",
      dataIndex: "processedAt",
      key: "processedAt",
      width: 155,
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v}>
            <Text style={{ fontSize: 12 }}>
              {dayjs(v).format("DD/MM/YYYY HH:mm:ss")}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filter form */}
      <div style={{
        padding:      "16px 20px",
        borderRadius: token.borderRadiusLG,
        border:       `1px solid ${token.colorBorderSecondary}`,
        background:   token.colorFillAlter,
      }}>
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ gap: 8, flexWrap: "wrap" }}>
          <Form.Item name="sourceSystem" style={{ marginBottom: 8, minWidth: 140 }}>
            <Select
              placeholder="Source System"
              allowClear
              style={{ width: 160 }}
              options={allSystems.map((s) => ({ label: s, value: s }))}
              onChange={() => form.setFieldValue("recordType", undefined)}
            />
          </Form.Item>

          <Form.Item name="recordType" style={{ marginBottom: 8, minWidth: 140 }}>
            <Select
              placeholder="Record Type"
              allowClear
              style={{ width: 160 }}
              options={typesForSystem.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>

          <Form.Item name="field" style={{ marginBottom: 8 }}>
            <Input
              placeholder="Field canonical"
              style={{ width: 160, fontFamily: "monospace" }}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="value"
            style={{ marginBottom: 8 }}
            tooltip="Exact match, phân biệt hoa thường"
          >
            <Input
              placeholder="Giá trị tìm kiếm"
              style={{ width: 180 }}
              allowClear
            />
          </Form.Item>

          <Form.Item name="dateRange" style={{ marginBottom: 8 }}>
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: 340 }}
            />
          </Form.Item>

          <Form.Item name="limit" style={{ marginBottom: 8 }}>
            <InputNumber
              placeholder="Limit"
              min={1}
              max={1000}
              style={{ width: 90 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Search size={13} />}
                loading={loading}
              >
                Tìm kiếm
              </Button>
              {searched && (
                <Button icon={<X size={13} />} onClick={handleReset}>
                  Xóa bộ lọc
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
          Chỉ trả về records có Status = Matched · Limit mặc định 200, tối đa 1000 · Field/Value là exact match, phân biệt hoa thường
        </Text>
      </div>

      {/* Results */}
      {(searched || loading) && (
        <Table<DmRecordDto>
          columns={columns}
          dataSource={records}
          rowKey="id"
          size="small"
          loading={loading}
          expandable={{
            expandedRowRender: (r) => (
              <div style={{ padding: "8px 0" }}>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block", marginBottom: 8 }}
                >
                  Canonical Payload
                </Text>
                <CanonicalPayloadView raw={r.canonicalPayload} />
              </div>
            ),
            rowExpandable: (r) => !!r.canonicalPayload,
          }}
          pagination={{
            pageSize: 50,
            hideOnSinglePage: true,
            showTotal: (t) => `${t} records`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <Text type="secondary">
                  {loading ? "Đang tải…" : "Không tìm thấy record nào"}
                </Text>
              </div>
            ),
          }}
        />
      )}

      {!searched && !loading && (
        <div style={{
          padding:    "48px 0",
          textAlign:  "center",
          color:      token.colorTextQuaternary,
          fontSize:   13,
        }}>
          Chọn bộ lọc và nhấn Tìm kiếm để xem records
        </div>
      )}
    </div>
  );
}
