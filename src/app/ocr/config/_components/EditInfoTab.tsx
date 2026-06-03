import { useEffect, useState } from "react";
import { App, Button, Form, Input, Switch, Tag } from "antd";
import type { OcrSchema } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";
import { DOC_TYPE_COLORS, DOC_TYPE_LABELS } from "../_lib/constants";

export function EditInfoTab({ schema, onUpdated }: { schema: OcrSchema; onUpdated: (updated: OcrSchema) => void }) {
  const { message } = App.useApp();
  const [form]   = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ name: schema.name, description: schema.description ?? "", isActive: schema.isActive });
  }, [schema, form]);

  async function handleSave() {
    let values: { name: string; description: string; isActive: boolean };
    try { values = await form.validateFields(); } catch { return; }
    setSaving(true);
    try {
      const updated = await ocrApi.updateSchema(schema.id, {
        name:        values.name,
        description: values.description || undefined,
        isActive:    values.isActive,
      });
      message.success("Đã lưu thay đổi");
      onUpdated(updated);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      {/* Readonly fields */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1.5 uppercase tracking-wider">Mã schema</p>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg">
            <code className="font-mono text-sm text-violet-600 dark:text-violet-400 flex-1 leading-none">
              {schema.code}
            </code>
            <span className="text-[10px] text-gray-400 dark:text-[#484f58] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded font-mono shrink-0">
              readonly
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-1.5 uppercase tracking-wider">Loại chứng từ</p>
          <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg h-[38px]">
            <Tag color={DOC_TYPE_COLORS[schema.type]} className="m-0 text-xs">
              {DOC_TYPE_LABELS[schema.type]}
            </Tag>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" component="div">
        <Form.Item name="name" label="Tên schema" rules={[{ required: true, message: "Bắt buộc" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Mô tả / Hướng dẫn cho AI">
          <Input.TextArea
            rows={4}
            placeholder="Mô tả đặc điểm của loại chứng từ này để AI nhận dạng chính xác hơn..."
          />
        </Form.Item>
        <div className="flex items-center justify-between pt-1">
          <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked" className="mb-0">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>
          <Button type="primary" loading={saving} onClick={handleSave}>Lưu thay đổi</Button>
        </div>
      </Form>
    </div>
  );
}
