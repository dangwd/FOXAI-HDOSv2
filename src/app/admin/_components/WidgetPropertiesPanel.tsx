"use client";

import { useState } from "react";
import { Select, Tag, Input, AutoComplete } from "antd";
import { X } from "lucide-react";
import type { WidgetSchemaEntry, ProviderInfo, OperationEntry } from "@/infrastructure/http/adminApi";
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_COLOR } from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";
import { Field } from "./shared";

export function WidgetPropertiesPanel({
  widget,
  catalog,
  providers,
  operations,
  onClose,
  onChange,
}: {
  widget:     DesignerWidget;
  catalog:    WidgetSchemaEntry[];
  providers:  ProviderInfo[];
  operations: OperationEntry[];
  onClose:    () => void;
  onChange:   (updated: DesignerWidget) => void;
}) {
  const [form, setForm] = useState<DesignerWidget>(widget);
  // bindingsInput is kept as local text state; committed on blur to avoid
  // re-parsing the comma-separated string on every keystroke.
  const [bindingsInput, setBindingsInput] = useState(widget.filterBindings.join(", "));

  const entry          = catalog.find((e) => e.chartType === form.chartType);
  const isFilterWidget = entry?.category === "filter";
  const filteredOps    = form.providerId
    ? operations.filter((op) => op.providerId === form.providerId)
    : operations;

  // Every field change immediately commits to the designer (sets isDirty=true).
  function set<K extends keyof DesignerWidget>(key: K, val: DesignerWidget[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    onChange(updated);
  }

  // Bindings parsed and committed on blur.
  function commitBindings(raw: string) {
    const bindings = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const updated = { ...form, filterBindings: bindings };
    setForm(updated);
    onChange(updated);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-[#30363d] shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0">Thuộc tính widget</p>
          {entry && (
            <div className="flex items-center gap-1 mt-0.5">
              <Tag
                color={CATEGORY_COLOR[entry.category]}
                style={{ fontSize: 9, padding: "0 3px", lineHeight: "14px", margin: 0 }}
              >
                {CATEGORY_LABELS[entry.category]}
              </Tag>
              <span className="text-[10px] text-gray-400 dark:text-[#484f58]">{entry.description}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Grid coords (readonly) */}
        <div className="grid grid-cols-4 gap-1">
          {(["X", "Y", "W", "H"] as const).map((lbl, i) => (
            <div key={lbl} className="text-center bg-gray-50 dark:bg-[#21262d] border border-gray-100 dark:border-[#30363d] rounded-lg p-1.5">
              <div className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase">{lbl}</div>
              <div className="text-sm font-bold text-violet-600 dark:text-violet-400 font-mono">
                {[form.gridX, form.gridY, form.gridW, form.gridH][i]}
              </div>
            </div>
          ))}
        </div>

        <Field label="Tiêu đề">
          <Input
            size="small"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Widget title"
          />
        </Field>

        <Field label="Phụ đề">
          <Input
            size="small"
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Subtitle / description"
          />
        </Field>

        <Field label="Loại widget">
          <Select
            size="small"
            value={form.chartType}
            onChange={(v) => set("chartType", v)}
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="label"
            options={CATEGORY_ORDER.flatMap((cat) => {
              const items = catalog.filter((e) => e.category === cat);
              if (items.length === 0) return [];
              return [{ label: CATEGORY_LABELS[cat], options: items.map((e) => ({ value: e.chartType, label: e.label })) }];
            })}
          />
        </Field>

        <Field label="Nguồn dữ liệu (Provider)">
          <Select
            size="small"
            value={form.providerId || undefined}
            onChange={(v) => set("providerId", v ?? "")}
            allowClear
            placeholder="Chọn provider..."
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="label"
            options={providers.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Field>

        <Field label="Operation">
          <AutoComplete
            size="small"
            value={form.operationPattern}
            onChange={(v) => set("operationPattern", v ?? "")}
            allowClear
            placeholder="Chọn hoặc nhập operation pattern..."
            style={{ width: "100%" }}
            options={filteredOps.map((op) => ({ value: op.pattern, label: op.pattern }))}
            filterOption={(input, option) =>
              (option?.value as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Field>

        <Field label="Params Template (JSON)">
          <Input.TextArea
            value={form.paramsTemplate}
            onChange={(e) => set("paramsTemplate", e.target.value)}
            rows={4}
            spellCheck={false}
            style={{ fontFamily: "monospace", fontSize: 10 }}
          />
        </Field>

        <Field label="Visual Config (JSON)">
          <Input.TextArea
            value={form.visualConfig}
            onChange={(e) => set("visualConfig", e.target.value)}
            rows={4}
            spellCheck={false}
            style={{ fontFamily: "monospace", fontSize: 10 }}
          />
        </Field>

        {!isFilterWidget && (
          <Field label="Filter Bindings (cách nhau bằng dấu phẩy)">
            <Input
              size="small"
              value={bindingsInput}
              onChange={(e) => setBindingsInput(e.target.value)}
              onBlur={(e) => commitBindings(e.target.value)}
              placeholder="filterKey1, filterKey2"
            />
          </Field>
        )}

        {isFilterWidget && (
          <Field label="Filter Key">
            <Input
              size="small"
              value={form.filterKey}
              onChange={(e) => set("filterKey", e.target.value)}
              placeholder="e.g. region"
            />
          </Field>
        )}

        <Field label="Interactions (JSON)">
          <Input.TextArea
            value={form.interactions}
            onChange={(e) => set("interactions", e.target.value)}
            rows={3}
            spellCheck={false}
            style={{ fontFamily: "monospace", fontSize: 10 }}
          />
        </Field>

        {/* Widget key (readonly) */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#21262d] border border-gray-100 dark:border-[#30363d]">
          <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">KEY</span>
          <code className="text-[10px] text-gray-500 dark:text-[#8b949e] flex-1 truncate">{widget.widgetKey}</code>
        </div>
      </div>
    </div>
  );
}
