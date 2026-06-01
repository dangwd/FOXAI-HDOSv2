"use client";

import { useState } from "react";
import { Drawer, Form, Input, InputNumber, Switch, Button, Space } from "antd";
import type { ModuleGroupRecord } from "@/infrastructure/http/adminApi";
import { resolveGroupColor, ROLE_META } from "../_lib/constants";
import { type ModuleForm } from "../_lib/types";
import { IconPickerField } from "./IconPickerField";
import { ModuleIcon } from "./ModuleIcon";

// ─── Live preview ─────────────────────────────────────────────────────────────

function PreviewCard({
  form,
  groups,
}: {
  form:   ModuleForm;
  groups: ModuleGroupRecord[];
}) {
  const group = groups.find((g) => g.id === form.groupId);
  const color = group ? resolveGroupColor(group, groups) : "#8b949e";
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/60 dark:bg-[#0d1117]/60">
      <ModuleIcon icon={form.icon} groupColor={color} iconSize={18} boxSize={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] truncate">
            {form.label || (
              <span className="font-normal italic text-gray-400 dark:text-[#484f58]">
                Tên module…
              </span>
            )}
          </span>
          {group && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ color, background: `${color}1a` }}
            >
              {group.label}
            </span>
          )}
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={form.isActive
              ? { color: "#0ca678", background: "rgba(12,166,120,.12)" }
              : { color: "#8b949e", background: "rgba(139,148,158,.12)" }
            }
          >
            {form.isActive ? "● Hoạt động" : "○ Tạm dừng"}
          </span>
        </div>
        <code className="text-[10px] text-gray-400 dark:text-[#6e7681]">
          {form.slug || "your-slug"}
        </code>
        {form.requiredRoles.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {form.requiredRoles.map((r) => {
              const m = ROLE_META[r];
              return m ? (
                <span
                  key={r}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ color: m.color, background: m.bg }}
                >
                  {m.label}
                </span>
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
  groups,
  onSubmit,
  onClose,
}: {
  open:     boolean;
  title:    string;
  initial:  ModuleForm;
  groups:   ModuleGroupRecord[];
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
      requiredRoles: p.requiredRoles.includes(role)
        ? p.requiredRoles.filter((r) => r !== role)
        : [...p.requiredRoles, role],
    }));
  }

  const isEdit    = title.toLowerCase().includes("sửa");
  const canSubmit = !!form.groupId && !!form.slug.trim() && !!form.label.trim();

  const selectedGroup = groups.find((g) => g.id === form.groupId);
  const selectedColor = selectedGroup ? resolveGroupColor(selectedGroup, groups) : "#8b949e";

  const footer = (
    <div className="flex items-center justify-between">
      <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0">
        {isEdit ? "Thay đổi áp dụng ngay" : "Có thể chỉnh sửa sau"}
      </p>
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" disabled={!canSubmit} onClick={() => onSubmit(form)}>
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
        <PreviewCard form={form} groups={groups} />

        {/* Group picker */}
        <div>
          <SectionLabel>Nhóm module *</SectionLabel>
          {!form.groupId && (
            <p className="text-[11px] text-amber-500 dark:text-amber-400 mb-2 m-0">
              Chọn nhóm để tiếp tục
            </p>
          )}
          {groups.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-[#484f58] italic">Đang tải nhóm…</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {groups.map((g) => {
                const active = form.groupId === g.id;
                const color  = resolveGroupColor(g, groups);
                const abbr   = g.slug.split("-").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => set("groupId", g.id)}
                    className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border-2 text-center transition-all duration-150"
                    style={active
                      ? { borderColor: color, background: `${color}1a` }
                      : { borderColor: "transparent" }
                    }
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: color }}
                    >
                      {abbr || g.label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-semibold leading-tight" style={{ color: active ? color : undefined }}>
                      {g.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Basic info */}
        <div>
          <SectionLabel>Thông tin cơ bản</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Form.Item label="Slug" required className="mb-0!">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="executive-dashboard"
              />
            </Form.Item>
            <Form.Item label="Tên hiển thị" required className="mb-0!">
              <Input
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                placeholder="Executive Dashboard"
              />
            </Form.Item>
          </div>
          <Form.Item label="Icon" className="mb-3!">
            <IconPickerField
              value={form.icon}
              groupColor={selectedColor}
              onChange={(v) => set("icon", v)}
            />
          </Form.Item>
          <Form.Item label="Mô tả" className="mb-3!">
            <Input.TextArea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả ngắn gọn về chức năng của module này…"
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Thứ tự hiển thị" className="mb-0!">
              <InputNumber
                className="w-full"
                min={0}
                value={form.sortOrder}
                onChange={(v) => set("sortOrder", v ?? 0)}
              />
            </Form.Item>
            <Form.Item label="Refresh (giây)" className="mb-0!">
              <Input
                value={form.refreshIntervalSeconds}
                onChange={(e) => set("refreshIntervalSeconds", e.target.value)}
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
              const active = form.requiredRoles.includes(role);
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
