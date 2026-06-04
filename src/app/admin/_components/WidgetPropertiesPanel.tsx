"use client";

import { useState } from "react";
import { Input, Switch, Tooltip } from "antd";
import { X, Plus, Trash2 } from "lucide-react";
import type { WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { WIDGET_TYPE_LABELS, WIDGET_TYPE_DESCRIPTIONS } from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";
import { Field } from "./shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJson(s: string): Record<string, unknown> {
  try { return JSON.parse(s) as Record<string, unknown>; } catch { return {}; }
}

function patchJson(existing: string, patch: Record<string, unknown>): string {
  const base = safeJson(existing);
  return JSON.stringify({ ...base, ...patch }, null, 2);
}

// ─── Widget category detection ────────────────────────────────────────────────

type BindingCategory = "kpi" | "series-chart" | "pie-chart" | "table" | "form-section" | "none";

function getBindingCategory(widgetType: string): BindingCategory {
  if (widgetType === "FormSection") return "form-section";
  if (widgetType === "kpi") return "kpi";
  if (["line_chart", "bar_chart", "area_chart"].includes(widgetType)) return "series-chart";
  if (["pie_chart", "donut_chart"].includes(widgetType)) return "pie-chart";
  if (["simple_table", "advanced_table", "data_table"].includes(widgetType)) return "table";
  return "none";
}

// ─── Shared expression input ──────────────────────────────────────────────────

function ExpressionInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <Field label={label}>
      <Input
        size="small"
        value={value}
        placeholder="{{sources.namespace.field}}"
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
      {hint && (
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">{hint}</p>
      )}
    </Field>
  );
}

// ─── KPI binding ──────────────────────────────────────────────────────────────

