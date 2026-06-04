"use client";

import { useState } from "react";
import { Button, Input, message, Space, Switch, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import { ShieldOff, Trash2 } from "lucide-react";
import type { AdminPermission } from "@/infrastructure/http/adminApi";
import { PRESET_ROLES } from "../_lib/constants";

const TYPE_META = {
  role: { label: "Role", color: "#059669", bg: "rgba(124,58,237,0.1)"  },
  user: { label: "User", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)"  },
} as const;

export function PermsTab({
  perms,
  onAdd,
  onToggle,
  onDelete,
}: {
  perms:    AdminPermission[];
  onAdd:    (type: "role" | "user", value: string) => Promise<void>;
  onToggle: (id: string, field: "canView" | "canExport") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [mode,      setMode]      = useState<"role" | "user">("role");
  const [userInput, setUserInput] = useState("");

  const existingRoles = new Set(
    perms.filter((p) => p.principalType === "role").map((p) => p.principalValue),
  );

  async function addRole(role: string) {
    try { await onAdd("role", role); }
    catch { message.error("Thêm quyền thất bại"); }
  }

  async function addUser() {
    const val = userInput.trim();
    if (!val) return;
    try { await onAdd("user", val); setUserInput(""); }
    catch { message.error("Thêm quyền thất bại"); }
  }

  const columns: TableColumnsType<AdminPermission> = [
    {
      title: "Đối tượng",
      key:   "principal",
      render: (_, p) => {
        const meta = TYPE_META[p.principalType as keyof typeof TYPE_META] ?? {
          label: p.principalType,
          color: "#6b7280",
          bg: "rgba(107,114,128,0.1)",
        };
        return (
          <Space size={8}>
            <Tag style={{ color: meta.color, background: meta.bg, border: "none", fontWeight: 600, margin: 0 }}>
              {meta.label}
            </Tag>
            <span className="text-sm font-medium text-gray-700 dark:text-[#c9d1d9]">{p.principalValue}</span>
          </Space>
        );
      },
    },
    {
      title:  "Xem",
      key:    "canView",
      width:  64,
      align:  "center" as const,
      render: (_, p) => (
        <Switch size="small" checked={p.canView} onChange={() => onToggle(p.id, "canView")} />
      ),
    },
    {
      title:  "Xuất",
      key:    "canExport",
      width:  64,
      align:  "center" as const,
      render: (_, p) => (
        <Switch size="small" checked={p.canExport} onChange={() => onToggle(p.id, "canExport")} />
      ),
    },
    {
      title:  "",
      key:    "actions",
      width:  44,
      align:  "center" as const,
      render: (_, p) => (
        <Button
          type="text"
          size="small"
          danger
          icon={<Trash2 size={13} />}
          onClick={() => onDelete(p.id).catch(() => message.error("Xóa thất bại"))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">

      {/* Add section */}
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#0a0f1a] border border-gray-100 dark:border-[#1f2937] space-y-3">
        {/* Mode switcher */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1f2937] rounded-xl p-1 w-fit">
          {(["role", "user"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                mode === m
                  ? "bg-white dark:bg-[#0f172a] text-gray-800 dark:text-[#e6edf3] shadow-sm"
                  : "text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3]"
              }`}
            >
              {m === "role" ? "Theo Role" : "Theo User"}
            </button>
          ))}
        </div>

        {mode === "role" ? (
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_ROLES.map((r) => {
              const exists = existingRoles.has(r);
              return (
                <button
                  key={r}
                  type="button"
                  disabled={exists}
                  onClick={() => addRole(r)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${
                    exists
                      ? "border-gray-100 dark:border-[#1f2937] text-gray-300 dark:text-[#484f58] cursor-not-allowed"
                      : "border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#2d2542]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${exists ? "bg-gray-300 dark:bg-[#484f58]" : "bg-emerald-500"}`} />
                  {r}
                </button>
              );
            })}
          </div>
        ) : (
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onPressEnter={addUser}
              placeholder="username hoặc email"
            />
            <Button type="primary" onClick={addUser}>Thêm</Button>
          </Space.Compact>
        )}
      </div>

      {/* Permissions table — or empty state */}
      {perms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-gray-200 dark:border-[#1f2937] text-gray-400 dark:text-[#484f58]">
          <ShieldOff size={28} className="opacity-50" />
          <p className="text-xs font-semibold m-0">Chưa có phân quyền nào</p>
          <p className="text-[11px] m-0 text-center">Thêm role hoặc user ở trên để cấp quyền</p>
        </div>
      ) : (
        <Table<AdminPermission>
          columns={columns}
          dataSource={perms}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )}
    </div>
  );
}
