"use client";

import { adminApi, type DmIngestResult } from "@/infrastructure/http/adminApi";
import {
  Alert,
  Badge,
  Button,
  Drawer,
  Form,
  Input,
  Segmented,
  Typography,
  theme,
} from "antd";
import { CheckCircle, KeyRound, Upload } from "lucide-react";
import { useState } from "react";
import type { SourceProfile } from "../_lib/types";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: DmIngestResult }) {
  const { token } = theme.useToken();
  const rows = [
    { label: "ID", value: result.id },
    { label: "Business Key", value: result.businessKey },
    { label: "Source", value: result.sourceSystem },
    { label: "Record Type", value: result.recordType },
    { label: "Status", value: result.status },
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <CheckCircle size={14} style={{ color: "#34d399" }} />
        <Text style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
          Ingest thành công
        </Text>
      </div>
      {rows.map(({ label, value }) => (
        <div
          key={label}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 4,
            alignItems: "baseline",
          }}
        >
          <Text
            type="secondary"
            style={{ fontSize: 11, width: 88, flexShrink: 0 }}
          >
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

// ─── FieldRow — compact horizontal: label trái cố định, input phải ──────────

function FieldRow({
  rawKey,
  canonicalKey,
  isBusinessKey,
  value,
  onChange,
}: {
  rawKey: string;
  canonicalKey: string;
  isBusinessKey: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 7,
      }}
    >
      {/* Label — cố định 200px */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
          minWidth: 0,
        }}
      >
        <Text
          code
          style={{
            fontSize: 11,
            flexShrink: 0,
            maxWidth: 80,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {rawKey}
        </Text>
        <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
          →
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: token.colorSuccess,
            fontFamily: "monospace",
            fontWeight: 600,
            flexShrink: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {canonicalKey}
        </Text>
        {isBusinessKey && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              fontSize: 9,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 8,
              background: "rgba(234,179,8,0.12)",
              color: "#ca8a04",
              border: "1px solid rgba(234,179,8,0.22)",
              flexShrink: 0,
            }}
          >
            <KeyRound size={8} />
            BK
          </span>
        )}
      </div>
      {/* Input */}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`…`}
        size="small"
        style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}
      />
    </div>
  );
}

// ─── PayloadFormMode ──────────────────────────────────────────────────────────

function PayloadFormMode({
  profile,
  values,
  onChange,
}: {
  profile: SourceProfile;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        padding: "10px 12px 4px",
        background: token.colorFillAlter,
      }}
    >
      {Object.entries(profile.mappings).map(([raw, canonical]) => (
        <FieldRow
          key={raw}
          rawKey={raw}
          canonicalKey={canonical}
          isBusinessKey={canonical === profile.businessKeyField}
          value={values[raw] ?? ""}
          onChange={(v) => onChange({ ...values, [raw]: v })}
        />
      ))}
    </div>
  );
}

// ─── IngestJsonDrawer ─────────────────────────────────────────────────────────

type PayloadMode = "form" | "json";

interface HeaderFormValues {
  sourceSystem: string;
  recordType: string;
  businessKeyOverride: string;
}

interface Props {
  open: boolean;
  profile: SourceProfile | null;
  onClose: () => void;
}

export function IngestJsonDrawer({ open, profile, onClose }: Props) {
  const [form] = Form.useForm<HeaderFormValues>();
  const [mode, setMode] = useState<PayloadMode>("form");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [jsonText, setJsonText] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DmIngestResult | null>(null);

  function buildInitialFields(p: SourceProfile): Record<string, string> {
    return Object.fromEntries(Object.keys(p.mappings).map((k) => [k, ""]));
  }

  function handleAfterOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    setError(null);
    setResult(null);
    form.setFieldsValue({
      sourceSystem: profile?.sourceSystem ?? "",
      recordType: profile?.recordType ?? "",
      businessKeyOverride: "",
    });
    if (profile) {
      const init = buildInitialFields(profile);
      setFieldValues(init);
      setJsonText(JSON.stringify(init, null, 2));
      setMode("form");
    } else {
      setFieldValues({});
      setJsonText("{\n  \n}");
      setMode("json");
    }
  }

  function handleModeChange(next: PayloadMode) {
    if (next === "json" && mode === "form") {
      // form → json: serialize current field values
      setJsonText(JSON.stringify(fieldValues, null, 2));
    } else if (next === "form" && mode === "json" && profile) {
      // json → form: try to parse and fill back
      try {
        const parsed = JSON.parse(jsonText) as Record<string, string>;
        const filled = Object.fromEntries(
          Object.keys(profile.mappings).map((k) => [
            k,
            String(parsed[k] ?? ""),
          ]),
        );
        setFieldValues(filled);
      } catch {
        // keep current fieldValues if JSON is invalid
      }
    }
    setMode(next);
  }

  function getPayload(): Record<string, unknown> | null {
    if (mode === "form") {
      return fieldValues;
    }
    try {
      return JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async function handleSubmit(headerVals: HeaderFormValues) {
    setError(null);
    setResult(null);

    const payload = getPayload();
    if (!payload) {
      setError("Payload không phải JSON hợp lệ — vui lòng kiểm tra lại.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminApi.ingestJson({
        sourceSystem: headerVals.sourceSystem.trim(),
        recordType: headerVals.recordType.trim(),
        payload,
        businessKeyOverride: headerVals.businessKeyOverride.trim() || null,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(
        `Ingest thất bại: ${e instanceof Error ? e.message : "Lỗi không xác định"}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  const title = profile
    ? `Ingest JSON → ${profile.displayName}`
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
        {/* Source + RecordType */}
        <div style={{ display: "flex", gap: 12 }}>
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
        </div>

        {/* Business Key Override */}
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
          style={{ marginBottom: 18 }}
        >
          <Input
            placeholder="Để trống tự sinh"
            style={{ fontFamily: "monospace", fontSize: 12 }}
          />
        </Form.Item>
      </Form>

      {/* Payload section — ngoài Form để quản lý riêng */}
      <div>
        {/* Header: label + mode toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            Payload
          </Text>
          {profile && (
            <Segmented
              size="small"
              value={mode}
              onChange={(v) => handleModeChange(v as PayloadMode)}
              options={[
                { value: "form", label: "Form" },
                { value: "json", label: "JSON" },
              ]}
            />
          )}
        </div>

        {/* Form mode */}
        {mode === "form" && profile && (
          <PayloadFormMode
            profile={profile}
            values={fieldValues}
            onChange={setFieldValues}
          />
        )}

        {/* JSON mode */}
        {mode === "json" && (
          <TextArea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: "1.6",
              resize: "vertical",
            }}
            spellCheck={false}
          />
        )}
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          style={{ marginTop: 14, fontSize: 12 }}
        />
      )}

      {result && <ResultCard result={result} />}

      {!result && (
        <Paragraph
          type="secondary"
          style={{ fontSize: 11, marginTop: 14, marginBottom: 0 }}
        >
          Gọi trực tiếp{" "}
          <Text code style={{ fontSize: 11 }}>
            POST /dm/ingest/json
          </Text>
          . Payload được đưa vào DataMatchingService như một record thủ công.
        </Paragraph>
      )}
    </Drawer>
  );
}
