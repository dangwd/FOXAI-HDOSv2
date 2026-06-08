"use client";

// Drawer thủ công gọi POST /dm/ingest/json với payload JSON tuỳ ý.
// Pre-fill sourceSystem + recordType từ ViewBinding khi mở từ row action.

import {
  adminApi,
  type DmIngestResult,
} from "@/infrastructure/http/adminApi";
import {
  Alert,
  Badge,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Typography,
  theme,
} from "antd";
import { CheckCircle, Upload } from "lucide-react";
import { useState } from "react";
import type { ViewBinding } from "../_lib/types";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: DmIngestResult }) {
  const { token } = theme.useToken();
  const rows: { label: string; value: string }[] = [
    { label: "ID",           value: result.id },
    { label: "Business Key", value: result.businessKey },
    { label: "Source",       value: result.sourceSystem },
    { label: "Record Type",  value: result.recordType },
    { label: "Status",       value: result.status },
  ];

  return (
    <div
      style={{
        borderRadius: token.borderRadius,
        border: "1px solid rgba(52,211,153,0.3)",
        background: "rgba(52,211,153,0.06)",
        padding: "12px 14px",
        marginTop: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <CheckCircle size={14} style={{ color: "#34d399" }} />
        <Text style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
          Ingest thành công
        </Text>
      </div>
      {rows.map(({ label, value }) => (
        <div
          key={label}
          style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "baseline" }}
        >
          <Text type="secondary" style={{ fontSize: 11, width: 88, flexShrink: 0 }}>
            {label}
          </Text>
          <Text code style={{ fontSize: 11 }}>
            {value}
          </Text>
        </div>
      ))}
      <div style={{ marginTop: 6 }}>
        <Badge
          status={result.status === "Matched" ? "success" : "processing"}
          text={
            <Text type="secondary" style={{ fontSize: 11 }}>
              {result.status === "Matched"
                ? "Record đã khớp ngay"
                : "Đang chờ DataMatchingService xử lý"}
            </Text>
          }
        />
      </div>
    </div>
  );
}

// ─── IngestJsonDrawer ─────────────────────────────────────────────────────────

interface FormValues {
  sourceSystem:        string;
  recordType:          string;
  payload:             string;
  businessKeyOverride: string;
}

interface Props {
  open:    boolean;
  binding: ViewBinding | null; // pre-fill khi mở từ row
  onClose: () => void;
}

export function IngestJsonDrawer({ open, binding, onClose }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [result,     setResult]     = useState<DmIngestResult | null>(null);

  // Reset form + state khi drawer mở / đổi binding
  function handleAfterOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    setError(null);
    setResult(null);
    form.setFieldsValue({
      sourceSystem:        binding?.sourceSystem        ?? "",
      recordType:          binding?.recordType          ?? "",
      payload:             JSON.stringify({ ho_ten: "", ma_benh_nhan: "" }, null, 2),
      businessKeyOverride: "",
    });
  }

  async function handleSubmit(values: FormValues) {
    setError(null);
    setResult(null);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(values.payload) as Record<string, unknown>;
    } catch {
      setError("Payload không phải JSON hợp lệ — vui lòng kiểm tra lại.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminApi.ingestJson({
        sourceSystem:        values.sourceSystem.trim(),
        recordType:          values.recordType.trim(),
        payload:             parsed,
        businessKeyOverride: values.businessKeyOverride.trim() || null,
      });
      setResult(res);
      form.setFieldValue("payload", JSON.stringify({ ho_ten: "", ma_benh_nhan: "" }, null, 2));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      setError(`Ingest thất bại: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }

  const title = binding
    ? `Ingest JSON → ${binding.recordType}`
    : "Ingest JSON thủ công";

  const footer = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <Button onClick={onClose}>Đóng</Button>
      <Button
        type="primary"
        icon={<Upload size={14} />}
        loading={submitting}
        onClick={() => form.submit()}
      >
        Ingest
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      styles={{ wrapper: { width: 520 } }}
      footer={footer}
      destroyOnHidden
      afterOpenChange={handleAfterOpenChange}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Space style={{ width: "100%" }} size={12}>
          <Form.Item
            name="sourceSystem"
            label="Source System"
            rules={[{ required: true, message: "Bắt buộc" }]}
            style={{ flex: 1, marginBottom: 14 }}
          >
            <Input
              placeholder="his-01"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </Form.Item>

          <Form.Item
            name="recordType"
            label="Record Type"
            rules={[{ required: true, message: "Bắt buộc" }]}
            style={{ flex: 1, marginBottom: 14 }}
          >
            <Input
              placeholder="benh-nhan"
              style={{ fontFamily: "monospace", fontSize: 12 }}
            />
          </Form.Item>
        </Space>

        <Form.Item
          name="businessKeyOverride"
          label={
            <span>
              Business Key Override{" "}
              <Text type="secondary" style={{ fontSize: 11 }}>
                (tuỳ chọn)
              </Text>
            </span>
          }
          style={{ marginBottom: 14 }}
        >
          <Input
            placeholder="Để trống → backend tự sinh từ businessKeyColumn"
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
        </Form.Item>

        <Form.Item
          name="payload"
          label="Payload (JSON)"
          rules={[{ required: true, message: "Bắt buộc" }]}
          style={{ marginBottom: 0 }}
        >
          <TextArea
            rows={14}
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: "1.6",
              resize: "vertical",
            }}
            spellCheck={false}
          />
        </Form.Item>
      </Form>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginTop: 14, fontSize: 12 }}
        />
      )}

      {/* Success result */}
      {result && <ResultCard result={result} />}

      {/* Hint */}
      {!result && (
        <Paragraph
          type="secondary"
          style={{ fontSize: 11, marginTop: 14, marginBottom: 0 }}
        >
          Gọi trực tiếp <Text code style={{ fontSize: 11 }}>POST /dm/ingest/json</Text>.
          Payload được đưa vào DataMatchingService như một record thủ công, không
          qua WarehousePollerWorker.
        </Paragraph>
      )}
    </Drawer>
  );
}
