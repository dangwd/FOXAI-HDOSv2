import { useEffect, useState } from "react";
import { App, Button, Checkbox, Select, Table, Tag } from "antd";
import { Input } from "antd";
import { FileText, Plus, Trash2 } from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import type { FieldDataType, FieldPosition, OcrField, OcrSchema } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";
import { FIELD_DATA_TYPE_OPTIONS, FIELD_POSITION_OPTIONS } from "../_lib/constants";

const INITIAL_ADD = { key: "", label: "", dataType: "TEXT" as FieldDataType, position: "BODY" as FieldPosition, required: false };

export function EditFieldsTab({ schema, onUpdated }: { schema: OcrSchema; onUpdated: (updated: OcrSchema) => void }) {
  const { message } = App.useApp();
  const [fields,      setFields]      = useState<OcrField[]>(schema.fields);
  const [add,         setAdd]         = useState(INITIAL_ADD);
  const [adding,      setAdding]      = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setFields(schema.fields); }, [schema.fields]);

  async function handleAdd() {
    if (!add.key.trim() || !add.label.trim()) { message.warning("Vui lòng nhập đủ thông tin"); return; }
    setAdding(true);
    try {
      const field = await ocrApi.addField(schema.id, {
        fieldKey:   add.key.trim(),
        label:      add.label.trim(),
        dataType:   add.dataType,
        position:   add.position,
        isRequired: add.required,
      });
      const next = [...fields, field];
      setFields(next);
      onUpdated({ ...schema, fields: next });
      setAdd(INITIAL_ADD);
      message.success("Đã thêm trường");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Thêm trường thất bại");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await ocrApi.deleteField(schema.id, id);
      const next = fields.filter((f) => f.id !== id);
      setFields(next);
      onUpdated({ ...schema, fields: next });
      message.success("Đã xóa trường");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: ColumnsType<OcrField> = [
    {
      title:     "Field Key",
      dataIndex: "fieldKey",
      render:    (v: string) => (
        <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-400 font-mono">{v}</code>
      ),
    },
    {
      title:     "Nhãn",
      dataIndex: "label",
      render:    (v: string) => <span className="text-gray-800 dark:text-[#e6edf3]">{v}</span>,
    },
    {
      title:     "Kiểu",
      dataIndex: "dataType",
      width:     100,
      render:    (v: FieldDataType) => <Tag>{FIELD_DATA_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v}</Tag>,
    },
    {
      title:     "Vị trí",
      dataIndex: "position",
      width:     100,
      render:    (v: FieldPosition) => <Tag>{FIELD_POSITION_OPTIONS.find((o) => o.value === v)?.label ?? v}</Tag>,
    },
    {
      title:     "Bắt buộc",
      dataIndex: "isRequired",
      width:     80,
      render:    (v: boolean) => (
        <span className={v ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-gray-400 dark:text-[#8b949e]"}>
          {v ? "Có" : "Không"}
        </span>
      ),
    },
    {
      title:  "",
      key:    "del",
      width:  52,
      render: (_: unknown, r: OcrField) => (
        <Button size="small" danger icon={<Trash2 size={11} />} loading={deletingId === r.id} onClick={() => handleDelete(r.id)} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Table
        dataSource={fields}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{
          emptyText: (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <FileText size={22} className="text-gray-300 dark:text-[#30363d]" />
              <p className="text-xs text-gray-400 dark:text-[#8b949e] m-0">Chưa có trường nào</p>
            </div>
          ),
        }}
        className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden"
      />

      <div className="bg-gray-50 dark:bg-[#161b22] border border-dashed border-gray-300 dark:border-[#30363d] rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-[#8b949e] mb-2.5 flex items-center gap-1.5">
          <Plus size={11} />
          Thêm trường mới
        </p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-2">
          <div>
            <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mb-0.5">Field Key</p>
            <Input placeholder="vd: invoice_no" size="small" value={add.key} onChange={(e) => setAdd((p) => ({ ...p, key: e.target.value }))} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mb-0.5">Nhãn hiển thị</p>
            <Input placeholder="vd: Số hóa đơn" size="small" value={add.label} onChange={(e) => setAdd((p) => ({ ...p, label: e.target.value }))} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mb-0.5">Kiểu dữ liệu</p>
            <Select options={FIELD_DATA_TYPE_OPTIONS} size="small" value={add.dataType} onChange={(v) => setAdd((p) => ({ ...p, dataType: v }))} className="w-full" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-[#8b949e] mb-0.5">Vị trí</p>
            <Select options={FIELD_POSITION_OPTIONS} size="small" value={add.position} onChange={(v) => setAdd((p) => ({ ...p, position: v }))} className="w-full" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Checkbox checked={add.required} onChange={(e) => setAdd((p) => ({ ...p, required: e.target.checked }))}>
            <span className="text-xs text-gray-600 dark:text-[#8b949e]">Bắt buộc</span>
          </Checkbox>
          <Button type="primary" size="small" icon={<Plus size={11} />} loading={adding} onClick={handleAdd}>
            Thêm trường
          </Button>
        </div>
      </div>
    </div>
  );
}
