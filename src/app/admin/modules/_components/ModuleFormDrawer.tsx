"use client";

import { useState } from "react";
import { Drawer, Form, Input, InputNumber, Switch, Button, Space, Tag } from "antd";
import type { ModuleGroup } from "@/infrastructure/http/adminApi";
import { GROUP_META, ROLE_META } from "../_lib/constants";
import { type ModuleForm } from "../_lib/types";
import { IconPickerField } from "./IconPickerField";
import { ModuleIcon } from "./ModuleIcon";

// ─── Live preview ─────────────────────────────────────────────────────────────

function PreviewCard({ form }: { form: ModuleForm }) {
  const groupMeta = form.group ? GROUP_META[form.group] : null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/60 dark:bg-[#0d1117]/60">
      <ModuleIcon
        icon={form.icon}
        group={form.group as ModuleGroup | undefined}
        iconSize={18}
        boxSize={40}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] truncate">
            {form.label || (
              <span className="font-normal italic text-gray-400 dark:text-[#484f58]">
                Tên module…
              </span>
            )}
          </span>
          {groupMeta && (
            <Tag style={{ color: groupMeta.color, background: groupMeta.bg, border: "none", fontWeight: 600, fontSize: 10 }}>
              {groupMeta.label}
            </Tag>
          )}
          <Tag
            style={{ marginLeft: "auto", fontSize: 10, border: "none", fontWeight: 600 }}
            color={form.isActive ? "success" : "default"}
          >
            {form.isActive ? "● Hoạt động" : "○ Tạm dừng"}
          </Tag>
        </div>
        <code className="text-[10px] text-gray-400 dark:text-[#6e7681]">
          {form.slug || "your-slug"}
        </code>
        {form.roles.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {form.roles.map((r) => {
              const m = ROLE_META[r];
              return m ? (
                <Tag key={r} style={{ color: m.color, background: m.bg, border: "none", fontWeight: 600, fontSize: 10 }}>
                  {m.label}
                </Tag>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-[#21262d]" />
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function ModuleFormDrawer({
  open,
  title,
  initial,
  onSubmit,
  onClose,
}: {
  open:     boolean;
  title:    string;
  initial:  ModuleForm;
  onSubmit: (f: ModuleForm) => void;
  onClose:  () => void;
}) {
  const [form, setForm] = useState<ModuleForm>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) { setPrevInitial(initial); setForm(initial); }

  const set = <K extends keyof ModuleForm>(k: K, v: ModuleForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  function toggleRole(role: string) {
    setForm((p) => ({
      ...p,
      roles: p.roles.includes(role)
        ? p.roles.filter((r) => r !== role)
        : [...p.roles, role],
    }));
  }

  const isEdit = title.toLowerCase().includes("sửa");

  const footer = (
    <div className="flex items-center justify-between">
      <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0">
        {isEdit ? "Thay đổi áp dụng ngay" : "Có thể chỉnh sửa sau"}
      </p>
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" onClick={() => onSubmit(form)}>
          {isEdit ? "Lưu thay đổi" : "Tạo Module"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      styles={{ wrapper: { width: 640 } }}
      footer={footer}
    >
      <Form layout="vertical" component="div" className="space-y-5">

        {/* Live preview */}
        <PreviewCard form={form} />

        {/* Group picker */}
        <div>
          <SectionLabel>Nhóm module *</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(GROUP_META) as [ModuleGroup, (typeof GROUP_META)[ModuleGroup]][]).map(([key, meta]) => {
              const active = form.group === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("group", key)}
                  className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border-2 text-center transition-all duration-150"
                  style={active ? { borderColor: meta.color, background: meta.bg } : { borderColor: "transparent" }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: meta.color }}
                  >
                    {key === "dieu-hanh" ? "ĐH" : key === "lam-sang" ? "LS" : "QT"}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: active ? meta.color : undefined }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-[#484f58] line-clamp-1">
                    {meta.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basic info */}
        <div>
          <SectionLabel>Thông tin cơ bản</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Form.Item label="Slug" required className="!mb-0">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="executive-dashboard"
              />
            </Form.Item>
            <Form.Item label="Tên hiển thị" required className="!mb-0">
              <Input
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                placeholder="Executive Dashboard"
              />
            </Form.Item>
          </div>
          <Form.Item label="Icon" className="!mb-3">
            <IconPickerField
              value={form.icon}
              group={form.group}
              onChange={(v) => set("icon", v)}
            />
          </Form.Item>
          <Form.Item label="Mô tả" className="!mb-3">
            <Input.TextArea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả ngắn gọn về chức năng của module này…"
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Thứ tự hiển thị" className="!mb-0">
              <InputNumber
                className="w-full"
                min={0}
                value={form.sortOrder}
                onChange={(v) => set("sortOrder", v ?? 0)}
              />
            </Form.Item>
            <Form.Item label="Refresh (giây)" className="!mb-0">
              <Input
                value={form.refreshInterval}
                onChange={(e) => set("refreshInterval", e.target.value)}
                placeholder="Để trống = không auto-refresh"
              />
            </Form.Item>
          </div>
        </div>

        {/* Roles */}
        <div>
          <SectionLabel>Phân quyền</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(ROLE_META).map(([role, meta]) => {
              const active = form.roles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-150"
                  style={
                    active
                      ? { borderColor: meta.color, background: meta.bg, color: meta.color }
                      : { borderColor: "#e5e7eb", color: "#9ca3af" }
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? meta.color : "#d1d5db" }} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status toggles */}
        <div>
          <SectionLabel>Trạng thái</SectionLabel>
          <div className="space-y-2">
            {(["isActive", "isVisible"] as const).map((key) => {
              const cfg = {
                isActive:  { label: "Hoạt động",         desc: "Module có thể được truy cập bởi user" },
                isVisible: { label: "Hiển thị trên menu", desc: "Xuất hiện trong thanh điều hướng" },
              };
              return (
                <div
                  key={key}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-[#21262d] bg-gray-50/60 dark:bg-[#0d1117]/60"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3] m-0">{cfg[key].label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">{cfg[key].desc}</p>
                  </div>
                  <Switch checked={form[key]} onChange={(v) => set(key, v)} />
                </div>
              );
            })}
          </div>
        </div>

      </Form>
    </Drawer>
  );
}
