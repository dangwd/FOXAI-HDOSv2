"use client";

import { Button, Form, Input, Typography } from "antd";
import { MinusCircle, Plus } from "lucide-react";
import type { MappingRow } from "../_lib/types";

const { Text } = Typography;

// ─── Single row: source field → canonical field ───────────────────────────────

function MappingRowItem({
  name,
  isOnly,
  onRemove,
}: {
  name: number;
  isOnly: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_20px_1fr_28px] gap-x-2 items-start">
      <Form.Item
        name={[name, "sourceField"]}
        className="mb-0"
        rules={[{ required: true, message: "Bắt buộc" }]}
      >
        <Input placeholder="patient_id" size="small" className="font-mono text-xs!" />
      </Form.Item>

      <div className="flex items-center justify-center h-7.5 shrink-0">
        <Text type="secondary" style={{ fontSize: 14 }}>→</Text>
      </div>

      <Form.Item
        name={[name, "canonicalField"]}
        className="mb-0"
        rules={[{ required: true, message: "Bắt buộc" }]}
      >
        <Input placeholder="MaBenhNhan" size="small" className="font-mono text-xs!" />
      </Form.Item>

      <div className="flex items-center justify-center h-7.5 shrink-0">
        <button
          type="button"
          onClick={onRemove}
          disabled={isOnly}
          className="w-6 h-6 flex items-center justify-center rounded hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "#6b7280" }}
          title="Xóa dòng này"
        >
          <MinusCircle size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── MappingEditor ─────────────────────────────────────────────────────────────

export function MappingEditor({
  fields,
  add,
  remove,
  errors,
}: {
  fields: { key: number; name: number }[];
  add: (val: MappingRow) => void;
  remove: (name: number) => void;
  errors: React.ReactNode[];
}) {
  return (
    <div className="space-y-1.5">
      {/* Column headers — dùng Typography.Text token, không phụ thuộc Tailwind dark: */}
      <div className="grid grid-cols-[1fr_20px_1fr_28px] gap-x-2 mb-1">
        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Field gốc (source)
        </Text>
        <span />
        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Field canonical
        </Text>
        <span />
      </div>

      {fields.map(({ key, name }) => (
        <MappingRowItem
          key={key}
          name={name}
          isOnly={fields.length === 1}
          onRemove={() => remove(name)}
        />
      ))}

      <Form.ErrorList errors={errors} />

      <Button
        type="dashed"
        size="small"
        icon={<Plus size={12} />}
        onClick={() => add({ sourceField: "", canonicalField: "" })}
        block
        className="mt-1 text-xs!"
      >
        Thêm mapping
      </Button>
    </div>
  );
}
