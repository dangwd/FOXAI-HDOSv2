"use client";

import { useState } from "react";
import { Drawer, Form, Input, InputNumber, Select, Button, Space } from "antd";
import type { OperationForm, OperationHandler, OperationStatus } from "../_lib/types";
import type { Provider } from "../_lib/types";

const HANDLERS: { value: OperationHandler; label: string; desc: string }[] = [
  { value: "provider", label: "Provider",  desc: "Chuyển tiếp đến gRPC provider" },
  { value: "cache",    label: "Cache",     desc: "Trả về từ cache, không gọi provider" },
  { value: "local",    label: "Local",     desc: "Xử lý cục bộ, không cần provider" },
];

export function OperationFormDrawer({
  open,
  isEdit,
  initial,
  providers,
  onSubmit,
  onClose,
}: {
  open:      boolean;
  isEdit:    boolean;
  initial:   OperationForm;
  providers: Provider[];
  onSubmit:  (form: OperationForm) => void;
  onClose:   () => void;
}) {
  const [form, setForm] = useState<OperationForm>(initial);
  const [prev, setPrev] = useState<OperationForm>(initial);

  if (initial !== prev) { setPrev(initial); setForm(initial); }

  function set<K extends keyof OperationForm>(k: K, v: OperationForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const hasCache = form.cacheSeconds !== null;

  const footer = (
    <div className="flex justify-end">
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" onClick={() => onSubmit(form)}>
          {isEdit ? "Lưu thay đổi" : "Thêm Operation"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Sửa Operation" : "Thêm Operation"}
      styles={{ wrapper: { width: 480 } }}
      footer={footer}
    >
      <Form layout="vertical" component="div">

        <Form.Item label="Operation Pattern" required>
          <Input
            value={form.pattern}
            onChange={(e) => set("pattern", e.target.value)}
            placeholder="report.dashboard.summary"
          />
          <div className="text-[10px] text-gray-400 mt-1">
            Dot-separated pattern. Hỗ trợ wildcard: <code>report.*</code>
          </div>
        </Form.Item>

        <Form.Item label="Handler">
          <div className="grid grid-cols-3 gap-2">
            {HANDLERS.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => set("handler", h.value)}
                className={`px-3 py-2.5 rounded-lg border-2 text-left transition-colors ${
                  form.handler === h.value
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-gray-200 dark:border-[#30363d] hover:border-gray-300"
                }`}
              >
                <p className="text-[11px] font-bold m-0 text-gray-700 dark:text-[#e6edf3]">{h.label}</p>
                <p className="text-[9px] m-0 mt-0.5 text-gray-400 dark:text-[#484f58]">{h.desc}</p>
              </button>
            ))}
          </div>
        </Form.Item>

        {form.handler === "provider" && (
          <Form.Item label="Provider" required>
            <Select
              value={form.providerId || undefined}
              onChange={(v) => set("providerId", v)}
              placeholder="Chọn provider"
              options={providers.map((p) => ({
                value: p.providerId,
                label: `${p.displayName} (${p.providerId})`,
              }))}
            />
          </Form.Item>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Timeout (ms)">
            <InputNumber
              className="w-full"
              value={form.timeoutMs}
              onChange={(v) => set("timeoutMs", v ?? 30000)}
              min={1000}
              step={1000}
            />
          </Form.Item>
          <Form.Item label={`Cache TTL${hasCache ? "" : " — tắt"}`}>
            <Space.Compact className="w-full">
              <InputNumber
                className="flex-1 w-full"
                value={form.cacheSeconds ?? undefined}
                onChange={(v) => set("cacheSeconds", v ?? null)}
                min={1}
                placeholder="—"
                disabled={!hasCache}
              />
              <Button
                type={hasCache ? "primary" : "default"}
                onClick={() => set("cacheSeconds", hasCache ? null : 60)}
                style={hasCache ? { background: "#0ca678", borderColor: "#0ca678" } : undefined}
              >
                {hasCache ? "Bật" : "Tắt"}
              </Button>
            </Space.Compact>
          </Form.Item>
        </div>

        {isEdit && (
          <Form.Item label="Trạng thái">
            <div className="flex gap-2">
              {(["active", "inactive"] as OperationStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`flex-1 py-2 rounded-lg border-2 text-[11px] font-semibold transition-colors ${
                    form.status === s
                      ? s === "active"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "border-gray-400 bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-[#8b949e]"
                      : "border-gray-200 dark:border-[#30363d] text-gray-400"
                  }`}
                >
                  {s === "active" ? "Active" : "Inactive"}
                </button>
              ))}
            </div>
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
