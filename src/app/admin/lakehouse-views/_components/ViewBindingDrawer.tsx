"use client";

// Drawer tạo / chỉnh sửa ViewBinding.
// Create mode: dùng POST /lakehouse/view-bindings/with-auto-profile (MVP B, doc 47)
//   → sourceSystem / recordType nhập tự do (auto-derive từ viewName), SourceProfile tự tạo.
// Edit mode: chỉ cho sửa businessKeyColumn / updatedAtColumn / pollIntervalSeconds.

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Space,
  Typography,
  theme,
} from "antd";
import { Info } from "lucide-react";
import { useEffect } from "react";
import {
  bindingToFormValues,
  type ViewBinding,
  type ViewBindingFormValues,
} from "../_lib/types";

const { Text } = Typography;

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "4px 0 16px",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: token.colorTextTertiary,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: token.colorSplit }} />
    </div>
  );
}

// ─── Preview strip ────────────────────────────────────────────────────────────

function BindingPreviewStrip({ form }: { form: ViewBindingFormValues }) {
  const { token } = theme.useToken();
  const view = form.viewName || "schema.view_name";
  const sys = form.sourceSystem || "lakehouse:...";
  const type = form.recordType || "record-type";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 14px",
        borderRadius: token.borderRadiusLG,
        border: `1px dashed ${token.colorBorderSecondary}`,
        background: token.colorFillAlter,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: token.borderRadiusSM,
          background: "rgba(5,150,105,.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text code style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
          {view}
        </Text>
        <Space size={4} wrap>
          <Text
            style={{ fontSize: 11, color: "#34d399", fontFamily: "monospace" }}
          >
            {sys}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            ·
          </Text>
          <Text code style={{ fontSize: 11 }}>
            {type}
          </Text>
        </Space>
      </div>
    </div>
  );
}

// ─── Auto-profile info banner ─────────────────────────────────────────────────

function AutoProfileBanner() {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "10px 12px",
        borderRadius: token.borderRadius,
        background: "rgba(56,189,248,0.06)",
        border: "1px solid rgba(56,189,248,0.2)",
        marginBottom: 16,
      }}
    >
      <Info
        size={13}
        style={{ color: "#38bdf8", marginTop: 1, flexShrink: 0 }}
      />
      <Text
        style={{
          fontSize: 11,
          color: token.colorTextSecondary,
          lineHeight: 1.5,
        }}
      >
        Backend sẽ tự tạo{" "}
        <Text code style={{ fontSize: 11 }}>
          SourceProfile
        </Text>{" "}
        cho cặp{" "}
        <Text code style={{ fontSize: 11 }}>
          sourceSystem / recordType
        </Text>{" "}
        này qua endpoint{" "}
        <Text code style={{ fontSize: 11 }}>
          with-auto-profile
        </Text>
        . Nếu profile đã tồn tại, backend dùng lại (idempotent).
      </Text>
    </div>
  );
}

// ─── ViewBindingDrawer ────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  editing: ViewBinding | null;
  saving: boolean;
  onClose: () => void;
  onSave: (values: ViewBindingFormValues) => Promise<void>;
}

