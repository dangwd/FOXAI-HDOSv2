"use client";

import type { ScreenAction } from "@/types/screen";
import { useState } from "react";
import { Button, ColorPicker, Drawer, Form, Input, InputNumber, Select, Space, Switch } from "antd";
import type { AdminScreen } from "@/infrastructure/http/adminApi";
import { Plus, Trash2 } from "lucide-react";
import { ICON_EMOJIS } from "../_lib/constants";

interface ScreenFormData {
  name:             string;
  icon:             string;
  refreshMode:      "none" | "timer" | "sse";
  refreshIntervalS: number;
  title:            string;
  subtitle:         string;
  badge:            string;
  badgeColor:       string;
  live:             boolean;
  actions:          ScreenAction[];
}

const BLANK: ScreenFormData = {
  name: "", icon: "📊", refreshMode: "none", refreshIntervalS: 60,
  title: "", subtitle: "", badge: "", badgeColor: "", live: false, actions: [],
};

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

function RefreshBadge({ mode, intervalS }: { mode: string; intervalS: number }) {
  if (mode === "sse")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live SSE
      </span>
    );
  if (mode === "timer")
    return <span className="text-[11px] font-semibold text-amber-500">⏱ {intervalS}s</span>;
  return <span className="text-[11px] text-gray-400 dark:text-[#484f58]">Tĩnh</span>;
}

function PreviewCard({ form }: { form: ScreenFormData }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-gray-200 dark:border-[#1f2937] bg-gray-50/60 dark:bg-[#0a0f1a]/60 mb-1">
      <span className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-[#1f2937] shadow-sm shrink-0">
        {form.icon || "📊"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 truncate">
          {form.title || form.name || <span className="font-normal italic text-gray-400 dark:text-[#484f58]">Tên màn hình...</span>}
        </p>
        {form.subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 truncate">{form.subtitle}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          <RefreshBadge mode={form.refreshMode} intervalS={form.refreshIntervalS} />
          {form.badge && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: form.badgeColor ? `${form.badgeColor}22` : "rgba(16,185,129,0.12)",
                color: form.badgeColor || "#10b981",
                border: `1px solid ${form.badgeColor ? `${form.badgeColor}44` : "rgba(16,185,129,0.25)"}`,
              }}
            >
              {form.badge}
            </span>
          )}
          {form.live && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
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
          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border-2 transition-colors ${
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

function ActionList({
  value,
  onChange,
}: {
  value: ScreenAction[];
  onChange: (v: ScreenAction[]) => void;
}) {
  function add() {
    onChange([...value, { label: "", variant: "default" }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function update(i: number, patch: Partial<ScreenAction>) {
    onChange(value.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  return (
    <div className="space-y-2">
      {value.map((action, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            size="small"
            placeholder="Nhãn button"
            value={action.label}
            onChange={(e) => update(i, { label: e.target.value })}
            style={{ flex: 1 }}
          />
          <Select
            size="small"
            value={action.variant ?? "default"}
            onChange={(v) => update(i, { variant: v })}
            style={{ width: 100 }}
            options={[
              { value: "default",  label: "Outlined" },
              { value: "primary",  label: "Filled"   },
              { value: "dashed",   label: "Dashed"   },
            ]}
          />
          <ColorPicker
            size="small"
            value={action.color || "#10b981"}
            onChange={(c) => update(i, { color: c.toHexString() })}
            showText={false}
          />
          <Button
            type="text"
            danger
            size="small"
            icon={<Trash2 size={13} />}
            onClick={() => remove(i)}
          />
        </div>
      ))}
      <Button
        type="dashed"
        size="small"
        icon={<Plus size={13} />}
        onClick={add}
        className="w-full"
      >
        Thêm action
      </Button>
    </div>
  );
}

function toFormData(s: AdminScreen): ScreenFormData {
  return {
    name:             s.name,
    icon:             s.icon,
    refreshMode:      s.refreshMode,
    refreshIntervalS: s.refreshIntervalS,
    title:            s.title     ?? "",
    subtitle:         s.subtitle  ?? "",
    badge:            s.badge     ?? "",
    badgeColor:       s.badgeColor ?? "",
    live:             s.live      ?? false,
    actions:          s.actions   ?? [],
  };
}

export function ScreenFormDrawer({
  open,
  screen,
  onSubmit,
  onClose,
}: {
  open:     boolean;
  screen:   AdminScreen | null;
  onSubmit: (data: ScreenFormData) => Promise<void>;
  onClose:  () => void;
}) {
  const isEdit  = screen !== null;
  const initial = isEdit ? toFormData(screen) : BLANK;

  const [form,   setForm]   = useState<ScreenFormData>(initial);
  const [prev,   setPrev]   = useState(initial);
  const [saving, setSaving] = useState(false);

  if (initial !== prev) { setPrev(initial); setForm(initial); }

  function set<K extends keyof ScreenFormData>(k: K, v: ScreenFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSubmit(form); }
    finally { setSaving(false); }
  }

  const footer = (
    <div className="flex justify-end">
      <Space>
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="primary" loading={saving} onClick={handleSubmit}>
          {isEdit ? "Lưu thay đổi" : "Thêm màn hình"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Sửa màn hình" : "Thêm màn hình mới"}
      styles={{ wrapper: { width: 460 } }}
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

        <Form.Item label={<>Tên màn hình <span className="text-red-500">*</span></>}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Tổng quan doanh thu"
            autoFocus
          />
        </Form.Item>

        <SectionLabel>Header màn hình</SectionLabel>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Tiêu đề (title)" className="mb-0!">
            <Input
              size="small"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="VD: Công suất giường bệnh"
            />
          </Form.Item>
          <Form.Item label="Mô tả ngắn (subtitle)" className="mb-0!">
            <Input
              size="small"
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="VD: Cập nhật hàng giờ"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Badge text" className="mb-0!">
            <Input
              size="small"
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              placeholder="VD: BETA, v2.1, LIVE…"
            />
          </Form.Item>
          <Form.Item label="Badge màu" className="mb-0!">
            <div className="flex gap-2 items-center">
              <ColorPicker
                size="small"
                value={form.badgeColor || "#10b981"}
                onChange={(c) => set("badgeColor", c.toHexString())}
                showText
              />
            </div>
          </Form.Item>
        </div>

        <Form.Item label="Live indicator" className="mb-0!">
          <Switch
            size="small"
            checked={form.live}
            onChange={(v) => set("live", v)}
            checkedChildren="Live"
            unCheckedChildren="Off"
          />
        </Form.Item>

        <Form.Item label="Actions (button góc trên phải)" className="mb-0!">
          <ActionList value={form.actions} onChange={(v) => set("actions", v)} />
        </Form.Item>

        <SectionLabel>Cập nhật dữ liệu</SectionLabel>

        <Form.Item label="Chế độ" className="mb-0!">
          <Select
            value={form.refreshMode}
            onChange={(v) => set("refreshMode", v)}
            options={[
              { value: "none",  label: "Không tự động" },
              { value: "timer", label: "Theo thời gian" },
              { value: "sse",   label: "● Live (SSE)"   },
            ]}
          />
        </Form.Item>

        {form.refreshMode === "timer" && (
          <Form.Item label="Chu kỳ (giây)">
            <InputNumber
              className="w-full"
              min={5}
              max={3600}
              value={form.refreshIntervalS}
              onChange={(v) => set("refreshIntervalS", v ?? 60)}
            />
          </Form.Item>
        )}

      </Form>
    </Drawer>
  );
}

export type { ScreenFormData };
