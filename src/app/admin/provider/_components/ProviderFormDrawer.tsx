"use client";

import { useState } from "react";
import { Drawer, Form, Input, InputNumber, Button, Space, Alert, Tag } from "antd";
import { RefreshCw } from "lucide-react";
import { STATUS_META, STATUS_ORDER, providerColor } from "../_lib/constants";
import type { Provider, ProviderForm, ProviderStatus } from "../_lib/types";

// ─── Preview strip ────────────────────────────────────────────────────────────

function PreviewStrip({ form }: { form: ProviderForm }) {
  const color = providerColor(form.providerId || "new-provider");
  const initials =
    (form.providerId || "?").split("-").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "??";
  const ops = form.operationsText.split("\n").map((s) => s.trim()).filter(Boolean);
  const statusMeta = STATUS_META[form.status];

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-gray-200 dark:border-[#1f2937] bg-gray-50/60 dark:bg-[#0a0f1a]/60 mb-5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
        style={{ background: color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] truncate">
            {form.displayName || <span className="font-normal italic text-gray-400">Display name…</span>}
          </span>
          <Tag style={{ color: statusMeta.color, background: statusMeta.bg, border: "none", marginLeft: "auto", fontWeight: 600 }}>
            {statusMeta.label}
          </Tag>
        </div>
        <code className="text-[10px] text-gray-400 dark:text-[#6e7681]">
          {form.providerId || "provider-id"}
        </code>
        {ops.length > 0 && (
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-1">
            {ops.length} operation{ops.length > 1 ? "s" : ""} · P{form.priority} · {form.timeoutMs / 1000}s timeout
          </p>
        )}
      </div>
    </div>
  );
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-1">
      <span className="text-[10px] font-bold text-gray-400 dark:text-[#484f58] uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-[#1f2937]" />
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function ProviderFormDrawer({
  open,
  isEdit,
  initial,
  target,
  onSubmit,
  onClose,
}: {
  open:      boolean;
  isEdit:    boolean;
  initial:   ProviderForm;
  target?:   Provider;
  onSubmit:  (f: ProviderForm) => void;
  onClose:   () => void;
}) {
  const [form, setForm] = useState<ProviderForm>(initial);
  const [showSecret, setShowSecret] = useState(false);
  const [prevInitial, setPrevInitial] = useState(initial);

  if (initial !== prevInitial) { setPrevInitial(initial); setForm(initial); }

  const set = <K extends keyof ProviderForm>(k: K, v: ProviderForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  function randomSecret() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    return "rpf_" + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const opCount = form.operationsText.split("\n").filter((s) => s.trim()).length;

  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-400">
        {isEdit ? "Provider ID không thể thay đổi" : "Client Secret hiển thị một lần duy nhất"}
      </span>
      <Space>
        <Button onClick={onClose}>Hủy</Button>
        <Button type="primary" onClick={() => onSubmit(form)}>
          {isEdit ? "Lưu thay đổi" : "+ Đăng ký"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? `Sửa: ${target?.displayName}` : "Đăng ký Provider mới"}
      styles={{ wrapper: { width: 640 } }}
      footer={footer}
    >
      <PreviewStrip form={form} />

      {/* Identity */}
      <SectionDivider>Danh tính</SectionDivider>
      <Form layout="vertical" component="div">

        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Provider ID" required>
            <Input
              value={form.providerId}
              disabled={isEdit}
              placeholder="excel-provider"
              onChange={(e) => {
                const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
                set("providerId", v);
                if (!isEdit) set("clientId", v);
              }}
            />
          </Form.Item>
          <Form.Item label="Client ID" required>
            <Input
              value={form.clientId}
              disabled={isEdit}
              placeholder="excel-provider"
              onChange={(e) => set("clientId", e.target.value)}
            />
          </Form.Item>
        </div>

        <Form.Item label="Display Name" required>
          <Input
            value={form.displayName}
            placeholder="Excel Data Provider"
            onChange={(e) => set("displayName", e.target.value)}
          />
        </Form.Item>

        <Form.Item label="Mô tả">
          <Input.TextArea
            rows={2}
            value={form.description}
            placeholder="Mô tả ngắn về provider và các operation nó xử lý…"
            onChange={(e) => set("description", e.target.value)}
          />
        </Form.Item>

        {!isEdit && (
          <Form.Item label="Client Secret" required extra="Lưu ngay sau khi tạo — sẽ không hiển thị lại">
            <Space.Compact className="w-full">
              <Input.Password
                className="flex-1"
                value={form.clientSecret}
                placeholder="rpf_live_..."
                visibilityToggle={{ visible: showSecret, onVisibleChange: setShowSecret }}
                onChange={(e) => set("clientSecret", e.target.value)}
              />
              <Button
                icon={<RefreshCw size={13} />}
                onClick={() => set("clientSecret", randomSecret())}
                title="Tạo ngẫu nhiên"
              />
            </Space.Compact>
            {form.clientSecret && (
              <Alert
                type="warning"
                showIcon
                title="Sao chép và lưu ngay — sẽ không hiển thị lại sau khi tạo."
                className="mt-2"
                banner
              />
            )}
          </Form.Item>
        )}

        {/* Operations */}
        <SectionDivider>Operations</SectionDivider>

        <Form.Item
          label="Danh sách operation patterns"
          extra="Mỗi dòng một pattern"
          required
        >
          <Input.TextArea
            rows={5}
            value={form.operationsText}
            placeholder={"report.dashboard.summary\nreport.sales.trend\nml.fraud.score"}
            onChange={(e) => set("operationsText", e.target.value)}
            className="font-mono !text-[12px]"
          />
          {opCount > 0 && (
            <div className="text-[10px] text-gray-400 mt-1">{opCount} operations đã khai báo</div>
          )}
        </Form.Item>

        {/* Runtime config */}
        <SectionDivider>Cấu hình runtime</SectionDivider>

        <div className="grid grid-cols-3 gap-3">
          <Form.Item label="Timeout (ms)">
            <InputNumber
              className="w-full"
              value={form.timeoutMs}
              min={1000}
              step={1000}
              onChange={(v) => set("timeoutMs", v ?? 30000)}
            />
          </Form.Item>
          <Form.Item label="Priority (1=cao)">
            <InputNumber
              className="w-full"
              value={form.priority}
              min={1}
              max={10}
              onChange={(v) => set("priority", Math.max(1, Math.min(10, v ?? 5)))}
            />
          </Form.Item>
          <Form.Item label="Max Concurrent">
            <InputNumber
              className="w-full"
              value={form.maxConcurrentRequests}
              min={1}
              onChange={(v) => set("maxConcurrentRequests", v ?? 8)}
            />
          </Form.Item>
        </div>

        {/* Circuit breaker */}
        <SectionDivider>Circuit Breaker</SectionDivider>

        <div className="grid grid-cols-3 gap-3">
          <Form.Item label="Failure Threshold">
            <InputNumber
              className="w-full"
              value={form.cbFailureThreshold}
              min={1}
              onChange={(v) => set("cbFailureThreshold", v ?? 5)}
            />
          </Form.Item>
          <Form.Item label="Window (s)">
            <InputNumber
              className="w-full"
              value={form.cbWindowSeconds}
              min={5}
              onChange={(v) => set("cbWindowSeconds", v ?? 60)}
            />
          </Form.Item>
          <Form.Item label="Cooldown (s)">
            <InputNumber
              className="w-full"
              value={form.cbCooldownSeconds}
              min={5}
              onChange={(v) => set("cbCooldownSeconds", v ?? 30)}
            />
          </Form.Item>
        </div>
        <div className="text-[10px] text-gray-400 -mt-3 mb-4">
          Circuit OPEN sau {form.cbFailureThreshold} lỗi trong {form.cbWindowSeconds}s · Cooldown {form.cbCooldownSeconds}s
        </div>

        {/* Status — edit only */}
        {isEdit && (
          <>
            <SectionDivider>Trạng thái</SectionDivider>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s];
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s as ProviderStatus)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all"
                    style={
                      active
                        ? { borderColor: meta.color, background: meta.bg }
                        : { borderColor: "transparent", background: "transparent" }
                    }
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    <span className="text-xs font-semibold" style={{ color: active ? meta.color : undefined }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Form>
    </Drawer>
  );
}
