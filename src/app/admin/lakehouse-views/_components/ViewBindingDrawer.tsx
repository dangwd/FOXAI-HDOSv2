"use client";

// Drawer tạo / chỉnh sửa ViewBinding.
// Pattern: mirror của ProfileDrawer trong datasources — Form + SectionHeader + preview strip.
// Khác biệt: sourceSystem/recordType dùng Select lấy từ SourceProfile list (dropdown động).

import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  theme,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { adminApi, type DmSourceProfile } from "@/infrastructure/http/adminApi";
import { bindingToFormValues, type ViewBinding, type ViewBindingFormValues } from "../_lib/types";

const { Text } = Typography;

// ─── SectionHeader ────────────────────────────────────────────────────────────
// Đồng nhất với ProfileDrawer — dùng theme token

function SectionHeader({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 16px" }}>
      <span style={{
        fontSize:      10,
        fontWeight:    700,
        color:         token.colorTextTertiary,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        whiteSpace:    "nowrap",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: token.colorSplit }} />
    </div>
  );
}

// ─── Preview strip ────────────────────────────────────────────────────────────

function BindingPreviewStrip({ form }: { form: ViewBindingFormValues }) {
  const { token } = theme.useToken();
  const view = form.viewName      || "schema.view_name";
  const sys  = form.sourceSystem  || "lakehouse:...";
  const type = form.recordType    || "record-type";

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
      {/* Icon */}
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
        {/* Table/view icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Text code style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{view}</Text>
        <Space size={4} wrap>
          <Text style={{ fontSize: 11, color: "#34d399", fontFamily: "monospace" }}>{sys}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
          <Text code style={{ fontSize: 11 }}>{type}</Text>
        </Space>
      </div>
    </div>
  );
}

// ─── ViewBindingDrawer ────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  editing: ViewBinding | null;
  saving:  boolean;
  onClose: () => void;
  onSave:  (values: ViewBindingFormValues) => Promise<void>;
}

export function ViewBindingDrawer({ open, editing, saving, onClose, onSave }: Props) {
  const [form] = Form.useForm<ViewBindingFormValues>();

  // Load SourceProfile list để cho dropdown sourceSystem / recordType
  const [profiles, setProfiles]     = useState<DmSourceProfile[]>([]);
  const [profilesLoading, setPLoading] = useState(false);

  // Theo dõi sourceSystem đang chọn để lọc recordType
  const selectedSystem = Form.useWatch("sourceSystem", form);

  useEffect(() => {
    if (!open) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPLoading(true);
    adminApi.listSourceProfiles()
      .then((data) => { if (active) setProfiles(data ?? []); })
      .catch(() => { if (active) setProfiles([]); })
      .finally(() => { if (active) setPLoading(false); });
    return () => { active = false; };
  }, [open]);

  // Options sourceSystem — ưu tiên "lakehouse:*" lên đầu (use-case chính của trang này)
  const sourceSystemOptions = useMemo(() => {
    const systems = [...new Set(profiles.map((p) => p.sourceSystem))].sort((a, b) => {
      const aLake = a.startsWith("lakehouse:") ? 0 : 1;
      const bLake = b.startsWith("lakehouse:") ? 0 : 1;
      return aLake - bLake || a.localeCompare(b);
    });
    return systems.map((s) => ({ label: s, value: s }));
  }, [profiles]);

  // Options recordType — filter theo sourceSystem đang chọn
  const recordTypeOptions = useMemo(() => {
    if (!selectedSystem) return [];
    return profiles
      .filter((p) => p.sourceSystem === selectedSystem)
      .map((p) => ({ label: p.recordType, value: p.recordType }));
  }, [profiles, selectedSystem]);

  // Populate form khi mở drawer
  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue(bindingToFormValues(editing));
    } else {
      form.resetFields();
      form.setFieldsValue({ pollIntervalSeconds: 300, updatedAtColumn: "updated_at" });
    }
  }, [open, editing, form]);

  // Reset recordType khi đổi sourceSystem (chỉ ở create mode)
  function handleSystemChange() {
    if (!editing) form.setFieldValue("recordType", undefined);
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {editing
          ? "viewName + sourceSystem + recordType không thể thay đổi"
          : "sourceSystem / recordType phải khớp với SourceProfile đã đăng ký"}
      </Text>
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          {editing ? "Lưu thay đổi" : "+ Tạo Binding"}
        </Button>
      </Space>
    </div>
  );

  const previewValues = Form.useWatch([], form) as ViewBindingFormValues | undefined;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={editing ? `Chỉnh sửa: ${editing.viewName}` : "Thêm ViewBinding mới"}
      styles={{ wrapper: { width: 560 } }}
      footer={footer}
      destroyOnHidden
    >
      <BindingPreviewStrip
        form={previewValues ?? { viewName: "", sourceSystem: "", recordType: "", businessKeyColumn: "", updatedAtColumn: "", pollIntervalSeconds: 300 }}
      />

      <Form form={form} layout="vertical" component="div">

        {/* Phần 1: Định danh view */}
        <SectionHeader>PostgreSQL View</SectionHeader>

        <Form.Item
          name="viewName"
          label="View Name"
          tooltip='Tên đầy đủ dạng "schema.view_name", ví dụ: warehouse.v_lab_results_v1'
          rules={[
            { required: true, message: "Bắt buộc" },
            { max: 200, message: "Tối đa 200 ký tự" },
            { pattern: /^\w+\.\w+$/, message: 'Phải theo dạng "schema.view_name"' },
          ]}
        >
          <Input
            placeholder="warehouse.v_lab_results_v1"
            className="font-mono"
            disabled={!!editing}
          />
        </Form.Item>

        {editing && (
          <Text type="warning" style={{ fontSize: 11, display: "block", marginTop: -12, marginBottom: 16 }}>
            ⚠ View name không thể thay đổi sau khi tạo.
          </Text>
        )}

        {/* Phần 2: Liên kết SourceProfile */}
        <SectionHeader>Liên kết SourceProfile</SectionHeader>

        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item
            name="sourceSystem"
            label="Source System"
            tooltip='Phải khớp với SourceProfile đã đăng ký. Lakehouse views dùng tiền tố "lakehouse:"'
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Select
              placeholder="lakehouse:v_lab_results_v1"
              options={sourceSystemOptions}
              loading={profilesLoading}
              showSearch
              disabled={!!editing}
              onChange={handleSystemChange}
              notFoundContent={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chưa có SourceProfile. Tạo ở trang Data Matching trước.
                </Text>
              }
            />
          </Form.Item>

          <Form.Item
            name="recordType"
            label="Record Type"
            tooltip="Phải khớp với SourceProfile của source system đã chọn"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Select
              placeholder={selectedSystem ? "Chọn record type" : "Chọn Source System trước"}
              options={recordTypeOptions}
              disabled={!!editing || !selectedSystem}
              showSearch
              notFoundContent={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Source system này chưa có record type nào.
                </Text>
              }
            />
          </Form.Item>
        </div>

        {editing && (
          <Text type="warning" style={{ fontSize: 11, display: "block", marginTop: -12, marginBottom: 16 }}>
            ⚠ sourceSystem + recordType không thể thay đổi sau khi tạo.
          </Text>
        )}

        {/* Phần 3: Cấu hình poll */}
        <SectionHeader>Cấu hình Poll</SectionHeader>

        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item
            name="businessKeyColumn"
            label="Business Key Column"
            tooltip="Tên cột trong PG view dùng làm business key, ví dụ: business_key"
            rules={[
              { required: true, message: "Bắt buộc" },
              { pattern: /^\w+$/, message: "Chỉ chữ cái, số, gạch dưới" },
            ]}
          >
            <Input placeholder="business_key" className="font-mono" />
          </Form.Item>

          <Form.Item
            name="updatedAtColumn"
            label="Updated At Column"
            tooltip="Cột timestamp để incremental poll — chỉ lấy rows có updated_at > lastSync"
            rules={[
              { required: true, message: "Bắt buộc" },
              { pattern: /^\w+$/, message: "Chỉ chữ cái, số, gạch dưới" },
            ]}
          >
            <Input placeholder="updated_at" className="font-mono" />
          </Form.Item>
        </div>

        <Form.Item
          name="pollIntervalSeconds"
          label="Poll Interval (giây)"
          tooltip="Tần suất poll — mặc định 300s (5 phút). Tối thiểu 60s."
          rules={[
            { required: true, message: "Bắt buộc" },
            { type: "number", min: 60, message: "Tối thiểu 60 giây" },
            { type: "number", max: 86400, message: "Tối đa 86400 giây (1 ngày)" },
          ]}
        >
          <InputNumber
            min={60}
            max={86400}
            step={60}
            style={{ width: "100%" }}
            addonAfter="giây"
          />
        </Form.Item>

      </Form>
    </Drawer>
  );
}
