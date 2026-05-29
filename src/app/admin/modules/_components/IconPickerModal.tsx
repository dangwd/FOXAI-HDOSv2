"use client";

import { useState, useMemo } from "react";
import { Modal, Input, Button } from "antd";
import { Search } from "lucide-react";
import { ICON_REGISTRY, ICON_CATEGORIES, formatIconName } from "../_lib/icons";

export function IconPickerModal({
  current,
  onSelect,
  onClose,
}: {
  current:  string;
  onSelect: (name: string) => void;
  onClose:  () => void;
}) {
  const [search, setSearch] = useState("");
  const [catId,  setCatId]  = useState("all");

  const visible = useMemo(() => {
    const q    = search.toLowerCase().trim();
    const pool =
      catId === "all"
        ? Object.keys(ICON_REGISTRY)
        : (ICON_CATEGORIES.find((c) => c.id === catId)?.names ?? []);
    return q ? pool.filter((n) => n.toLowerCase().includes(q)) : pool;
  }, [search, catId]);

  const CurrentIcon = ICON_REGISTRY[current];

  const footer = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {CurrentIcon ? (
          <>
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <CurrentIcon size={14} className="text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-[#e6edf3] truncate">
              {formatIconName(current)}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400 dark:text-[#484f58]">Chưa chọn icon</span>
        )}
      </div>
      <Button size="small" danger type="text" onClick={() => onSelect("")}>
        Xóa icon
      </Button>
      <Button size="small" type="primary" onClick={onClose}>
        Đóng
      </Button>
    </div>
  );

  return (
    <Modal
      open
      onCancel={onClose}
      title="Chọn Icon"
      footer={footer}
      width={520}
      styles={{ body: { padding: 0 } }}
    >
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <Input
          autoFocus
          prefix={<Search size={13} className="text-gray-400" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCatId("all"); }}
          placeholder="Tìm icon theo tên..."
          allowClear
        />
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
          {[{ id: "all", label: "Tất cả" }, ...ICON_CATEGORIES].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatId(cat.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                catId === cat.id
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                  : "text-gray-500 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Category section label */}
      {!search && catId !== "all" && (
        <p className="px-4 pb-1 text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest m-0">
          {ICON_CATEGORIES.find((c) => c.id === catId)?.label}
        </p>
      )}

      {/* Icon grid */}
      <div className="px-4 pb-3 overflow-y-auto" style={{ maxHeight: 360 }}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-[#484f58] gap-2">
            <Search size={24} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm m-0">Không tìm thấy icon nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {visible.map((name) => {
              const Comp      = ICON_REGISTRY[name];
              if (!Comp) return null;
              const isSelected = current === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelect(name)}
                  title={formatIconName(name)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-100 group ${
                    isSelected
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-900/30"
                      : "border-transparent hover:border-gray-200 dark:hover:border-[#30363d] hover:bg-gray-50 dark:hover:bg-[#21262d]"
                  }`}
                >
                  <Comp
                    size={20}
                    className={
                      isSelected
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-500 dark:text-[#8b949e] group-hover:text-gray-700 dark:group-hover:text-[#e6edf3]"
                    }
                  />
                  <span
                    className={`text-[9px] leading-tight text-center line-clamp-1 w-full ${
                      isSelected
                        ? "text-violet-600 dark:text-violet-400 font-semibold"
                        : "text-gray-400 dark:text-[#484f58]"
                    }`}
                  >
                    {formatIconName(name)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
