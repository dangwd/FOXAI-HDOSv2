"use client";

import { useState } from "react";
import { Input } from "antd";
import { X } from "lucide-react";
import type { WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { WIDGET_TYPE_LABELS, WIDGET_TYPE_DESCRIPTIONS } from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";
import { Field } from "./shared";

export function WidgetPropertiesPanel({
  widget,
  catalog,
  onClose,
  onChange,
}: {
  widget:   DesignerWidget;
  catalog:  WidgetCatalogEntry[];
  onClose:  () => void;
  onChange: (updated: DesignerWidget) => void;
}) {
  const [form, setForm] = useState<DesignerWidget>(widget);

  const entry       = catalog.find((e) => e.widgetType === form.widgetType);
  const typeLabel   = WIDGET_TYPE_LABELS[form.widgetType] ?? form.widgetType;
  const typeDesc    = entry?.description ?? WIDGET_TYPE_DESCRIPTIONS[form.widgetType] ?? "";
  const isFormSection = form.widgetType === "FormSection";

  function set<K extends keyof DesignerWidget>(key: K, val: DesignerWidget[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    onChange(updated);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-[#30363d] shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0">Thuộc tính widget</p>
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">{typeDesc}</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Widget type (readonly badge) */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#21262d] border border-gray-100 dark:border-[#30363d]">
          <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">TYPE</span>
          <code className="text-[10px] text-violet-600 dark:text-violet-400 flex-1 truncate">{typeLabel}</code>
        </div>

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

        <Field label="Nhãn hiển thị">
          <Input
            size="small"
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Tên widget"
          />
        </Field>

        {isFormSection && (
          <Field label="Reference ID (FormTemplate UUID)">
            <Input
              size="small"
              value={form.referenceId ?? ""}
              onChange={(e) => set("referenceId", e.target.value || null)}
              placeholder="UUID của FormTemplate"
              className="font-mono"
            />
          </Field>
        )}

        <Field label="Config JSON">
          <Input.TextArea
            value={form.configJson}
            onChange={(e) => set("configJson", e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder="{}"
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