export function ViewBindingDrawer({
  open,
  editing,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form] = Form.useForm<ViewBindingFormValues>();

  // Populate form khi mở drawer
  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue(bindingToFormValues(editing));
    } else {
      form.resetFields();
      form.setFieldsValue({ pollIntervalSeconds: 300 });
    }
  }, [open, editing, form]);

  // Auto-derive sourceSystem / recordType / displayName khi viewName thay đổi
  function handleViewNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (editing) return;
    const match = e.target.value.match(/^[\w]+\.([\w]+)$/);
    if (!match) return;
    const viewShort = match[1]; // "bed_occupancy"
    const current = form.getFieldsValue();
    if (!current.sourceSystem) {
      form.setFieldValue("sourceSystem", `lakehouse:${viewShort}`);
    }
    if (!current.recordType) {
      form.setFieldValue("recordType", viewShort.replace(/_/g, "-"));
    }
    if (!current.displayName) {
      form.setFieldValue(
        "displayName",
        viewShort
          .split("_")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      );
    }
  }

  async function handleSave() {
    let values: ViewBindingFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    try {
      await onSave(values);
      onClose();
    } catch {
      // Lỗi hiển thị từ hook
    }
  }

  const footer = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text type="secondary" style={{ fontSize: 11 }}>
        {editing
          ? "viewName + sourceSystem + recordType không thể thay đổi"
          : "sourceSystem / recordType sẽ được tự động tạo SourceProfile"}
      </Text>
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          {editing ? "Lưu thay đổi" : "+ Tạo Binding"}
        </Button>
      </Space>
    </div>
  );

  const previewValues = Form.useWatch([], form) as
    | ViewBindingFormValues
    | undefined;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        editing ? `Chỉnh sửa: ${editing.viewName}` : "Thêm ViewBinding mới"
      }
      styles={{ wrapper: { width: 560 } }}
      footer={footer}
      destroyOnHidden
    >
      <BindingPreviewStrip
        form={
          previewValues ?? {
            viewName: "",
            sourceSystem: "",
            recordType: "",
            businessKeyColumn: "",
            pollIntervalSeconds: 300,
          }
        }
      />

      <Form form={form} layout="vertical" component="div">
        {/* Phần 1: Định danh view */}
        <SectionHeader>PostgreSQL View</SectionHeader>

        <Form.Item
          name="viewName"
          label="View Name"
          tooltip='Tên đầy đủ dạng "schema.view_name", ví dụ: api.bed_occupancy'
          rules={[
            { required: true, message: "Bắt buộc" },
            { max: 200, message: "Tối đa 200 ký tự" },
            {
              pattern: /^\w+\.\w+$/,
              message: 'Phải theo dạng "schema.view_name"',
            },
          ]}
        >
          <Input
            placeholder="api.bed_occupancy"
            className="font-mono"
            disabled={!!editing}
            onChange={handleViewNameChange}
          />
        </Form.Item>

        {editing && (
          <Text
            type="warning"
            style={{
              fontSize: 11,
              display: "block",
              marginTop: -12,
              marginBottom: 16,
            }}
          >
            ⚠ View name không thể thay đổi sau khi tạo.
          </Text>
        )}

        {/* Phần 2: Định danh SourceProfile */}
        <SectionHeader>Định danh SourceProfile</SectionHeader>

        {/* {!editing && <AutoProfileBanner />} */}

        <Form.Item
          name="displayName"
          label="Display Name"
          tooltip="Tên hiển thị cho SourceProfile được tạo tự động"
          rules={[
            { required: !editing, message: "Bắt buộc" },
            { max: 200, message: "Tối đa 200 ký tự" },
          ]}
        >
          <Input placeholder="Bed Occupancy (Lakehouse)" disabled={!!editing} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item
            name="sourceSystem"
            label="Source System"
            tooltip='Convention: "lakehouse:<view_name>", ví dụ: lakehouse:bed_occupancy'
            rules={[
              { required: true, message: "Bắt buộc" },
              { max: 100, message: "Tối đa 100 ký tự" },
            ]}
          >
            <Input
              placeholder="lakehouse:bed_occupancy"
              className="font-mono"
              disabled={!!editing}
            />
          </Form.Item>

          <Form.Item
            name="recordType"
            label="Record Type"
            tooltip="kebab-case, ví dụ: bed-occupancy"
            rules={[
              { required: true, message: "Bắt buộc" },
              {
                pattern: /^[\w-]+$/,
                message: "Chỉ chữ cái, số, gạch ngang/dưới",
              },
            ]}
          >
            <Input
              placeholder="bed-occupancy"
              className="font-mono"
              disabled={!!editing}
            />
          </Form.Item>
        </div>

        {editing && (
          <Text
            type="warning"
            style={{
              fontSize: 11,
              display: "block",
              marginTop: -12,
              marginBottom: 16,
            }}
          >
            ⚠ sourceSystem + recordType không thể thay đổi sau khi tạo.
          </Text>
        )}

        {/* Phần 3: Cấu hình Poll */}
        <SectionHeader>Cấu hình Poll</SectionHeader>

        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item
            name="businessKeyColumn"
            label="Business Key Column"
            tooltip="Cột trong PG view dùng làm business key — NOT NULL, kết thúc _id/_key hoặc tên đặc biệt (patient_id, ma_bn…)"
            rules={[
              { required: true, message: "Bắt buộc" },
              { pattern: /^\w+$/, message: "Chỉ chữ cái, số, gạch dưới" },
            ]}
          >
            <Input placeholder="department_id" className="font-mono" />
          </Form.Item>

          <Form.Item
            name="updatedAtColumn"
            label={
              <span>
                Updated At Column{" "}
                <Text type="secondary" style={{ fontSize: 11 }}>
                  (tuỳ chọn)
                </Text>
              </span>
            }
            tooltip="Cột timestamp dùng cho incremental sync — bỏ trống nếu view không có. Hiện tại WarehouseViewSyncer full-scan nên không bắt buộc."
            rules={[
              { pattern: /^\w+$/, message: "Chỉ chữ cái, số, gạch dưới" },
            ]}
          >
            <Input
              placeholder="date  (để trống nếu không có)"
              className="font-mono"
              allowClear
            />
          </Form.Item>
        </div>
        <Form.Item
          label="Poll Interval"
          tooltip="Tần suất poll — mặc định 300s (5 phút). Tối thiểu 30s (doc 47)."
        >
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item
              name="pollIntervalSeconds"
              noStyle
              rules={[
                { required: true, message: "Bắt buộc" },
                { type: "number", min: 30, message: "Tối thiểu 30 giây" },
                { type: "number", max: 86400, message: "Tối đa 86400 giây (1 ngày)" },
              ]}
            >
              <InputNumber
                min={30}
                max={86400}
                step={60}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Input
              readOnly
              value="giây"
              style={{ width: 52, textAlign: "center", color: "inherit" }}
            />
          </Space.Compact>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
