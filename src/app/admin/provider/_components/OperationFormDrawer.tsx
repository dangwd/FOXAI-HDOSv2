"use client";

import { useState } from "react";
import { Checkbox, Drawer, Form, Input, InputNumber, Select, Button, Space } from "antd";
import type { OperationForm, OperationHandler, OperationStatus } from "../_lib/types";
import { OPERATION_STATUS_META, RESULT_CHART_TYPES } from "../_lib/constants";

const HANDLER_OPTIONS: { value: OperationHandler; label: string }[] = [
  { value: "provider",   label: "provider"   },
  { value: "datasource", label: "datasource" },
  { value: "widget",     label: "widget"     },
  { value: "admin",      label: "admin"      },
];

export function OperationFormDrawer({
  open,
  isEdit,
  initial,
  onSubmit,
  onClose,
}: {
  open:      boolean;
  isEdit:    boolean;
  initial:   OperationForm;
  onSubmit:  (form: OperationForm) => void;
  onClose:   () => void;
}) {
  const [form, setForm] = useState<OperationForm>(initial);
  const [prev, setPrev] = useState<OperationForm>(initial);

  if (initial !== prev) { setPrev(initial); setForm(initial); }

  function set<K extends keyof OperationForm>(k: K, v: OperationForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const footer = (
    <div className="flex justify-end">
      <Space>
        <Button onClick={onClose}>Huỷ</Button>
        <Button type="primary" onClick={() => onSubmit(form)}>
          {isEdit ? "Lưu thay đổi" : "Thêm"}
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Sửa operation" : "Thêm operation mới"}
      styles={{ wrapper: { width: 560 } }}
      footer={footer}
    >
      <Form layout="vertical" component="div">

        {/* Operation Pattern */}
        <Form.Item
          label={<span>Operation Pattern <span className="text-red-500">*</span></span>}
        >
          <Input
            value={form.pattern}
            onChange={(e) => set("pattern", e.target.value)}
            placeholder="report.my.operation"
            className="font-mono"
          />
        </Form.Item>

        {/* Handler Type + Provider ID */}
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Handler Type">
            <Select
              value={form.handler}
              onChange={(v) => set("handler", v)}
              options={HANDLER_OPTIONS}
              className="w-full"
            />
          </Form.Item>
          <Form.Item label="Provider ID">
            <Input
              value={form.providerId}
              onChange={(e) => set("providerId", e.target.value)}
              placeholder="excel-provider"
              className="font-mono"
            />
          </Form.Item>
        </div>

        {/* Result Chart Type + Timeout */}
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Result Chart Type">
            <Select
              allowClear
              value={form.resultChartType ?? undefined}
              onChange={(v) => set("resultChartType", v ?? null)}
              placeholder="— none —"
              options={RESULT_CHART_TYPES}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              className="w-full"
            />
          </Form.Item>
          <Form.Item label="Timeout (ms)">
            <InputNumber
              className="w-full"
              value={form.timeoutMs}
              onChange={(v) => set("timeoutMs", v ?? 30000)}
              min={1000}
              step={1000}
            />
          </Form.Item>
        </div>

        {/* Cache TTL + Cacheable + Idempotent */}
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Cache TTL (giây)">
            <InputNumber
              className="w-full"
              value={form.cacheSeconds ?? undefined}
              onChange={(v) => set("cacheSeconds", v ?? null)}
              min={1}
              placeholder=""
            />
          </Form.Item>
          <Form.Item label=" ">
            <div className="flex items-center gap-5 h-8">
              <Checkbox
                checked={form.cacheSeconds !== null}
                onChange={(e) => set("cacheSeconds", e.target.checked ? 60 : null)}
              >
                Cacheable
              </Checkbox>
              <Checkbox
                checked={form.idempotent}
                onChange={(e) => set("idempotent", e.target.checked)}
              >
                Idempotent
              </Checkbox>
            </div>
          </Form.Item>
        </div>

        {/* Status — edit only */}
        {isEdit && (
          <Form.Item label="Trạng thái">
            <div className="flex gap-2">
              {(["active", "deprecated", "disabled"] as OperationStatus[]).map((s) => {
                const meta = OPERATION_STATUS_META[s];
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className="flex-1 py-2 rounded-lg border-2 text-[11px] font-semibold transition-colors"
                    style={
                      active
                        ? { borderColor: meta.color, background: meta.bg, color: meta.color }
                        : { borderColor: "transparent", background: "transparent" }
                    }
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {form.status === "deprecated" && (
              <p className="text-[10px] text-amber-500 mt-1 m-0">
                Vẫn nhận request nhưng client nhận cảnh báo deprecation.
              </p>
            )}
            {form.status === "disabled" && (
              <p className="text-[10px] text-gray-400 mt-1 m-0">
                Từ chối tất cả request (503).
              </p>
            )}
          </Form.Item>
        )}

      </Form>
    </Drawer>
  );
}
