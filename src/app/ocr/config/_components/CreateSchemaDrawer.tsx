import { useState } from "react";
import { App, Button, Checkbox, Divider, Drawer, Form, Input, Select, Space } from "antd";
import { Plus, Trash2 } from "lucide-react";
import type { DocumentType, FieldDataType, FieldPosition } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";
import { DOC_TYPE_OPTIONS, FIELD_DATA_TYPE_OPTIONS, FIELD_POSITION_OPTIONS } from "../_lib/constants";

interface CreateSchemaDrawerProps {
  open:      boolean;
  onClose:   () => void;
  onCreated: () => void;
}

type FieldRow = { fieldKey: string; label: string; dataType: FieldDataType; position: FieldPosition; isRequired: boolean };
type ColRow   = { columnKey: string; label: string; dataType: FieldDataType };
type TableRow = { tableKey: string; name: string; columns?: ColRow[] };

export function CreateSchemaDrawer({ open, onClose, onCreated }: CreateSchemaDrawerProps) {
  const { message } = App.useApp();
  const [form]    = Form.useForm();
  const [loading, setLoading] = useState(false);

  function handleClose() {
    form.resetFields();
    onClose();
  }

  async function handleSubmit() {
    let values: { code: string; name: string; type: DocumentType; description?: string; fields?: FieldRow[]; tables?: TableRow[] };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setLoading(true);
    try {
      await ocrApi.createSchema({
        code:        values.code,
        name:        values.name,
        type:        values.type,
        description: values.description || undefined,
        fields:      (values.fields ?? []).map((f) => ({
          fieldKey:  f.fieldKey,
          label:     f.label,
          dataType:  f.dataType,
          position:  f.position,
          isRequired: !!f.isRequired,
        })),
        tables: (values.tables ?? []).map((t) => ({
          tableKey: t.tableKey,
          name:     t.name,
          columns:  (t.columns ?? []).map((c) => ({ columnKey: c.columnKey, label: c.label, dataType: c.dataType })),
        })),
      });
      message.success("Tạo schema thành công");
      form.resetFields();
      onCreated();
      onClose();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Tạo schema thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Tạo schema mới"
      styles={{ wrapper: { width: 680 } }}
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>Tạo Schema</Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" component="div">
        <Form.Item name="code" label="Mã schema" required
          rules={[{ required: true, message: "Bắt buộc" }, { pattern: /^[A-Z0-9-]+$/, message: "Chỉ gồm chữ hoa, số và dấu gạch ngang" }]}
        >
          <Input placeholder="VD: VAT-INVOICE" onChange={(e) => form.setFieldValue("code", e.target.value.toUpperCase())} />
        </Form.Item>

        <Form.Item name="name" label="Tên schema" rules={[{ required: true, message: "Bắt buộc" }]}>
          <Input placeholder="VD: Hóa đơn VAT" />
        </Form.Item>

        <Form.Item name="type" label="Loại chứng từ" rules={[{ required: true, message: "Bắt buộc" }]}>
          <Select options={DOC_TYPE_OPTIONS} placeholder="Chọn loại" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả / Hướng dẫn cho AI">
          <Input.TextArea rows={3} placeholder="Mô tả đặc điểm của loại chứng từ này..." />
        </Form.Item>

        <Divider plain>
          <span className="text-xs font-medium text-gray-400 dark:text-[#8b949e]">Trường dữ liệu (tuỳ chọn)</span>
        </Divider>

        <Form.List name="fields">
          {(items, { add, remove }) => (
            <div className="space-y-3">
              {items.map(({ key, name }) => (
                <div key={key} className="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Form.Item name={[name, "fieldKey"]} label="Field Key" rules={[{ required: true, message: "Bắt buộc" }]} className="mb-2">
                      <Input placeholder="vd: invoice_no" size="small" />
                    </Form.Item>
                    <Form.Item name={[name, "label"]} label="Nhãn" rules={[{ required: true, message: "Bắt buộc" }]} className="mb-2">
                      <Input placeholder="vd: Số hóa đơn" size="small" />
                    </Form.Item>
                    <Form.Item name={[name, "dataType"]} label="Kiểu dữ liệu" rules={[{ required: true, message: "Bắt buộc" }]} className="mb-2">
                      <Select options={FIELD_DATA_TYPE_OPTIONS} placeholder="Chọn kiểu" size="small" />
                    </Form.Item>
                    <Form.Item name={[name, "position"]} label="Vị trí" rules={[{ required: true, message: "Bắt buộc" }]} className="mb-2">
                      <Select options={FIELD_POSITION_OPTIONS} placeholder="Chọn vị trí" size="small" />
                    </Form.Item>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <Form.Item name={[name, "isRequired"]} valuePropName="checked" className="mb-0">
                      <Checkbox>Bắt buộc</Checkbox>
                    </Form.Item>
                    <Button size="small" danger icon={<Trash2 size={11} />} onClick={() => remove(name)}>Xóa</Button>
                  </div>
                </div>
              ))}
              <Button type="dashed" block icon={<Plus size={13} />} onClick={() => add({ dataType: "TEXT", position: "BODY", isRequired: false })}>
                + Thêm trường
              </Button>
            </div>
          )}
        </Form.List>

        <Divider plain>
          <span className="text-xs font-medium text-gray-400 dark:text-[#8b949e]">Bảng dữ liệu (tuỳ chọn)</span>
        </Divider>

        <Form.List name="tables">
          {(items, { add: addTable, remove: removeTable }) => (
            <div className="space-y-3">
              {items.map(({ key, name: tName }) => (
                <div key={key} className="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Form.Item name={[tName, "tableKey"]} label="Table Key" rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
                      <Input placeholder="vd: line_items" size="small" />
                    </Form.Item>
                    <Form.Item name={[tName, "name"]} label="Tên bảng" rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0">
                      <Input placeholder="vd: Chi tiết hàng hóa" size="small" />
                    </Form.Item>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-[#8b949e] mb-1 mt-2">Cột trong bảng</p>
                  <Form.List name={[tName, "columns"]}>
                    {(cols, { add: addCol, remove: removeCol }) => (
                      <div className="space-y-2">
                        {cols.map(({ key: ck, name: cName }) => (
                          <div key={ck} className="flex gap-2 items-start">
                            <Form.Item name={[cName, "columnKey"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0 flex-1">
                              <Input placeholder="columnKey" size="small" />
                            </Form.Item>
                            <Form.Item name={[cName, "label"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0 flex-1">
                              <Input placeholder="Nhãn" size="small" />
                            </Form.Item>
                            <Form.Item name={[cName, "dataType"]} rules={[{ required: true, message: "Bắt buộc" }]} className="mb-0 w-28">
                              <Select options={FIELD_DATA_TYPE_OPTIONS} placeholder="Kiểu" size="small" />
                            </Form.Item>
                            <Button size="small" danger icon={<Trash2 size={10} />} onClick={() => removeCol(cName)} />
                          </div>
                        ))}
                        <Button size="small" type="dashed" icon={<Plus size={11} />} onClick={() => addCol({ dataType: "TEXT" })}>
                          + Thêm cột
                        </Button>
                      </div>
                    )}
                  </Form.List>
                  <Button size="small" danger icon={<Trash2 size={11} />} className="mt-3" onClick={() => removeTable(tName)}>
                    Xóa bảng
                  </Button>
                </div>
              ))}
              <Button type="dashed" block icon={<Plus size={13} />} onClick={() => addTable({ columns: [] })}>
                + Thêm bảng
              </Button>
            </div>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
}
