"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/infrastructure/http/adminApi";
import type {
  AdminFormField,
  CreateFormFieldRequest,
  FormTemplateListItem,
} from "@/infrastructure/http/adminApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: 0,  label: "Text"        },
  { value: 1,  label: "TextArea"    },
  { value: 2,  label: "Number"      },
  { value: 3,  label: "Select"      },
  { value: 4,  label: "MultiSelect" },
  { value: 5,  label: "Radio"       },
  { value: 6,  label: "Checkbox"    },
  { value: 7,  label: "Date"        },
  { value: 8,  label: "DateTime"    },
  { value: 9,  label: "File"        },
  { value: 10, label: "Hidden"      },
];

const OPTION_FIELD_TYPES = new Set([3, 4, 5, 6]);

function fieldTypeLabel(type: number): string {
  return FIELD_TYPES.find((t) => t.value === type)?.label ?? `Type(${type})`;
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-[13px] font-semibold text-gray-700 dark:text-[#c9d1d9]">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

// ─── FormFieldFormDrawer (create / edit a single field) ───────────────────────

type OptionRow = { label: string; value: string };
type RuleRow   = { type: string; value: string; errorMessage: string };

interface FormFieldFormDrawerProps {
  formTemplateId: string;
  field: AdminFormField | null; // null = create
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function FormFieldFormDrawer({
  formTemplateId,
  field,
  open,
  onClose,
  onSaved,
}: FormFieldFormDrawerProps) {
  const [form]                    = Form.useForm();
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [fieldType, setFieldType] = useState<number>(0);
  const [options,   setOptions]   = useState<OptionRow[]>([]);
  const [rules,     setRules]     = useState<RuleRow[]>([]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    if (field) {
      form.setFieldsValue({
        key:             field.key,
        label:           field.label,
        fieldType:       field.fieldType,
        order:           field.order,
        required:        field.required,
        isReadOnly:      field.isReadOnly ?? false,
        width:           field.width,
        placeholder:     field.placeholder,
        helpText:        field.helpText,
        dataBindingExpr: field.dataBindingExpression,
        displayFormat:   field.displayFormat,
        cl_sourceKey:    field.conditionalLogic?.sourceFieldKey,
        cl_operator:     field.conditionalLogic?.operator,
        cl_value:        field.conditionalLogic?.value,
        cl_action:       field.conditionalLogic?.action,
      });
      setFieldType(field.fieldType);
      setOptions(field.options ?? []);
      setRules(field.validationRules ?? []);
    } else {
      form.resetFields();
      setFieldType(0);
      setOptions([]);
      setRules([]);
    }
  }, [open, field, form]);

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      setError(null);

      const conditionalLogic = vals.cl_sourceKey
        ? {
            sourceFieldKey: vals.cl_sourceKey as string,
            operator:       (vals.cl_operator ?? "") as string,
            value:          (vals.cl_value ?? "") as string,
            action:         (vals.cl_action ?? "") as string,
          }
        : null;

      const payload: CreateFormFieldRequest = {
        formTemplateId,
        key:                   vals.key as string,
        label:                 vals.label as string,
        fieldType:             vals.fieldType as number,
        order:                 (vals.order ?? 0) as number,
        required:              (vals.required ?? false) as boolean,
        isReadOnly:            (vals.isReadOnly ?? false) as boolean,
        width:                 vals.width as number | undefined,
        placeholder:           vals.placeholder as string | undefined,
        helpText:              vals.helpText as string | undefined,
        dataBindingExpression: vals.dataBindingExpr as string | undefined,
        displayFormat:         vals.displayFormat as string | undefined,
        options:               OPTION_FIELD_TYPES.has(vals.fieldType as number) ? options : undefined,
        validationRules:       rules.length > 0 ? rules : undefined,
        conditionalLogic,
      };

      if (field?.id) {
        await adminApi.updateFormField(formTemplateId, field.id, payload);
      } else {
        await adminApi.createFormField(formTemplateId, payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
            <span className="text-[13px]">⚙</span>
          </div>
          <span>{field ? `Sửa field: ${field.key}` : "Thêm field mới"}</span>
        </div>
      }
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 560 } }}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {field ? "Cập nhật" : "Tạo field"}
          </Button>
        </div>
      }
    >
      {error && <Alert type="error" message={error} showIcon className="mb-4" />}

      <Form form={form} layout="vertical" requiredMark={false} size="middle">

        {/* ── Basic ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            label={<FieldLabel text="Key" required />}
            name="key"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Input placeholder="field_key" className="font-mono" />
          </Form.Item>
          <Form.Item
            label={<FieldLabel text="Loại field" required />}
            name="fieldType"
            rules={[{ required: true, message: "Bắt buộc" }]}
          >
            <Select
              options={FIELD_TYPES}
              placeholder="Chọn loại"
              onChange={(v: number) => setFieldType(v)}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={<FieldLabel text="Label" required />}
          name="label"
          rules={[{ required: true, message: "Bắt buộc" }]}
        >
          <Input placeholder="Nhãn hiển thị cho người dùng" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item label={<FieldLabel text="Thứ tự" />} name="order" initialValue={0}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item label={<FieldLabel text="Width (%)" />} name="width">
            <InputNumber className="w-full" min={0} max={100} placeholder="100" />
          </Form.Item>
        </div>

        <div className="flex items-center gap-6 mb-5">
          <div className="flex items-center gap-2">
            <Form.Item name="required" valuePropName="checked" noStyle>
              <Switch size="small" />
            </Form.Item>
            <span className="text-sm text-gray-600 dark:text-[#8b949e]">Bắt buộc nhập</span>
          </div>
          <div className="flex items-center gap-2">
            <Form.Item name="isReadOnly" valuePropName="checked" noStyle>
              <Switch size="small" />
            </Form.Item>
            <span className="text-sm text-gray-600 dark:text-[#8b949e]">Chỉ đọc</span>
          </div>
        </div>

        <Form.Item label={<FieldLabel text="Placeholder" />} name="placeholder">
          <Input placeholder="Gợi ý nhập liệu…" />
        </Form.Item>

        <Form.Item label={<FieldLabel text="Mô tả (helpText)" />} name="helpText">
          <Input.TextArea rows={2} placeholder="Hướng dẫn ngắn cho người dùng" />
        </Form.Item>

        {/* ── Options (Select / MultiSelect / Radio / Checkbox) ─────────── */}
        {OPTION_FIELD_TYPES.has(fieldType) && (
          <>
            <Divider plain className="my-4">
              <span className="text-[11px] text-gray-400 dark:text-[#484f58] uppercase tracking-wider">
                Options
              </span>
            </Divider>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Input
                  size="small"
                  placeholder="value"
                  value={opt.value}
                  style={{ width: 140 }}
                  className="font-mono"
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = { ...next[i], value: e.target.value };
                    setOptions(next);
                  }}
                />
                <Input
                  size="small"
                  placeholder="Label hiển thị"
                  value={opt.label}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = { ...next[i], label: e.target.value };
                    setOptions(next);
                  }}
                />
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={12} />}
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                />
              </div>
            ))}
            <Button
              size="small"
              icon={<Plus size={12} />}
              className="mb-2"
              onClick={() => setOptions([...options, { label: "", value: "" }])}
            >
              Thêm option
            </Button>
          </>
        )}

        {/* ── Validation Rules ──────────────────────────────────────────── */}
        <Divider plain className="my-4">
          <span className="text-[11px] text-gray-400 dark:text-[#484f58] uppercase tracking-wider">
            Validation Rules
          </span>
        </Divider>
        {rules.map((rule, i) => (
          <div key={i} className="mb-3">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1.5 items-center">
              <Input
                size="small"
                placeholder="Type (regex, minLength…)"
                value={rule.type}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...next[i], type: e.target.value };
                  setRules(next);
                }}
              />
              <Input
                size="small"
                placeholder="Value"
                value={rule.value}
                onChange={(e) => {
                  const next = [...rules];
                  next[i] = { ...next[i], value: e.target.value };
                  setRules(next);
                }}
              />
              <Button
                size="small"
                danger
                icon={<Trash2 size={12} />}
                onClick={() => setRules(rules.filter((_, j) => j !== i))}
              />
            </div>
            <Input
              size="small"
              placeholder="Error message"
              value={rule.errorMessage}
              onChange={(e) => {
                const next = [...rules];
                next[i] = { ...next[i], errorMessage: e.target.value };
                setRules(next);
              }}
            />
          </div>
        ))}
        <Button
          size="small"
          icon={<Plus size={12} />}
          className="mb-2"
          onClick={() => setRules([...rules, { type: "", value: "", errorMessage: "" }])}
        >
          Thêm rule
        </Button>

        {/* ── Data Binding ──────────────────────────────────────────────── */}
        <Divider plain className="my-4">
          <span className="text-[11px] text-gray-400 dark:text-[#484f58] uppercase tracking-wider">
            Data Binding
          </span>
        </Divider>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item label={<FieldLabel text="Binding Expression" />} name="dataBindingExpr">
            <Input placeholder="$.path.to.value" className="font-mono text-xs" />
          </Form.Item>
          <Form.Item label={<FieldLabel text="Display Format" />} name="displayFormat">
            <Input placeholder="DD/MM/YYYY" />
          </Form.Item>
        </div>

        {/* ── Conditional Logic ─────────────────────────────────────────── */}
        <Divider plain className="my-4">
          <span className="text-[11px] text-gray-400 dark:text-[#484f58] uppercase tracking-wider">
            Conditional Logic
          </span>
        </Divider>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item label={<FieldLabel text="Source Field Key" />} name="cl_sourceKey">
            <Input placeholder="field_key" className="font-mono text-xs" />
          </Form.Item>
          <Form.Item label={<FieldLabel text="Operator" />} name="cl_operator">
            <Select
              placeholder="Chọn"
              options={[
                { value: "equals",       label: "Equals"       },
                { value: "not_equals",   label: "Not Equals"   },
                { value: "contains",     label: "Contains"     },
                { value: "greater_than", label: "Greater Than" },
                { value: "less_than",    label: "Less Than"    },
              ]}
            />
          </Form.Item>
          <Form.Item label={<FieldLabel text="Value" />} name="cl_value">
            <Input placeholder="Giá trị so sánh" />
          </Form.Item>
          <Form.Item label={<FieldLabel text="Action" />} name="cl_action">
            <Select
              placeholder="Hành động"
              options={[
                { value: "show",     label: "Show"     },
                { value: "hide",     label: "Hide"     },
                { value: "required", label: "Required" },
                { value: "optional", label: "Optional" },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Drawer>
  );
}

