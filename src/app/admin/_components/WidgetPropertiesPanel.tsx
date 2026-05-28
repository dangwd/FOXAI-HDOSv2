"use client";

import { useState } from "react";
import { Select, Tag } from "antd";
import type { WidgetSchemaEntry, ProviderInfo, OperationEntry } from "@/infrastructure/http/adminApi";
import { CATEGORY_ORDER, CATEGORY_LABELS, CATEGORY_COLOR } from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";
import { Field, IconX } from "./shared";

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
  const [bindingsInput, setBindingsInput] = useState(widget.filterBindings.join(", "));

  // Note: this component is rendered with key={widget.widgetKey} by the parent,
  // so it remounts fresh whenever the selected widget changes — no useEffect needed.
  function set<K extends keyof DesignerWidget>(key: K, val: DesignerWidget[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const filteredOps = form.providerId
    ? operations.filter((op) => op.providerId === form.providerId)
    : operations;

  const entry = catalog.find((e) => e.chartType === form.chartType);
  const isFilterWidget = entry?.category === "filter";

  function handleApply() {
    const bindings = bindingsInput.split(",").map((s) => s.trim()).filter(Boolean);
    onChange({ ...form, filterBindings: bindings });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-[#30363d] shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0">Thuộc tính widget</p>
          {entry && (
            <div className="flex items-center gap-1 mt-0.5">
              <Tag color={CATEGORY_COLOR[entry.category]} style={{ fontSize: 9, padding: "0 3px", lineHeight: "14px", margin: 0 }}>
                {CATEGORY_LABELS[entry.category]}
              </Tag>
              <span className="text-[10px] text-gray-400 dark:text-[#484f58]">{entry.description}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400
            hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
        >
          <IconX size={12} />
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
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Widget title"
            className="hdos-prop-input"
          />
        </Field>

        <Field label="Phụ đề">
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Subtitle / description"
            className="hdos-prop-input"
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
          <Select
            size="small"
            value={form.operationPattern || undefined}
            onChange={(v) => set("operationPattern", v ?? "")}
            allowClear
            placeholder="Chọn operation..."
            style={{ width: "100%" }}
            showSearch
            options={filteredOps.map((op) => ({ value: op.pattern, label: op.pattern }))}
          />
        </Field>

        <Field label="Params Template (JSON)">
          <textarea
            value={form.paramsTemplate}
            onChange={(e) => set("paramsTemplate", e.target.value)}
            rows={4}
            spellCheck={false}
            className="hdos-prop-textarea font-mono text-[10px]"
          />
        </Field>

        <Field label="Visual Config (JSON)">
          <textarea
            value={form.visualConfig}
            onChange={(e) => set("visualConfig", e.target.value)}
            rows={4}
            spellCheck={false}
            className="hdos-prop-textarea font-mono text-[10px]"
          />
        </Field>

        {!isFilterWidget && (
          <Field label="Filter Bindings (cách nhau bằng dấu phẩy)">
            <input
              type="text"
              value={bindingsInput}
              onChange={(e) => setBindingsInput(e.target.value)}
              placeholder="filterKey1, filterKey2"
              className="hdos-prop-input"
            />
          </Field>
        )}

        {isFilterWidget && (
          <Field label="Filter Key">
            <input
              type="text"
              value={form.filterKey}
              onChange={(e) => set("filterKey", e.target.value)}
              placeholder="e.g. region"
              className="hdos-prop-input"
            />
          </Field>
        )}

        <Field label="Interactions (JSON)">
          <textarea
            value={form.interactions}
            onChange={(e) => set("interactions", e.target.value)}
            rows={3}
            spellCheck={false}
            className="hdos-prop-textarea font-mono text-[10px]"
          />
        </Field>

        {/* Widget key (readonly) */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#21262d] border border-gray-100 dark:border-[#30363d]">
          <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">KEY</span>
          <code className="text-[10px] text-gray-500 dark:text-[#8b949e] flex-1 truncate">{widget.widgetKey}</code>
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-[#30363d] shrink-0">
        <button
          onClick={handleApply}
          className="w-full py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          Áp dụng thay đổi
        </button>
      </div>
    </div>
  );
}
