import { Button, Input, Select } from "antd";
import { Plus, Search } from "lucide-react";
import type { DocumentType } from "@/infrastructure/http/ocrApi";
import { DOC_TYPE_OPTIONS } from "../_lib/constants";

interface SchemaToolbarProps {
  search:       string;
  filterType:   DocumentType | undefined;
  filterActive: boolean | undefined;
  onSearch:       (v: string) => void;
  onFilterType:   (v: DocumentType | undefined) => void;
  onFilterActive: (v: boolean | undefined) => void;
  onCreate:       () => void;
}

export function SchemaToolbar({
  search, filterType, filterActive,
  onSearch, onFilterType, onFilterActive, onCreate,
}: SchemaToolbarProps) {
  return (
    <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
      <Input
        prefix={<Search size={13} className="text-gray-400 dark:text-[#8b949e]" />}
        placeholder="Tìm kiếm schema..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        allowClear
        className="w-56"
      />
      <Select
        placeholder="Loại chứng từ"
        options={DOC_TYPE_OPTIONS}
        value={filterType}
        onChange={onFilterType}
        allowClear
        className="w-44"
      />
      <Select
        placeholder="Trạng thái"
        value={filterActive}
        onChange={onFilterActive}
        allowClear
        className="w-36"
        options={[
          { label: "Hoạt động", value: true },
          { label: "Tạm dừng",  value: false },
        ]}
      />
      <div className="ml-auto">
        <Button type="primary" icon={<Plus size={14} />} onClick={onCreate}>
          Tạo Schema
        </Button>
      </div>
    </div>
  );
}
