"use client";

import httpClient from "@/infrastructure/http/httpClient";
import {
  Alert,
  App,
  Button,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { Archive, Eye, Plus, Send, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const { Text } = Typography;
const { TextArea } = Input;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ApiModule {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  formCount: number;
  createdAtUtc: string;
}

interface FormTemplate {
  id: string;
  moduleCode: string;
  key: string;
  name: string;
  status: "Draft" | "Published" | "Archived";
  version: number;
  fieldCount: number;
  createdAtUtc: string;
}

interface FieldDef {
  id: string;
  key: string;
  label: string;
  type: string;
  order: number;
  required: boolean;
  width: number;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
}

interface PageDef {
  id: string;
  moduleCode: string;
  code: string;
  title: string;
  status: "Draft" | "Published" | "Archived";
  createdAtUtc: string;
}

interface Submission {
  id: string;
  moduleCode: string;
  formKey: string;
  formVersion: number;
  status: string;
  submittedAt: string;
  answers: Record<string, string>;
}

// ─── API helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  method: "get" | "post" | "put",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await httpClient[method]<{
    success: boolean;
    data: T;
    error?: { message: string };
  }>(path, body);
  if (!res.data.success)
    throw new Error(res.data.error?.message ?? "API error");
  return res.data.data;
}

const apiGet = <T,>(path: string) => apiFetch<T>("get", path);
const apiPost = <T,>(path: string, b?: unknown) => apiFetch<T>("post", path, b);
const apiPut = <T,>(path: string, b?: unknown) => apiFetch<T>("put", path, b);

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Active: "green",
  Inactive: "red",
  Draft: "orange",
  Published: "green",
  Archived: "default",
  Submitted: "blue",
};

const FIELD_TYPES = [
  { label: "Text", value: 0 },
  { label: "Textarea", value: 1 },
  { label: "Number", value: 2 },
  { label: "Date", value: 3 },
  { label: "DateTime", value: 4 },
  { label: "Select", value: 5 },
  { label: "MultiSelect", value: 6 },
  { label: "Radio", value: 7 },
  { label: "Checkbox", value: 8 },
  { label: "File", value: 9 },
  { label: "Signature", value: 10 },
  { label: "Section", value: 11 },
];

// Select=5, MultiSelect=6, Radio=7 cần options
const OPTION_FIELD_TYPES = new Set([5, 6, 7]);

const LAYOUT_TEMPLATE = JSON.stringify(
  {
    rows: [
      {
        components: [
          {
            type: "FormSection",
            span: 8,
            formKey: "your-form-key",
            title: "Tiêu đề form",
          },
          { type: "FormSection", span: 4, formKey: "your-other-form-key" },
        ],
      },
      {
        components: [
          {
            type: "TextBlock",
            span: 12,
            content: "Ghi chú phía dưới...",
            align: "center",
          },
        ],
      },
      {
        components: [{ type: "Divider", span: 12, label: "Xác nhận" }],
      },
    ],
  },
  null,
  2,
);

// ─── Modules Tab ───────────────────────────────────────────────────────────────

