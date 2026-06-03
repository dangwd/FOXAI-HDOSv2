import { App, Badge, Button, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Copy, Layers, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { OcrSchemaListItem } from "@/infrastructure/http/ocrApi";
import { DOC_TYPE_COLORS, DOC_TYPE_LABELS } from "../_lib/constants";
import { ocrApi } from "@/infrastructure/http/ocrApi";

interface SchemaTableProps {
  schemas:     OcrSchemaListItem[];
  loading:     boolean;
  editLoading: boolean;
  onEdit:    (record: OcrSchemaListItem) => void;
  onDeleted: () => void;
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#21262d] flex items-center justify-center">
        <Layers size={22} className="text-gray-300 dark:text-[#484f58]" />
      </div>
      <div>
        <p className="font-semibold text-gray-700 dark:text-[#e6edf3] m-0 text-sm">Chưa có schema nào</p>
        <p className="text-xs text-gray-400 dark:text-[#8b949e] m-0 mt-1">
          Tạo schema đầu tiên để bắt đầu cấu hình OCR
        </p>
      </div>
    </div>
  );
}

export function SchemaTable({ schemas, loading, editLoading, onEdit, onDeleted }: SchemaTableProps) {
  const { message, modal } = App.useApp();

  function handleDelete(record: OcrSchemaListItem) {
    modal.confirm({
      title:         `Xóa schema "${record.name}"?`,
      content:       "Thao tác này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await ocrApi.deleteSchema(record.id);
          message.success("Đã xóa schema");
          onDeleted();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Xóa thất bại");
        }
      },
    });
  }

  const columns: ColumnsType<OcrSchemaListItem> = [
    {
      title:     "Mã schema",
      dataIndex: "code",
      width:     160,
      render:    (v: string) => (
        <Tooltip title="Nhấn để sao chép" color="#1f1f1f">
          <code
            className="text-[11px] font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors inline-flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(v);
              message.success("Đã sao chép");
            }}
          >
            {v}
            <Copy size={10} className="opacity-50" />
          </code>
        </Tooltip>
      ),
    },
    {
      title:  "Tên schema",
      key:    "name",
      render: (_: unknown, r: OcrSchemaListItem) => (
        <p className="font-semibold text-gray-800 dark:text-[#e6edf3] m-0 text-sm">{r.name}</p>
      ),
    },
    {
      title:  "Loại chứng từ",
      key:    "type",
      width:  140,
      render: (_: unknown, r: OcrSchemaListItem) => (
        <Tag color={DOC_TYPE_COLORS[r.type]} className="text-xs">{DOC_TYPE_LABELS[r.type]}</Tag>
      ),
    },
    {
      title:     "Trạng thái",
      dataIndex: "isActive",
      width:     120,
      render:    (v: boolean) => (
        <span className={cn(
          "inline-flex items-center gap-1.5 text-[12px] font-medium px-2 py-0.5 rounded-full",
          v
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
            : "bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#8b949e]",
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", v ? "bg-emerald-500" : "bg-gray-400")} />
          {v ? "Hoạt động" : "Tạm dừng"}
        </span>
      ),
    },
    {
      title:  "Trường",
      key:    "fields",
      width:  76,
      align:  "center" as const,
      render: (_: unknown, r: OcrSchemaListItem) => (
        <Badge count={r._count.fields} color="#7c3aed" showZero />
      ),
    },
    {
      title:  "Bảng",
      key:    "tables",
      width:  76,
      align:  "center" as const,
      render: (_: unknown, r: OcrSchemaListItem) => (
        <Badge count={r._count.tables} color="#f97316" showZero />
      ),
    },
    {
      title:  "Chứng từ",
      key:    "documents",
      width:  88,
      align:  "center" as const,
      render: (_: unknown, r: OcrSchemaListItem) => (
        <span className="text-sm tabular-nums text-gray-600 dark:text-[#8b949e]">{r._count.documents}</span>
      ),
    },
    {
      title:  "",
      key:    "actions",
      width:  88,
      render: (_: unknown, r: OcrSchemaListItem) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa" color="#1f1f1f">
            <Button size="small" icon={<Pencil size={12} />} loading={editLoading} onClick={() => onEdit(r)} />
          </Tooltip>
          <Tooltip title="Xóa" color="#1f1f1f">
            <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => handleDelete(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl overflow-hidden">
      <Table
        dataSource={schemas}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <EmptyState /> }}
        pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `${t} schema` }}
        size="middle"
      />
    </div>
  );
}
