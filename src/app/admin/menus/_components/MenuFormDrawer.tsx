"use client";

import { useState } from "react";
import { Button, Drawer, Form, Input, Select, Space, Switch, Tag } from "antd";
import type { AdminMenuNode } from "@/infrastructure/http/adminApi";
import type { MenuUpsertForm } from "../_lib/types";
import { ICON_EMOJIS } from "../_lib/constants";
import { slugify } from "../_lib/slugify";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-[#1f2937]" />
    </div>
  );
}

function PreviewCard({ form }: { form: MenuUpsertForm }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-gray-200 dark:border-[#1f2937] bg-gray-50/60 dark:bg-[#0a0f1a]/60 mb-1">
      <span className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-[#1f2937] shadow-sm shrink-0">
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
            {form.isVisible ? "● Hiển thị" : "○ Ẩn"}
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
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-gray-100 dark:border-[#1f2937] hover:border-emerald-300 dark:hover:border-emerald-700"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function MenuFormDrawer({
  open,
  isEdit,
  initial,
  menus,
  onSubmit,
  onClose,
}: {
  open:      boolean;
  isEdit:    boolean;
  initial:   MenuUpsertForm;
  menus:     AdminMenuNode[];
  onSubmit:  (form: MenuUpsertForm) => Promise<void>;
  onClose:   () => void;
}) {
  const [form,       setForm]       = useState<MenuUpsertForm>(initial);
  const [prev,       setPrev]       = useState(initial);
  const [saving,     setSaving]     = useState(false);
  const [slugLocked, setSlugLocked] = useState(isEdit);

  if (initial !== prev) { setPrev(initial); setForm(initial); setSlugLocked(isEdit); }

  function set<K extends keyof MenuUpsertForm>(k: K, v: MenuUpsertForm[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "name" && !slugLocked) next.slug = slugify(v as string);
      return next;
    });
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSubmit(form); }
    finally { setSaving(false); }
  }

  const roots = menus.filter((m) => m.parentId === null);

  const footer = (
    <div className="flex justify-end">
      <Space>
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="primary" loading={saving} onClick={handleSubmit}>
          {isEdit ? "Lưu thay đổi" : "Tạo menu"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Chỉnh sửa menu" : "Tạo menu mới"}
      styles={{ wrapper: { width: 520 } }}
      footer={footer}
      destroyOnHidden
    >
      <Form layout="vertical" component="div" className="space-y-5">

        {/* Live preview */}
        <PreviewCard form={form} />

        <SectionLabel>Hiển thị</SectionLabel>

        <Form.Item label="Icon">
          <IconPicker value={form.icon} onChange={(v) => set("icon", v)} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item label={<>Tên menu <span className="text-red-500">*</span></>} className="!mb-0">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Báo cáo Kinh doanh"
            />
          </Form.Item>
          <Form.Item label="Thứ tự" className="!mb-0">
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
              min={0}
            />
          </Form.Item>
        </div>

        <Form.Item label="Slug (URL)">
          <Input
            value={form.slug}
            addonBefore={<span className="text-[11px] text-gray-400 dark:text-[#484f58]">/reports/</span>}
            onChange={(e) => { set("slug", e.target.value); setSlugLocked(true); }}
            placeholder="bao-cao-kinh-doanh"
            className="font-mono"
          />
        </Form.Item>

        <Form.Item label="Mô tả">
          <Input.TextArea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="Mô tả ngắn về nhóm báo cáo này..."
          />
        </Form.Item>

        <SectionLabel>Phân loại</SectionLabel>

        <Form.Item label="Menu cha">
          <Select
            value={form.parentId ?? undefined}
            onChange={(v) => set("parentId", v ?? null)}
            allowClear
            placeholder="Không có (menu gốc)"
            options={roots.map((m) => ({ value: m.id, label: `${m.icon} ${m.name}` }))}
          />
        </Form.Item>

        <SectionLabel>Trạng thái</SectionLabel>

        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-[#1f2937] bg-gray-50/60 dark:bg-[#0a0f1a]/60">
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3] m-0">Hiển thị công khai</p>
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
              Xuất hiện trong menu báo cáo của người dùng
            </p>
          </div>
          <Switch checked={form.isVisible} onChange={(v) => set("isVisible", v)} />
        </div>

      </Form>
    </Drawer>
  );
}
