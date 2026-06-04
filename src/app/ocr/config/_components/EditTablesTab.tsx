import type {
  FieldDataType,
  OcrSchema,
  OcrTable,
  OcrTableColumn,
} from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";
import {
  App,
  Badge,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Table2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FIELD_DATA_TYPE_OPTIONS } from "../_lib/constants";

type AddColState = { key: string; label: string; dataType: FieldDataType };

export function EditTablesTab({
  schema,
  onUpdated,
}: {
  schema: OcrSchema;
  onUpdated: (updated: OcrSchema) => void;
}) {
  const { message, modal } = App.useApp();
  const [tables, setTables] = useState<OcrTable[]>(schema.tables);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [addTableKey, setAddTableKey] = useState("");
  const [addTableName, setAddTableName] = useState("");
  const [savingTable, setSavingTable] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);
  const [deletingColId, setDeletingColId] = useState<string | null>(null);
  const [addingColId, setAddingColId] = useState<string | null>(null);
  const [addColState, setAddColState] = useState<Record<string, AddColState>>(
    {},
  );

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setTables(schema.tables);
  }, [schema.tables]);

  function patchTables(next: OcrTable[]) {
    setTables(next);
    onUpdated({ ...schema, tables: next });
  }

  async function handleAddTable() {
    if (!addTableKey.trim() || !addTableName.trim()) {
      message.warning("Vui lòng nhập đủ thông tin");
      return;
    }
    setSavingTable(true);
    try {
      const table = await ocrApi.addTable(schema.id, {
        tableKey: addTableKey.trim(),
        name: addTableName.trim(),
        columns: [],
      });
      patchTables([...tables, table]);
      setAddTableKey("");
      setAddTableName("");
      setAddTableOpen(false);
      message.success("Đã thêm bảng");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Thêm bảng thất bại");
    } finally {
      setSavingTable(false);
    }
  }

  function handleDeleteTable(tableId: string) {
    modal.confirm({
      title: "Xác nhận xóa bảng",
      content: "Tất cả cột trong bảng cũng sẽ bị xóa. Tiếp tục?",
      okButtonProps: { danger: true },
      onOk: async () => {
        setDeletingTableId(tableId);
        try {
          await ocrApi.deleteTable(schema.id, tableId);
          patchTables(tables.filter((t) => t.id !== tableId));
          message.success("Đã xóa bảng");
        } catch (err) {
          message.error(
            err instanceof Error ? err.message : "Xóa bảng thất bại",
          );
        } finally {
          setDeletingTableId(null);
        }
      },
    });
  }

  async function handleAddColumn(tableId: string) {
    const st = addColState[tableId];
    if (!st?.key?.trim() || !st?.label?.trim()) {
      message.warning("Vui lòng nhập đủ thông tin cột");
      return;
    }
    setAddingColId(tableId);
    try {
      const col = await ocrApi.addColumn(schema.id, tableId, {
        columnKey: st.key.trim(),
        label: st.label.trim(),
        dataType: st.dataType ?? "TEXT",
      });
      patchTables(
        tables.map((t) =>
          t.id === tableId ? { ...t, columns: [...t.columns, col] } : t,
        ),
      );
      setAddColState((prev) => ({
        ...prev,
        [tableId]: { key: "", label: "", dataType: "TEXT" },
      }));
      message.success("Đã thêm cột");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Thêm cột thất bại");
    } finally {
      setAddingColId(null);
    }
  }

  async function handleDeleteColumn(tableId: string, colId: string) {
    setDeletingColId(colId);
    try {
      await ocrApi.deleteColumn(schema.id, tableId, colId);
      patchTables(
        tables.map((t) =>
          t.id === tableId
            ? { ...t, columns: t.columns.filter((c) => c.id !== colId) }
            : t,
        ),
      );
      message.success("Đã xóa cột");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Xóa cột thất bại");
    } finally {
      setDeletingColId(null);
    }
  }

  function colColumns(tableId: string): ColumnsType<OcrTableColumn> {
    return [
      {
        title: "Column Key",
        dataIndex: "columnKey",
        render: (v: string) => (
          <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-400 font-mono">
            {v}
          </code>
        ),
      },
      {
        title: "Nhãn",
        dataIndex: "label",
        render: (v: string) => (
          <span className="text-gray-800 dark:text-[#e6edf3]">{v}</span>
        ),
      },
      {
        title: "Kiểu",
        dataIndex: "dataType",
        width: 100,
        render: (v: FieldDataType) =>
          FIELD_DATA_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v,
      },
      {
        title: "",
        key: "del",
        width: 52,
        render: (_: unknown, r: OcrTableColumn) => (
          <Button
            size="small"
            danger
            icon={<Trash2 size={11} />}
            loading={deletingColId === r.id}
            onClick={() => handleDeleteColumn(tableId, r.id)}
          />
        ),
      },
    ];
  }

  const collapseItems = tables.map((table) => ({
    key: table.id,
    label: (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800 dark:text-[#e6edf3]">
          {table.name}
        </span>
        <code className="text-[10px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-gray-500 dark:text-[#8b949e] font-mono">
          {table.tableKey}
        </code>
        <Badge count={table.columns.length} color="#7c3aed" />
      </div>
    ),
    extra: (
      <Button
        size="small"
        danger
        icon={<Trash2 size={11} />}
        loading={deletingTableId === table.id}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteTable(table.id);
        }}
      >
        Xóa bảng
      </Button>
    ),
    children: (
      <div className="space-y-3">
        <Table
          dataSource={table.columns}
          columns={colColumns(table.id)}
          rowKey="id"
          size="small"
          pagination={false}
          className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden"
        />
        <div className="bg-gray-50 dark:bg-[#0d1117] border border-dashed border-gray-300 dark:border-[#30363d] rounded-lg p-2.5">
          <p className="text-[10px] font-medium text-gray-400 dark:text-[#8b949e] mb-2 flex items-center gap-1">
            <Plus size={9} />
            Thêm cột mới
          </p>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="columnKey"
              size="small"
              className="flex-1"
              value={addColState[table.id]?.key ?? ""}
              onChange={(e) =>
                setAddColState((p) => ({
                  ...p,
                  [table.id]: {
                    ...p[table.id],
                    key: e.target.value,
                    label: p[table.id]?.label ?? "",
                    dataType: p[table.id]?.dataType ?? "TEXT",
                  },
                }))
              }
            />
            <Input
              placeholder="Nhãn"
              size="small"
              className="flex-1"
              value={addColState[table.id]?.label ?? ""}
              onChange={(e) =>
                setAddColState((p) => ({
                  ...p,
                  [table.id]: {
                    ...p[table.id],
                    label: e.target.value,
                    key: p[table.id]?.key ?? "",
                    dataType: p[table.id]?.dataType ?? "TEXT",
                  },
                }))
              }
            />
            <Select
              options={FIELD_DATA_TYPE_OPTIONS}
              size="small"
              className="w-32"
              value={addColState[table.id]?.dataType ?? "TEXT"}
              onChange={(v) =>
                setAddColState((p) => ({
                  ...p,
                  [table.id]: {
                    ...p[table.id],
                    dataType: v,
                    key: p[table.id]?.key ?? "",
                    label: p[table.id]?.label ?? "",
                  },
                }))
              }
            />
            <Button
              type="primary"
              size="small"
              icon={<Plus size={11} />}
              loading={addingColId === table.id}
              onClick={() => handleAddColumn(table.id)}
            >
              Thêm cột
            </Button>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div className="space-y-4">
      {tables.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-[#484f58]">
          <Table2
            size={36}
            className="mx-auto mb-2 text-gray-300 dark:text-[#30363d]"
          />
          <p className="text-sm m-0">Chưa có bảng nào</p>
        </div>
      ) : (
        <Collapse items={collapseItems} />
      )}

      <Button
        type="dashed"
        block
        icon={<Plus size={13} />}
        onClick={() => setAddTableOpen(true)}
      >
        Thêm bảng
      </Button>

      <Modal
        open={addTableOpen}
        title="Thêm bảng mới"
        onCancel={() => {
          setAddTableOpen(false);
          setAddTableKey("");
          setAddTableName("");
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setAddTableOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              loading={savingTable}
              onClick={handleAddTable}
            >
              Lưu bảng
            </Button>
          </div>
        }
      >
        <Form layout="vertical" component="div" className="mt-4">
          <Form.Item label="Table Key" required>
            <Input
              placeholder="vd: line_items"
              value={addTableKey}
              onChange={(e) => setAddTableKey(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Tên bảng" required>
            <Input
              placeholder="vd: Chi tiết hàng hóa"
              value={addTableName}
              onChange={(e) => setAddTableName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