function ModulesTab({ onLoaded }: { onLoaded: (ms: ApiModule[]) => void }) {
  const { message } = App.useApp();
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiGet<ApiModule[]>("/forms/modules");
        setModules(data);
        onLoaded(data);
      } catch (e) {
        message.error(`Không tải được module: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [message, onLoaded, tick]);

  const handleCreate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      await apiPost("/forms/admin/modules", values);
      message.success("Tạo module thành công");
      form.resetFields();
      setOpen(false);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(`Tạo thất bại: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
          {modules.length} module
        </Text>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => setOpen(true)}
        >
          Tạo Module
        </Button>
      </div>

      <Table
        size="small"
        loading={loading}
        dataSource={modules}
        rowKey="id"
        pagination={false}
        columns={[
          {
            title: "Code",
            dataIndex: "code",
            width: 160,
            render: (v: string) => <Text code>{v}</Text>,
          },
          { title: "Tên", dataIndex: "name" },
          {
            title: "Mô tả",
            dataIndex: "description",
            render: (v?: string) => v ?? <Text type="secondary">—</Text>,
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 110,
            render: (v: string) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
          },
          {
            title: "Số form",
            dataIndex: "formCount",
            width: 80,
            align: "center" as const,
          },
          {
            title: "Tạo lúc",
            dataIndex: "createdAtUtc",
            width: 160,
            render: (v: string) => new Date(v).toLocaleString("vi-VN"),
          },
        ]}
      />

      <Drawer
        title="Tạo Module mới"
        open={open}
        onClose={() => {
          setOpen(false);
          form.resetFields();
        }}
        styles={{ wrapper: { width: 480 } }}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setOpen(false);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" loading={saving} onClick={handleCreate}>
              Tạo
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: "Nhập code" },
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Chỉ dùng chữ thường, số, gạch ngang (-)",
              },
              { max: 50 },
            ]}
          >
            <Input placeholder="vd: tiep-nhan" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên hiển thị"
            rules={[{ required: true }, { max: 200 }]}
          >
            <Input placeholder="vd: Tiếp nhận bệnh nhân" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="Mô tả ngắn về module"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}

// ─── Forms Tab ─────────────────────────────────────────────────────────────────