// ─── FormFieldsDrawer (field list for a form template) ────────────────────────

export interface FormFieldsDrawerProps {
  formTemplate: FormTemplateListItem | null;
  onClose: () => void;
}

export function FormFieldsDrawer({ formTemplate, onClose }: FormFieldsDrawerProps) {
  const [fields,  setFields]  = useState<AdminFormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  // undefined = drawer closed | null = create mode | AdminFormField = edit mode
  const [editing, setEditing] = useState<AdminFormField | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!formTemplate) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listFormFields(formTemplate.id);
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [formTemplate]);

  useEffect(() => {
    if (formTemplate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    } else {
      setFields([]);
      setEditing(undefined);
    }
  }, [formTemplate, load]);

  const handleDelete = async (fieldId: string) => {
    if (!formTemplate) return;
    try {
      await adminApi.deleteFormField(formTemplate.id, fieldId);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const columns: ColumnsType<AdminFormField> = [
    {
      title:     "Key",
      dataIndex: "key",
      width:     170,
      render:    (v: string) => (
        <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-2 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
          {v}
        </code>
      ),
    },
    {
      title:     "Label",
      dataIndex: "label",
      render:    (v: string) => (
        <span className="text-sm font-medium text-gray-800 dark:text-[#e6edf3]">{v}</span>
      ),
    },
    {
      title:     "Loại",
      dataIndex: "fieldType",
      width:     120,
      render:    (v: number) => (
        <Tag style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
          {fieldTypeLabel(v)}
        </Tag>
      ),
    },
    {
      title:     "#",
      dataIndex: "order",
      width:     50,
      align:     "center",
      render:    (v: number) => (
        <span className="text-xs text-gray-400 dark:text-[#484f58] font-mono">{v}</span>
      ),
    },
    {
      title:     "Req",
      dataIndex: "required",
      width:     50,
      align:     "center",
      render:    (v: boolean) => (
        <span className={`text-sm font-bold ${v ? "text-orange-500" : "text-gray-200 dark:text-[#30363d]"}`}>
          {v ? "●" : "○"}
        </span>
      ),
    },
    {
      key:    "actions",
      width:  72,
      align:  "right",
      render: (_: unknown, record: AdminFormField) => (
        <Space size={4}>
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<Pencil size={12} />}
              onClick={() => setEditing(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa field này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, size: "small" }}
            onConfirm={() => record.id && handleDelete(record.id)}
          >
            <Tooltip title="Xóa">
              <Button size="small" danger icon={<Trash2 size={12} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          formTemplate ? (
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">
                {formTemplate.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-[11px] text-gray-400 dark:text-[#484f58]">
                  {formTemplate.key}
                </code>
                <Tag style={{ fontSize: 10, lineHeight: "16px", margin: 0, padding: "0 4px" }}>
                  v{formTemplate.version}
                </Tag>
              </div>
            </div>
          ) : "Form Fields"
        }
        open={!!formTemplate}
        onClose={onClose}
        styles={{ wrapper: { width: 740 } }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<Plus size={12} />}
            onClick={() => setEditing(null)}
          >
            Thêm Field
          </Button>
        }
      >
        {error && <Alert type="error" message={error} showIcon className="mb-3" />}

        <Table<AdminFormField>
          dataSource={fields}
          rowKey={(r) => r.id ?? r.key}
          size="small"
          loading={loading}
          pagination={false}
          columns={columns}
          locale={{
            emptyText: (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">Chưa có field nào</p>
                <p className="text-xs text-gray-400 dark:text-[#484f58] m-0 mt-1">
                  Nhấn &ldquo;Thêm Field&rdquo; để bắt đầu
                </p>
              </div>
            ),
          }}
        />
      </Drawer>

      {formTemplate && editing !== undefined && (
        <FormFieldFormDrawer
          formTemplateId={formTemplate.id}
          field={editing}
          open
          onClose={() => setEditing(undefined)}
          onSaved={load}
        />
      )}
    </>
  );
}
