"use client";

import { Button, Drawer, Form, Input, Select, Space, Typography, theme } from "antd";
import { useEffect, useMemo } from "react";
import { MappingEditor } from "./MappingEditor";
import {
  EMPTY_MAPPING_ROW,
  mappingsToRows,
  type MappingRow,
  type ProfileFormValues,
  type SourceProfile,
} from "../_lib/types";

const { Text } = Typography;

// ─── Section header ────────────────────────────────────────────────────────────
// Dùng theme.useToken() — tự adaptive light/dark

function SectionHeader({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 16px" }}>
      <span style={{
        fontSize:        10,
        fontWeight:      700,
        color:           token.colorTextTertiary,
        textTransform:   "uppercase",
        letterSpacing:   "0.07em",
        whiteSpace:      "nowrap",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: token.colorSplit }} />
    </div>
  );
}

// ─── Live preview strip ───────────────────────────────────────────────────────

function IdentifierStrip({ form }: { form: ProfileFormValues }) {
  const { token } = theme.useToken();
  const sys  = form.sourceSystem || "source-system";
  const type = form.recordType   || "record-type";
  const name = form.displayName  || "";

  return (
    <div style={{
      display:      "flex",
      alignItems:   "flex-start",
      gap:          12,
      padding:      "12px 14px",
      borderRadius: token.borderRadiusLG,
      border:       `1px dashed ${token.colorBorderSecondary}`,
      background:   token.colorFillAlter,
      marginBottom: 20,
    }}>
      <div style={{
        width:          40,
        height:         40,
        borderRadius:   token.borderRadiusSM,
        background:     "rgba(5,150,105,.1)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Space size={6} wrap style={{ marginBottom: 4 }}>
          <Text code style={{ fontSize: 11, color: token.colorSuccess }}>{sys}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
          <Text code style={{ fontSize: 11 }}>{type}</Text>
        </Space>
        <div>
          {name
            ? <Text type="secondary" style={{ fontSize: 12 }}>{name}</Text>
            : <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>Tên hiển thị…</Text>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Example mapping box ──────────────────────────────────────────────────────

function ExampleBox() {
  const { token } = theme.useToken();
  const rows: [string, string][] = [
    ["patient_id", "MaBenhNhan"],
    ["full_name",  "HoTen"],
    ["department", "TenKhoa"],
  ];

  return (
    <div style={{
      marginTop:    12,
      borderRadius: token.borderRadius,
      padding:      "10px 14px",
      background:   token.colorFillAlter,
      border:       `1px solid ${token.colorBorderSecondary}`,
    }}>
      <Text style={{ fontSize: 11, color: token.colorSuccess, fontWeight: 600, display: "block", marginBottom: 6 }}>
        Ví dụ
      </Text>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 14px 1fr", gap: "2px 8px" }}>
        {rows.map(([s, c]) => (
          <>
            <Text key={`s-${s}`} type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>{s}</Text>
            <Text key={`a-${s}`} type="secondary" style={{ fontSize: 12 }}>→</Text>
            <Text key={`c-${s}`} style={{ fontSize: 11, fontFamily: "monospace", color: token.colorSuccess }}>{c}</Text>
          </>
        ))}
      </div>
    </div>
  );
}

// ─── ProfileDrawer ────────────────────────────────────────────────────────────

export function ProfileDrawer({
  open,
  editing,
  saving,
  onClose,
  onSave,
}: {
  open:    boolean;
  editing: SourceProfile | null;
  saving:  boolean;
  onClose: () => void;
  onSave:  (values: ProfileFormValues) => Promise<void>;
}) {
  const [form] = Form.useForm<ProfileFormValues>();

  const rawMappingRows = Form.useWatch("mappings", form);
  const mappingRows = useMemo(() => (rawMappingRows ?? []) as MappingRow[], [rawMappingRows]);
  const canonicalOptions = useMemo(
    () =>
      [...new Set(mappingRows.map((r) => r?.canonicalField?.trim()).filter(Boolean))].map(
        (v) => ({ label: v, value: v }),
      ),
    [mappingRows],
  );

  const previewValues = Form.useWatch([], form) as ProfileFormValues | undefined;

  // Populate form ngay khi mở drawer
  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        sourceSystem:     editing.sourceSystem,
        recordType:       editing.recordType,
        displayName:      editing.displayName,
        businessKeyField: editing.businessKeyField,
        mappings:         mappingsToRows(editing.mappings),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ mappings: [EMPTY_MAPPING_ROW] });
    }
  }, [open, editing, form]);

  async function handleSave() {
    let values: ProfileFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const canonicals = mappingRows.map((r) => r?.canonicalField?.trim()).filter(Boolean);
    if (!canonicals.includes(values.businessKeyField)) {
      form.setFields([{
        name:   "businessKeyField",
        errors: ["Phải là một trong các giá trị canonical (cột phải) của mappings bên trên"],
      }]);
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {editing
          ? "(sourceSystem, recordType) không thể thay đổi"
          : "businessKeyField phải là canonical value trong mappings"}
      </Text>
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          {editing ? "Lưu thay đổi" : "+ Tạo Profile"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Chỉnh sửa: ${editing.displayName}` : "Thêm Source Profile mới"}
      styles={{ wrapper: { width: 600 } }}
      footer={footer}
      destroyOnHidden
    >
      <IdentifierStrip
        form={previewValues ?? { sourceSystem: "", recordType: "", displayName: "", businessKeyField: "", mappings: [] }}
      />

      <Form form={form} layout="vertical" component="div">
        {/* Phần 1: Định danh */}
        <SectionHeader>Định danh</SectionHeader>

        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item
            name="sourceSystem"
            label="Source System"
            tooltip="Mã nguồn dữ liệu, ví dụ: his-01, bhyt-hn"
            rules={[
              { required: true, message: "Bắt buộc" },
              { max: 100, message: "Tối đa 100 ký tự" },
              { pattern: /^[a-z0-9-_]+$/, message: "Chỉ chữ thường, số, - hoặc _" },
            ]}
          >
            <Input placeholder="his-01" className="font-mono" disabled={!!editing} />
          </Form.Item>

          <Form.Item
            name="recordType"
            label="Record Type"
            tooltip="Loại tài liệu, ví dụ: benh-nhan, chung-tu"
            rules={[
              { required: true, message: "Bắt buộc" },
              { max: 100, message: "Tối đa 100 ký tự" },
              { pattern: /^[a-z0-9-_]+$/, message: "Chỉ chữ thường, số, - hoặc _" },
            ]}
          >
            <Input placeholder="benh-nhan" className="font-mono" disabled={!!editing} />
          </Form.Item>
        </div>

        {editing && (
          <Text type="warning" style={{ fontSize: 11, display: "block", marginTop: -12, marginBottom: 16 }}>
            ⚠ Khóa định danh không thể thay đổi sau khi tạo.
          </Text>
        )}

        <Form.Item
          name="displayName"
          label="Tên hiển thị"
          rules={[
            { required: true, message: "Bắt buộc" },
            { max: 200, message: "Tối đa 200 ký tự" },
          ]}
        >
          <Input placeholder="HIS Bệnh viện A — Hồ sơ bệnh nhân" />
        </Form.Item>

        {/* Phần 2: Field Mappings */}
        <SectionHeader>Field Mappings</SectionHeader>

        <Form.List
          name="mappings"
          rules={[{
            validator: async (_, rows: MappingRow[]) => {
              const valid = rows?.filter((r) => r?.sourceField?.trim() && r?.canonicalField?.trim());
              if (!valid?.length) throw new Error("Phải có ít nhất một mapping hợp lệ");
            },
          }]}
        >
          {(fields, { add, remove }, { errors }) => (
            <MappingEditor fields={fields} add={add} remove={remove} errors={errors} />
          )}
        </Form.List>

        <ExampleBox />

        {/* Phần 3: Business Key */}
        <SectionHeader>Business Key</SectionHeader>

        <Form.Item
          name="businessKeyField"
          label="Business Key Field"
          extra="Phải là một trong các giá trị canonical (cột phải) của mappings bên trên."
          rules={[{ required: true, message: "Bắt buộc" }]}
        >
          <Select
            placeholder={
              canonicalOptions.length > 0
                ? "Chọn canonical field làm khóa nghiệp vụ"
                : "Nhập canonical field ở mappings trước"
            }
            options={canonicalOptions}
            showSearch
            allowClear
            notFoundContent={
              <Text type="secondary" style={{ fontSize: 12, padding: "4px 0", display: "block" }}>
                Chưa có giá trị. Nhập vào cột phải (canonical) của mappings.
              </Text>
            }
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