function FormsTab({ modules }: { modules: ApiModule[] }) {
  const { message } = App.useApp();
  const [moduleCode, setModuleCode] = useState<string | null>(null);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      if (!moduleCode) {
        setForms([]);
        return;
      }
      setLoading(true);
      try {
        const data = await apiGet<FormTemplate[]>(`/forms/${moduleCode}`);
        setForms(data);
      } catch (e) {
        message.error(`Không tải được form: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [moduleCode, message, tick]);

  const handleCreate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values || !moduleCode) return;
    setSaving(true);
    try {
      await apiPost(`/forms/admin/modules/${moduleCode}/forms`, values);
      message.success("Tạo form thành công");
      form.resetFields();
      setOpen(false);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(`Tạo thất bại: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (r: FormTemplate) => {
    try {
      await apiPost(`/forms/admin/forms/${r.id}/publish`);
      message.success(`Đã publish "${r.name}"`);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(`Publish thất bại: ${(e as Error).message}`);
    }
  };

  const handleArchive = async (r: FormTemplate) => {
    try {
      await apiPost(`/forms/admin/forms/${r.id}/archive`);
      message.success(`Đã archive "${r.name}"`);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(`Archive thất bại: ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
            Module:
          </Text>
          <Select
            style={{ width: 280 }}
            placeholder="Chọn module"
            onChange={setModuleCode}
            options={modules.map((m) => ({
              label: `${m.name} (${m.code})`,
              value: m.code,
            }))}
          />
        </div>
        {moduleCode && (
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setOpen(true)}
          >
            Tạo Form
          </Button>
        )}
      </div>

      <Table
        size="small"
        loading={loading}
        dataSource={forms}
        rowKey="id"
        locale={{
          emptyText: moduleCode ? "Chưa có form" : "Chọn module để xem",
        }}
        columns={[
          {
            title: "Key",
            dataIndex: "key",
            width: 180,
            render: (v: string) => <Text code>{v}</Text>,
          },
          { title: "Tên form", dataIndex: "name" },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 110,
            render: (v: string) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
          },
          {
            title: "Ver",
            dataIndex: "version",
            width: 60,
            align: "center" as const,
          },
          {
            title: "Fields",
            dataIndex: "fieldCount",
            width: 70,
            align: "center" as const,
          },
          {
            title: "Hành động",
            width: 220,
            render: (_: unknown, r: FormTemplate) => (
              <Space>
                {r.status !== "Archived" && (
                  <Popconfirm
                    title={`Publish form "${r.name}"?`}
                    description="Form phải có ít nhất 1 field."
                    onConfirm={() => handlePublish(r)}
                    okText="Publish"
                    cancelText="Hủy"
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={<Send size={12} />}
                    >
                      Publish
                    </Button>
                  </Popconfirm>
                )}
                {r.status !== "Archived" && (
                  <Popconfirm
                    title="Archive form này?"
                    description="Không thể khôi phục."
                    onConfirm={() => handleArchive(r)}
                    okText="Archive"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" danger icon={<Archive size={12} />}>
                      Archive
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={`Tạo Form — module "${moduleCode}"`}
        open={open}
        onClose={() => {
          setOpen(false);
          form.resetFields();
        }}
        styles={{ wrapper: { width: 520 } }}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setOpen(false);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" loading={saving} onClick={handleCreate}>
              Tạo
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="key"
                label="Key"
                rules={[
                  { required: true },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "Chữ thường, số, gạch ngang",
                  },
                ]}
              >
                <Input placeholder="vd: phieu-tiep-nhan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên form"
                rules={[{ required: true }]}
              >
                <Input placeholder="vd: Phiếu Tiếp Nhận" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="submitButtonLabel"
                label="Nhãn nút submit"
                initialValue="Gửi"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="successMessage"
                label="Thông báo sau submit"
                initialValue="Đã gửi form thành công"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="allowMultipleSubmissions"
            label="Cho phép submit nhiều lần"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}

// ─── Fields Tab ────────────────────────────────────────────────────────────────

function FieldsTab({ modules }: { modules: ApiModule[] }) {
  const { message } = App.useApp();
  const [moduleCode, setModuleCode] = useState<string | null>(null);
  const [allForms, setAllForms] = useState<FormTemplate[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldType, setFieldType] = useState<number>(0);
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [optInput, setOptInput] = useState({ label: "", value: "" });
  const [form] = Form.useForm();

  const loadSchema = useCallback(async (f: FormTemplate) => {
    if (f.status === "Draft") {
      setFields([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<{ fields: FieldDef[] }>(
        `/forms/${f.moduleCode}/${f.key}/schema`,
      );
      setFields(data.fields ?? []);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setSelectedForm(null);
      setFields([]);
      if (!moduleCode) {
        setAllForms([]);
        return;
      }
      try {
        const data = await apiGet<FormTemplate[]>(`/forms/${moduleCode}`);
        setAllForms(data);
      } catch {
        setAllForms([]);
      }
    })();
  }, [moduleCode]);

  const openModal = () => {
    form.resetFields();
    form.setFieldsValue({
      fieldType: 0,
      width: 0,
      required: false,
      order: (selectedForm?.fieldCount ?? 0) + 1,
    });
    setFieldType(0);
    setOptions([]);
    setOptInput({ label: "", value: "" });
    setOpen(true);
  };

  const handleAdd = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values || !selectedForm) return;
    const needsOpts = OPTION_FIELD_TYPES.has(fieldType);
    if (needsOpts && options.length === 0) {
      message.warning("Loại field này cần ít nhất 1 option");
      return;
    }
    setSaving(true);
    try {
      await apiPost(`/forms/admin/forms/${selectedForm.id}/fields`, {
        ...values,
        options: needsOpts ? options : null,
        validationRules: null,
        conditionalLogic: null,
      });
      message.success(`Thêm field "${values.key}" thành công`);
      setOpen(false);
      // Refresh fieldCount trên form
      if (moduleCode) {
        const updated = await apiGet<FormTemplate[]>(`/forms/${moduleCode}`);
        setAllForms(updated);
        const fresh = updated.find((x) => x.id === selectedForm.id);
        if (fresh) setSelectedForm(fresh);
      }
    } catch (e) {
      message.error(`Thêm thất bại: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const needsOptions = OPTION_FIELD_TYPES.has(fieldType);

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
            Module:
          </Text>
          <Select
            style={{ width: 240 }}
            placeholder="Chọn module"
            onChange={(v) => setModuleCode(v)}
            options={modules.map((m) => ({
              label: `${m.name} (${m.code})`,
              value: m.code,
            }))}
          />
        </div>

        {allForms.length > 0 && (
          <div className="flex items-center gap-2">
            <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
              Form:
            </Text>
            <Select
              style={{ width: 300 }}
              placeholder="Chọn form"
              onChange={(v) => {
                const f = allForms.find((x) => x.id === v) ?? null;
                setSelectedForm(f);
                if (f) loadSchema(f);
              }}
              options={allForms.map((f) => ({
                label: `${f.name} — ${f.status} (${f.fieldCount} field)`,
                value: f.id,
              }))}
            />
          </div>
        )}

        {selectedForm?.status === "Draft" && (
          <Button type="primary" icon={<Plus size={14} />} onClick={openModal}>
            Thêm Field
          </Button>
        )}
      </div>

      {selectedForm?.status === "Draft" && (
        <Alert
          type="info"
          showIcon
          className="mb-3"
          title={`Form đang ở Draft — ${selectedForm.fieldCount} field. Publish ở tab Forms để xem danh sách field.`}
        />
      )}

      {selectedForm?.status === "Archived" && (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          title="Form đã Archived — chỉ xem, không thể thêm field."
        />
      )}

      <Table
        size="small"
        loading={loading}
        dataSource={fields}
        rowKey="id"
        locale={{
          emptyText: !selectedForm
            ? "Chọn module và form"
            : selectedForm.status === "Draft"
              ? "Form đang Draft — schema chưa có. Thêm field rồi Publish để xem."
              : "Không có field nào",
        }}
        columns={[
          {
            title: "Order",
            dataIndex: "order",
            width: 70,
            align: "center" as const,
          },
          {
            title: "Key",
            dataIndex: "key",
            width: 160,
            render: (v: string) => <Text code>{v}</Text>,
          },
          { title: "Label", dataIndex: "label" },
          {
            title: "Type",
            dataIndex: "type",
            width: 110,
            render: (v: string) => <Tag>{v}</Tag>,
          },
          { title: "Width", dataIndex: "width", width: 80 },
          {
            title: "Bắt buộc",
            dataIndex: "required",
            width: 90,
            render: (v: boolean) =>
              v ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>,
          },
        ]}
      />

      <Drawer
        title={`Thêm Field — ${selectedForm?.name}`}
        open={open}
        onClose={() => setOpen(false)}
        styles={{ wrapper: { width: 560 } }}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="primary" loading={saving} onClick={handleAdd}>
              Thêm Field
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="key"
                label="Key"
                rules={[
                  { required: true, message: "Nhập key" },
                  {
                    pattern: /^[a-z0-9_]+$/,
                    message: "Chữ thường, số, gạch dưới (_)",
                  },
                ]}
              >
                <Input placeholder="vd: ho_ten" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="label"
                label="Label"
                rules={[{ required: true }]}
              >
                <Input placeholder="vd: Họ và tên" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="fieldType"
                label="Loại field"
                rules={[{ required: true }]}
              >
                <Select options={FIELD_TYPES} onChange={setFieldType} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="width"
                label="Width"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: "Full — 100%", value: 0 },
                    { label: "Half — 50%", value: 1 },
                    { label: "Third — 33%", value: 2 },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="order"
                label="Order"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="required"
                label="Bắt buộc"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="placeholder" label="Placeholder">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="helpText" label="Help Text">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {needsOptions && (
            <Form.Item label={`Options (${options.length} mục)`} required>
              <div className="border border-gray-200 dark:border-[#30363d] rounded-lg p-3 space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Text code className="text-xs min-w-[80px]">
                      {opt.value}
                    </Text>
                    <Text className="text-sm flex-1">{opt.label}</Text>
                    <Button
                      size="small"
                      danger
                      onClick={() =>
                        setOptions((p) => p.filter((_, j) => j !== i))
                      }
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#21262d]">
                  <Input
                    size="small"
                    placeholder="value (vd: male)"
                    style={{ width: 140 }}
                    value={optInput.value}
                    onChange={(e) =>
                      setOptInput((p) => ({ ...p, value: e.target.value }))
                    }
                    onPressEnter={() => {
                      if (!optInput.value.trim() || !optInput.label.trim())
                        return;
                      setOptions((p) => [
                        ...p,
                        {
                          value: optInput.value.trim(),
                          label: optInput.label.trim(),
                        },
                      ]);
                      setOptInput({ label: "", value: "" });
                    }}
                  />
                  <Input
                    size="small"
                    placeholder="label (vd: Nam)"
                    style={{ width: 140 }}
                    value={optInput.label}
                    onChange={(e) =>
                      setOptInput((p) => ({ ...p, label: e.target.value }))
                    }
                    onPressEnter={() => {
                      if (!optInput.value.trim() || !optInput.label.trim())
                        return;
                      setOptions((p) => [
                        ...p,
                        {
                          value: optInput.value.trim(),
                          label: optInput.label.trim(),
                        },
                      ]);
                      setOptInput({ label: "", value: "" });
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      if (!optInput.value.trim() || !optInput.label.trim())
                        return;
                      setOptions((p) => [
                        ...p,
                        {
                          value: optInput.value.trim(),
                          label: optInput.label.trim(),
                        },
                      ]);
                      setOptInput({ label: "", value: "" });
                    }}
                  >
                    + Thêm
                  </Button>
                </div>
              </div>
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </>
  );
}

// ─── Pages Tab ─────────────────────────────────────────────────────────────────

function PagesTab({ modules }: { modules: ApiModule[] }) {
  const { message } = App.useApp();
  const [moduleCode, setModuleCode] = useState<string | null>(null);
  const [pages, setPages] = useState<PageDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PageDef | null>(null);
  const [layoutJson, setLayoutJson] = useState(LAYOUT_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      if (!moduleCode) {
        setPages([]);
        return;
      }
      setLoading(true);
      try {
        const data = await apiGet<PageDef[]>(`/forms/pages/${moduleCode}`);
        setPages(data);
      } catch (e) {
        message.error(`Không tải được page: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [moduleCode, message, tick]);

  const handleCreate = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values || !moduleCode) return;
    setSaving(true);
    try {
      await apiPost(`/forms/admin/modules/${moduleCode}/pages`, values);
      message.success("Tạo page thành công");
      form.resetFields();
      setCreateOpen(false);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(`Tạo thất bại: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSetLayout = async () => {
    if (!selectedPage) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(layoutJson);
    } catch {
      message.error("JSON không hợp lệ — kiểm tra lại cú pháp");
      return;
    }
    setSaving(true);
    try {
      await apiPut(`/forms/admin/pages/${selectedPage.id}/layout`, parsed);
      message.success("Cập nhật layout thành công");
      setLayoutOpen(false);
    } catch (e) {
      message.error(`Cập nhật thất bại: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (p: PageDef) => {
    try {
      await apiPost(`/forms/admin/pages/${p.id}/publish`);
      message.success(`Đã publish page "${p.title}"`);
      setTick((t) => t + 1);
    } catch (e) {
      message.error(`Publish thất bại: ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
            Module:
          </Text>
          <Select
            style={{ width: 280 }}
            placeholder="Chọn module"
            onChange={setModuleCode}
            options={modules.map((m) => ({
              label: `${m.name} (${m.code})`,
              value: m.code,
            }))}
          />
        </div>
        {moduleCode && (
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Tạo Page
          </Button>
        )}
      </div>

      <Table
        size="small"
        loading={loading}
        dataSource={pages}
        rowKey="id"
        locale={{
          emptyText: moduleCode ? "Chưa có page" : "Chọn module để xem",
        }}
        columns={[
          {
            title: "Code",
            dataIndex: "code",
            width: 200,
            render: (v: string) => <Text code>{v}</Text>,
          },
          { title: "Tiêu đề", dataIndex: "title" },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 110,
            render: (v: string) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
          },
          {
            title: "Tạo lúc",
            dataIndex: "createdAtUtc",
            width: 160,
            render: (v: string) => new Date(v).toLocaleString("vi-VN"),
          },
          {
            title: "Hành động",
            width: 220,
            render: (_: unknown, r: PageDef) => (
              <Space>
                <Button
                  size="small"
                  icon={<Settings size={12} />}
                  onClick={() => {
                    setSelectedPage(r);
                    setLayoutJson(LAYOUT_TEMPLATE);
                    setLayoutOpen(true);
                  }}
                >
                  Layout
                </Button>
                {r.status !== "Archived" && (
                  <Popconfirm
                    title={`Publish page "${r.title}"?`}
                    description="Các form trong layout phải đã Published."
                    onConfirm={() => handlePublish(r)}
                    okText="Publish"
                    cancelText="Hủy"
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={<Send size={12} />}
                    >
                      Publish
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      {/* Create drawer */}
      <Drawer
        title="Tạo Page mới"
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        styles={{ wrapper: { width: 480 } }}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setCreateOpen(false);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button type="primary" loading={saving} onClick={handleCreate}>
              Tạo
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true },
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Chữ thường, số, gạch ngang",
              },
            ]}
          >
            <Input placeholder="vd: man-hinh-tiep-nhan" />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="vd: Màn hình Tiếp nhận" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Layout editor drawer */}
      <Drawer
        title={`Layout Editor — ${selectedPage?.title}`}
        open={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        styles={{ wrapper: { width: 720 } }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setLayoutOpen(false)}>Hủy</Button>
            <Button type="primary" loading={saving} onClick={handleSetLayout}>
              Lưu Layout
            </Button>
          </div>
        }
      >
        <Alert
          className="mb-3"
          type="info"
          showIcon
          title='Types: "FormSection" | "TextBlock" | "Divider". Span tổng mỗi row ≤ 12. formKey phải trỏ form đã Published cùng module.'
        />
        <TextArea
          value={layoutJson}
          onChange={(e) => setLayoutJson(e.target.value)}
          rows={22}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Drawer>
    </>
  );
}

// ─── Submissions Tab ───────────────────────────────────────────────────────────

function SubmissionsTab({ modules }: { modules: ApiModule[] }) {
  const { message } = App.useApp();
  const [moduleCode, setModuleCode] = useState<string | null>(null);
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Submission | null>(null);

  const loadSubs = useCallback(
    async (formId: string, p = 1) => {
      setLoading(true);
      try {
        const data = await apiGet<Submission[]>(
          `/forms/admin/forms/${formId}/submissions?page=${p}&pageSize=20`,
        );
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (e) {
        message.error(`Không tải được submissions: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    (async () => {
      setSelectedFormId(null);
      setSubmissions([]);
      if (!moduleCode) return;
      try {
        const data = await apiGet<FormTemplate[]>(`/forms/${moduleCode}`);
        setForms(data);
      } catch {
        setForms([]);
      }
    })();
  }, [moduleCode]);

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
            Module:
          </Text>
          <Select
            style={{ width: 240 }}
            placeholder="Chọn module"
            onChange={(v) => setModuleCode(v)}
            options={modules.map((m) => ({
              label: `${m.name} (${m.code})`,
              value: m.code,
            }))}
          />
        </div>
        {forms.length > 0 && (
          <div className="flex items-center gap-2">
            <Text className="text-sm text-gray-500 dark:text-[#8b949e]">
              Form:
            </Text>
            <Select
              style={{ width: 280 }}
              placeholder="Chọn form"
              onChange={(v) => {
                setSelectedFormId(v);
                setPage(1);
                loadSubs(v, 1);
              }}
              options={forms.map((f) => ({
                label: `${f.name} (${f.status})`,
                value: f.id,
              }))}
            />
          </div>
        )}
        {selectedFormId && (
          <Button onClick={() => loadSubs(selectedFormId, page)}>
            Tải lại
          </Button>
        )}
      </div>

      <Table
        size="small"
        loading={loading}
        dataSource={submissions}
        rowKey="id"
        locale={{
          emptyText: selectedFormId
            ? "Chưa có submission"
            : "Chọn module và form",
        }}
        pagination={{
          current: page,
          pageSize: 20,
          onChange: (p) => {
            setPage(p);
            if (selectedFormId) loadSubs(selectedFormId, p);
          },
        }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            width: 220,
            render: (v: string) => (
              <Text code style={{ fontSize: 11 }}>
                {v.substring(0, 18)}…
              </Text>
            ),
          },
          { title: "Form", dataIndex: "formKey", width: 160 },
          {
            title: "Ver",
            dataIndex: "formVersion",
            width: 60,
            align: "center" as const,
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            width: 100,
            render: (v: string) => (
              <Tag color={STATUS_COLOR[v] ?? "blue"}>{v}</Tag>
            ),
          },
          {
            title: "Gửi lúc",
            dataIndex: "submittedAt",
            width: 160,
            render: (v: string) => new Date(v).toLocaleString("vi-VN"),
          },
          {
            title: "",
            width: 70,
            render: (_: unknown, r: Submission) => (
              <Button
                size="small"
                icon={<Eye size={12} />}
                onClick={() => setDetail(r)}
              >
                Xem
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        title="Chi tiết Submission"
        open={!!detail}
        onClose={() => setDetail(null)}
        styles={{ wrapper: { width: 520 } }}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setDetail(null)}>Đóng</Button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-2 text-sm">
            <div>
              <Text type="secondary">ID: </Text>
              <Text code style={{ fontSize: 11 }}>
                {detail.id}
              </Text>
            </div>
            <div>
              <Text type="secondary">Form: </Text>
              {detail.formKey} v{detail.formVersion}
            </div>
            <div>
              <Text type="secondary">Gửi lúc: </Text>
              {new Date(detail.submittedAt).toLocaleString("vi-VN")}
            </div>
            <Divider className="my-3">Nội dung trả lời</Divider>
            <Table
              size="small"
              pagination={false}
              dataSource={Object.entries(detail.answers).map(([k, v]) => ({
                k,
                v,
              }))}
              rowKey="k"
              columns={[
                {
                  title: "Field",
                  dataIndex: "k",
                  width: 180,
                  render: (v: string) => <Text code>{v}</Text>,
                },
                { title: "Giá trị", dataIndex: "v" },
              ]}
            />
          </div>
        )}
      </Drawer>
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DynamicFormsPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
            DynamicForm Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
            Quản lý Module · Form · Field · Page · Submission —
            DynamicFormService API v3
          </p>
        </div>
        {/* <Badge count="API v3" style={{ backgroundColor: "#7c3aed" }} /> */}
      </div>

      <Tabs
        items={[
          {
            key: "modules",
            label: "Modules",
            children: <ModulesTab onLoaded={setModules} />,
          },
          {
            key: "forms",
            label: "Forms",
            children: <FormsTab modules={modules} />,
          },
          {
            key: "fields",
            label: "Fields",
            children: <FieldsTab modules={modules} />,
          },
          {
            key: "pages",
            label: "Pages",
            children: <PagesTab modules={modules} />,
          },
          {
            key: "submissions",
            label: "Submissions",
            children: <SubmissionsTab modules={modules} />,
          },
        ]}
      />
    </div>
  );
}
