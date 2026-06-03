import { useEffect, useState } from "react";
import { Badge, Drawer, Tabs } from "antd";
import { cn } from "@/shared/utils/cn";
import type { OcrSchema } from "@/infrastructure/http/ocrApi";
import { EditInfoTab }   from "./EditInfoTab";
import { EditFieldsTab } from "./EditFieldsTab";
import { EditTablesTab } from "./EditTablesTab";

interface EditSchemaDrawerProps {
  schema:    OcrSchema | null;
  onClose:   () => void;
  onUpdated: (updated: OcrSchema) => void;
}

export function EditSchemaDrawer({ schema, onClose, onUpdated }: EditSchemaDrawerProps) {
  const [current, setCurrent] = useState<OcrSchema | null>(schema);

  useEffect(() => { setCurrent(schema); }, [schema]);

  function handleUpdated(updated: OcrSchema) {
    setCurrent(updated);
    onUpdated(updated);
  }

  const tabItems = current
    ? [
        {
          key:      "info",
          label:    "Thông tin",
          children: <div className="pt-2"><EditInfoTab schema={current} onUpdated={handleUpdated} /></div>,
        },
        {
          key:   "fields",
          label: (
            <span className="flex items-center gap-1.5">
              Trường <Badge count={current.fields.length} color="#7c3aed" />
            </span>
          ),
          children: <div className="pt-2"><EditFieldsTab schema={current} onUpdated={handleUpdated} /></div>,
        },
        {
          key:   "tables",
          label: (
            <span className="flex items-center gap-1.5">
              Bảng <Badge count={current.tables.length} color="#f97316" />
            </span>
          ),
          children: <div className="pt-2"><EditTablesTab schema={current} onUpdated={handleUpdated} /></div>,
        },
      ]
    : [];

  return (
    <Drawer
      open={!!schema}
      onClose={onClose}
      title={
        current ? (
          <div className="flex items-center gap-2.5">
            <span className="text-gray-900 dark:text-[#e6edf3]">
              {current.name}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                current.isActive
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-100 dark:bg-[#21262d] text-gray-400 dark:text-[#8b949e]",
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", current.isActive ? "bg-emerald-500" : "bg-gray-400")} />
              {current.isActive ? "Hoạt động" : "Tạm dừng"}
            </span>
          </div>
        ) : null
      }
      styles={{ wrapper: { width: 760 } }}
      footer={null}
    >
      {current && (
        <Tabs defaultActiveKey="info" items={tabItems} />
      )}
    </Drawer>
  );
}
