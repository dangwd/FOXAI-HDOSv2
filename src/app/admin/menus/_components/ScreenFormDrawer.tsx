"use client";

import { useState } from "react";
import { Button, Drawer, Form, Input, InputNumber, Select, Space } from "antd";
import type { AdminScreen } from "@/infrastructure/http/adminApi";
import { ICON_EMOJIS } from "../_lib/constants";

interface ScreenFormData {
  name:             string;
  icon:             string;
  refreshMode:      "none" | "timer" | "sse";
  refreshIntervalS: number;
}

const BLANK: ScreenFormData = { name: "", icon: "📊", refreshMode: "none", refreshIntervalS: 60 };

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
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/60 dark:bg-[#0d1117]/60 mb-1">
      <span className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-[#161b22] border border-gray-100 dark:border-[#21262d] shadow-sm shrink-0">
        {form.icon || "📊"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 truncate">
          {form.name || <span className="font-normal italic text-gray-400 dark:text-[#484f58]">Tên màn hình...</span>}
        </p>
        <div className="mt-0.5">
          <RefreshBadge mode={form.refreshMode} intervalS={form.refreshIntervalS} />
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

function toFormData(s: AdminScreen): ScreenFormData {
  return { name: s.name, icon: s.icon, refreshMode: s.refreshMode, refreshIntervalS: s.refreshIntervalS };
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
      styles={{ wrapper: { width: 440 } }}
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

        <SectionLabel>Cập nhật dữ liệu</SectionLabel>

        <Form.Item label="Chế độ" className="!mb-0">
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