function KpiBinding({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);

  function set(key: string, value: string) {
    onChange(patchJson(configJson, { [key]: value || undefined }));
  }

  return (
    <div className="space-y-3">
      <ExpressionInput
        label="Value Expression"
        value={(cfg.valueExpression as string) ?? ""}
        onChange={(v) => set("valueExpression", v)}
        hint="Ví dụ: {{sources.record.SoBenhNhan}}"
      />
      <Field label="Display Format">
        <Input
          size="small"
          value={(cfg.displayFormat as string) ?? ""}
          placeholder="date:DD/MM/YYYY  hoặc  currency:VND"
          onChange={(e) => set("displayFormat", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Unit">
          <Input size="small" value={(cfg.unit as string) ?? ""} placeholder="BN, ca, %" onChange={(e) => set("unit", e.target.value)} />
        </Field>
        <Field label="Color">
          <Input size="small" value={(cfg.color as string) ?? ""} placeholder="#6366f1" onChange={(e) => set("color", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

// ─── Series chart binding (line / bar / area) ─────────────────────────────────

function SeriesChartBinding({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);

  function set(key: string, value: string) {
    onChange(patchJson(configJson, { [key]: value || undefined }));
  }

  return (
    <div className="space-y-3">
      <ExpressionInput
        label="Data Expression (array)"
        value={(cfg.dataExpression as string) ?? ""}
        onChange={(v) => set("dataExpression", v)}
        hint="Ví dụ: {{sources.report.rows}} — phải là mảng"
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Label Field">
          <Input size="small" value={(cfg.labelField as string) ?? ""} placeholder="TenKhoa" onChange={(e) => set("labelField", e.target.value)} />
        </Field>
        <Field label="Value Field">
          <Input size="small" value={(cfg.valueField as string) ?? ""} placeholder="SoBenhNhan" onChange={(e) => set("valueField", e.target.value)} />
        </Field>
      </div>
      <Field label="Color">
        <Input size="small" value={(cfg.color as string) ?? ""} placeholder="#1677ff" onChange={(e) => set("color", e.target.value)} />
      </Field>
    </div>
  );
}

// ─── Pie chart binding ────────────────────────────────────────────────────────

function PieChartBinding({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);

  function set(key: string, value: string) {
    onChange(patchJson(configJson, { [key]: value || undefined }));
  }

  return (
    <div className="space-y-3">
      <ExpressionInput
        label="Data Expression (array)"
        value={(cfg.dataExpression as string) ?? ""}
        onChange={(v) => set("dataExpression", v)}
        hint="Ví dụ: {{sources.report.rows}}"
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Label Field">
          <Input size="small" value={(cfg.labelField as string) ?? ""} placeholder="TenKhoa" onChange={(e) => set("labelField", e.target.value)} />
        </Field>
        <Field label="Value Field">
          <Input size="small" value={(cfg.valueField as string) ?? ""} placeholder="SoBenhNhan" onChange={(e) => set("valueField", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

// ─── Table binding ────────────────────────────────────────────────────────────

interface TableColumn { field: string; header: string }

function TableBinding({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);
  const cols: TableColumn[] = Array.isArray(cfg.columns)
    ? (cfg.columns as TableColumn[])
    : [];

  function set(key: string, value: unknown) {
    onChange(patchJson(configJson, { [key]: value }));
  }

  function updateCol(idx: number, col: TableColumn) {
    const next = cols.map((c, i) => (i === idx ? col : c));
    set("columns", next);
  }

  function removeCol(idx: number) {
    set("columns", cols.filter((_, i) => i !== idx));
  }

  function addCol() {
    set("columns", [...cols, { field: "", header: "" }]);
  }

  const inputCls =
    "flex-1 rounded border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] " +
    "text-[11px] px-2 py-1 outline-none focus:border-violet-500 " +
    "text-gray-800 dark:text-[#e6edf3] placeholder-gray-300 dark:placeholder-[#484f58]";

  return (
    <div className="space-y-3">
      <ExpressionInput
        label="Data Expression (array)"
        value={(cfg.dataExpression as string) ?? ""}
        onChange={(v) => set("dataExpression", v)}
        hint="Ví dụ: {{sources.ward}} — mỗi phần tử là 1 hàng"
      />

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#484f58] uppercase tracking-wider m-0">
            Cột ({cols.length})
          </p>
          <button
            onClick={addCol}
            className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
          >
            <Plus size={10} /> Thêm cột
          </button>
        </div>

        {cols.length === 0 ? (
          <p className="text-[11px] text-gray-400 dark:text-[#484f58] text-center py-2">
            Tự động dùng tất cả field nếu để trống.
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1 px-0.5">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Field name</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Tiêu đề cột</span>
            </div>
            {cols.map((col, i) => (
              <div key={i} className="flex items-center gap-1">
                <input className={inputCls} value={col.field} placeholder="TenBenhNhan"
                  onChange={(e) => updateCol(i, { ...col, field: e.target.value })} />
                <input className={inputCls} value={col.header} placeholder="Họ tên"
                  onChange={(e) => updateCol(i, { ...col, header: e.target.value })} />
                <button onClick={() => removeCol(i)}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FormSection fields editor ────────────────────────────────────────────────

interface FieldDef {
  key: string; label: string; fieldType: string; order: number; required: boolean;
  width?: string; isReadOnly?: boolean; placeholder?: string; options?: string[];
  dataBinding?: { expression: string; displayFormat: string | null } | null;
}
interface FormSchema { fields: FieldDef[] }

function FieldRow({ field, onChange, onDelete }: { field: FieldDef; onChange: (f: FieldDef) => void; onDelete: () => void }) {
  const inputCls =
    "w-full rounded border border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] " +
    "text-gray-800 dark:text-[#e6edf3] text-[11px] px-2 py-1 outline-none " +
    "focus:border-violet-500 placeholder-gray-300 dark:placeholder-[#484f58]";

  return (
    <div className="rounded-lg border border-gray-100 dark:border-[#21262d] bg-gray-50 dark:bg-[#161b22] p-2.5 space-y-2">
      <div className="flex items-center gap-1.5 justify-between">
        <code className="text-[10px] text-violet-600 dark:text-violet-400 font-mono truncate">{field.key || "key"}</code>
        <div className="flex items-center gap-1.5">
          <Tooltip title="Read-only (auto-filled)">
            <Switch size="small" checked={field.isReadOnly ?? false} onChange={(v) => onChange({ ...field, isReadOnly: v })} />
          </Tooltip>
          <button onClick={onDelete} className="w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Field Key</p>
          <input className={inputCls} value={field.key} placeholder="field_key"
            onChange={(e) => onChange({ ...field, key: e.target.value })} />
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Field Type</p>
          <select className={`${inputCls} cursor-pointer`} value={field.fieldType}
            onChange={(e) => onChange({ ...field, fieldType: e.target.value })}>
            {["Text", "Textarea", "Number", "Date", "Select"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Label</p>
        <input className={inputCls} value={field.label} placeholder="Họ tên bệnh nhân"
          onChange={(e) => onChange({ ...field, label: e.target.value })} />
      </div>
      {field.isReadOnly && (
        <>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
              Expression <span className="normal-case text-gray-300">{"{{sources.ns.field}}"}</span>
            </p>
            <input className={`${inputCls} font-mono`}
              value={field.dataBinding?.expression ?? ""}
              placeholder="{{sources.record.TenBenhNhan}}"
              onChange={(e) => onChange({ ...field, dataBinding: { expression: e.target.value, displayFormat: field.dataBinding?.displayFormat ?? null } })}
            />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Display Format</p>
            <input className={inputCls} value={field.dataBinding?.displayFormat ?? ""}
              placeholder="date:DD/MM/YYYY  hoặc  currency:VND"
              onChange={(e) => onChange({ ...field, dataBinding: { expression: field.dataBinding?.expression ?? "", displayFormat: e.target.value || null } })}
            />
          </div>
        </>
      )}
      {field.fieldType === "Select" && (
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Options (mỗi dòng)</p>
          <textarea className={`${inputCls} resize-none`} rows={3}
            value={(field.options ?? []).join("\n")} placeholder={"Đạt tiêu chuẩn\nKhông đạt\nCần hội chẩn"}
            onChange={(e) => onChange({ ...field, options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
      )}
    </div>
  );
}

function FormSectionEditor({ configJson, onChange }: { configJson: string; onChange: (json: string) => void }) {
  const cfg = safeJson(configJson);
  const schema = (cfg.formSchema ?? { fields: [] }) as FormSchema;
  const fields: FieldDef[] = schema.fields ?? [];

  function save(updated: FieldDef[]) {
    onChange(JSON.stringify({ ...cfg, formSchema: { ...schema, fields: updated } }, null, 2));
  }
  function update(idx: number, f: FieldDef) { save(fields.map((x, i) => (i === idx ? f : x))); }
  function remove(idx: number) { save(fields.filter((_, i) => i !== idx)); }
  function add() {
    const order = (fields[fields.length - 1]?.order ?? 0) + 1;
    save([...fields, { key: `field_${order}`, label: "Trường mới", fieldType: "Text", order, required: false }]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-gray-500 dark:text-[#484f58] uppercase tracking-wider m-0">Fields ({fields.length})</p>
        <button onClick={add} className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 hover:underline">
          <Plus size={10} /> Thêm field
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-[#484f58] text-center py-3">
          Chưa có field. <button onClick={add} className="text-violet-600 hover:underline">Thêm mới</button>
        </p>
      ) : (
        <div className="space-y-2">
          {[...fields].sort((a, b) => a.order - b.order).map((f, i) => (
            <FieldRow key={i} field={f} onChange={(u) => update(i, u)} onDelete={() => remove(i)} />
          ))}
        </div>
      )}
      <Field label="Form Key (dùng cho submit)">
        <Input size="small" value={(cfg.formKey as string | undefined) ?? ""} placeholder="patient-data"
          onChange={(e) => onChange(JSON.stringify({ ...cfg, formKey: e.target.value || undefined }, null, 2))}
        />
      </Field>
    </div>
  );
}

// ─── Expression syntax hint box ───────────────────────────────────────────────

function SyntaxHint() {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-[#161b22] border border-gray-100 dark:border-[#21262d] px-3 py-2 space-y-1">
      <p className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider m-0">Cú pháp</p>
      <code className="text-[10px] text-violet-600 dark:text-violet-400 block">{"{{sources.<namespace>.<field>}}"}</code>
      <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0">Namespace được khai báo tại tab DataSources</p>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type PanelTab = "config" | "binding";

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
  const bindingCategory = getBindingCategory(form.widgetType);
  const hasBindingTab = bindingCategory !== "none";
  const [activeTab, setActiveTab] = useState<PanelTab>(hasBindingTab ? "binding" : "config");

  const entry     = catalog.find((e) => e.widgetType === form.widgetType);
  const typeLabel = WIDGET_TYPE_LABELS[form.widgetType] ?? form.widgetType;
  const typeDesc  = entry?.description ?? WIDGET_TYPE_DESCRIPTIONS[form.widgetType] ?? "";

  function set<K extends keyof DesignerWidget>(key: K, val: DesignerWidget[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    onChange(updated);
  }

  function setConfigJson(json: string) { set("configJson", json); }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-[#30363d] shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0">Thuộc tính widget</p>
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">{typeDesc || typeLabel}</p>
        </div>
        <button onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Tab switcher */}
      {hasBindingTab && (
        <div className="flex border-b border-gray-200 dark:border-[#30363d] shrink-0">
          {([
            { key: "binding", label: bindingCategory === "form-section" ? "Fields & Binding" : "Data Binding" },
            { key: "config",  label: "JSON / Cấu hình" },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === t.key
                  ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400"
                  : "text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#e6edf3]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ── Data Binding tab ── */}
        {hasBindingTab && activeTab === "binding" ? (
          <>
            <SyntaxHint />

            {bindingCategory === "kpi" && (
              <KpiBinding configJson={form.configJson} onChange={setConfigJson} />
            )}
            {(bindingCategory === "series-chart") && (
              <SeriesChartBinding configJson={form.configJson} onChange={setConfigJson} />
            )}
            {bindingCategory === "pie-chart" && (
              <PieChartBinding configJson={form.configJson} onChange={setConfigJson} />
            )}
            {bindingCategory === "table" && (
              <TableBinding configJson={form.configJson} onChange={setConfigJson} />
            )}
            {bindingCategory === "form-section" && (
              <FormSectionEditor configJson={form.configJson} onChange={setConfigJson} />
            )}
          </>
        ) : (
          /* ── Config / JSON tab ── */
          <>
            {/* Type badge */}
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#21262d] border border-gray-100 dark:border-[#30363d]">
              <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">TYPE</span>
              <code className="text-[10px] text-violet-600 dark:text-violet-400 flex-1 truncate">{typeLabel}</code>
            </div>

            {/* Grid coords */}
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
              <Input size="small" value={form.label}
                onChange={(e) => set("label", e.target.value)} placeholder="Tên widget" />
            </Field>

            {bindingCategory === "form-section" && (
              <Field label="Reference ID (FormTemplate UUID)">
                <Input size="small" value={form.referenceId ?? ""}
                  onChange={(e) => set("referenceId", e.target.value || null)}
                  placeholder="UUID của FormTemplate" className="font-mono" />
              </Field>
            )}

            <Field label="Config JSON">
              <Input.TextArea
                value={form.configJson}
                onChange={(e) => set("configJson", e.target.value)}
                rows={8} spellCheck={false} placeholder="{}"
                style={{ fontFamily: "monospace", fontSize: 10 }}
              />
            </Field>

            {/* Widget key */}
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#21262d] border border-gray-100 dark:border-[#30363d]">
              <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">KEY</span>
              <code className="text-[10px] text-gray-500 dark:text-[#8b949e] flex-1 truncate">{widget.widgetKey}</code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
