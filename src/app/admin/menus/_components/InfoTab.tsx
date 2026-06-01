"use client";

import { useState } from "react";
import { Button, Form, Input, message, Popconfirm, Switch, Tag } from "antd";
import { Trash2 } from "lucide-react";
import type { AdminMenuNode } from "@/infrastructure/http/adminApi";
import type { MenuUpsertForm } from "../_lib/types";
import { ICON_EMOJIS } from "../_lib/constants";
import { slugify } from "../_lib/slugify";

// ─── Live preview card ────────────────────────────────────────────────────────

function PreviewCard({ form }: { form: Partial<MenuUpsertForm> }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/60 dark:bg-[#0d1117]/60 mb-5">
      <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#21262d] shadow-sm shrink-0">
        {form.icon || "📊"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] truncate">
            {form.name || <span className="font-normal italic text-gray-400 dark:text-[#484f58]">Tên menu...</span>}
          </span>
          <Tag
            color={form.isVisible ? "success" : "default"}
            style={{ fontSize: 10, border: "none", fontWeight: 600, margin: 0 }}
          >
            {form.isVisible ? "● Hiển thị" : "○ Đang ẩn"}
          </Tag>
        </div>
        <code className="text-[11px] text-gray-400 dark:text-[#6e7681]">
          /reports/{form.slug || "..."}
        </code>
        {form.description && (
          <p className="text-[11px] text-gray-500 dark:text-[#8b949e] m-0 mt-0.5 truncate">{form.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Icon picker ─────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ICON_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`w-9 h-9 rounded-lg text-base flex items-center justify-center border-2 transition-colors ${
            value === e
              ? "border-violet-500 bg-violet-50 dark:bg-[#2d2542]"
              : "border-gray-100 dark:border-[#30363d] hover:border-violet-300 dark:hover:border-violet-700"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── InfoTab ──────────────────────────────────────────────────────────────────

export function InfoTab({
  menu,
  saving,
  onSave,
  onDelete,
}: {
  menu:     AdminMenuNode;
  saving:   boolean;
  onSave:   (partial: Partial<MenuUpsertForm>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [form,       setForm]       = useState<Partial<MenuUpsertForm>>({
    name:        menu.name,
    slug:        menu.slug,
    icon:        menu.icon,
    description: menu.description ?? "",
    isVisible:   menu.isVisible,
  });
  const [slugLocked, setSlugLocked] = useState(true);

  function set<K extends keyof MenuUpsertForm>(k: K, v: MenuUpsertForm[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "name" && !slugLocked) next.slug = slugify(v as string);
      return next;
    });
  }

  return (
    <Form layout="vertical" component="div">

      {/* Live preview */}
      <PreviewCard form={form} />

      <Form.Item label="Icon">
        <IconPicker value={form.icon ?? "📊"} onChange={(v) => set("icon", v)} />
      </Form.Item>

      <div className="grid grid-cols-2 gap-3">
        <Form.Item label="Tên menu" className="!mb-0">
          <Input
            value={form.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Slug (URL)" className="!mb-0">
          <Input
            value={form.slug ?? ""}
            addonBefore={<span className="text-[11px] text-gray-400">/reports/</span>}
            onChange={(e) => { set("slug", e.target.value); setSlugLocked(true); }}
            className="font-mono"
          />
        </Form.Item>
      </div>

      <Form.Item label="Mô tả" className="mt-3">
        <Input.TextArea
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Mô tả ngắn về nhóm báo cáo này..."
        />
      </Form.Item>

      <Form.Item label="Hiển thị công khai">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-[#21262d] bg-gray-50/60 dark:bg-[#0d1117]/60">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3] m-0">
              {form.isVisible ? "Đang hiển thị" : "Đang ẩn"}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
              Người dùng {form.isVisible ? "có thể" : "không thể"} thấy menu này
            </p>
          </div>
          <Switch checked={form.isVisible ?? true} onChange={(v) => set("isVisible", v)} />
        </div>
      </Form.Item>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#21262d]">
        <Popconfirm
          title={`Xóa menu "${menu.name}"?`}
          description="Toàn bộ màn hình, widget và phân quyền sẽ bị xóa theo."
          okText="Xóa"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(menu.id).catch(() => message.error("Xóa thất bại"))}
        >
          <Button type="text" danger icon={<Trash2 size={13} />} size="small">
            Xóa menu
          </Button>
        </Popconfirm>
        <Button
          type="primary"
          size="small"
          loading={saving}
          onClick={() => onSave(form).catch(() => message.error("Lưu thất bại"))}
        >
          Lưu thay đổi
        </Button>
      </div>

    </Form>
  );
}
