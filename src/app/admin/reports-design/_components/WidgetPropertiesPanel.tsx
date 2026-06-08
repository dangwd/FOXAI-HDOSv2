"use client";

import type { WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { Input, InputNumber, Switch, Tooltip } from "antd";
import { ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  WIDGET_TYPE_DESCRIPTIONS,
  WIDGET_TYPE_LABELS,
} from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";
import { Field } from "./shared";

// ─── Drag-and-drop hook for field expression drop targets ─────────────────────

function useFieldDrop(onChange: (expr: string) => void) {
  const [isDragOver, setIsDragOver] = useState(false);
  return {
    isDragOver,
    onDragOver(e: React.DragEvent) {
      if (
        e.dataTransfer.types.includes("application/x-field-expr") ||
        e.dataTransfer.types.includes("text/plain")
      ) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setIsDragOver(true);
      }
    },
    onDragLeave() {
      setIsDragOver(false);
    },
    onDrop(e: React.DragEvent) {
      e.preventDefault();
      setIsDragOver(false);
      const expr =
        e.dataTransfer.getData("application/x-field-expr") ||
        e.dataTransfer.getData("text/plain");
      if (expr && expr.includes("{{sources.")) onChange(expr);
    },
  };
}

// ─── Expression parser + visual pills ────────────────────────────────────────

function parseSourceExpr(
  expr: string,
): { namespace: string; path: string[] } | null {
  const m = /^\{\{sources\.([^.}]+)((?:\.[^}]+)*)\}\}$/.exec(expr.trim());
  if (!m) return null;
  return { namespace: m[1], path: m[2] ? m[2].slice(1).split(".") : [] };
}

function ExprPills({
  parsed,
  onClear,
}: {
  parsed: { namespace: string; path: string[] };
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
      <span className="text-[10px] font-mono text-gray-400 dark:text-[#484f58] shrink-0">
        sources.
      </span>
      <span className="inline-flex items-center px-1.5 py-px text-[10px] font-mono font-semibold rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/30">
        {parsed.namespace}
      </span>
      {parsed.path.flatMap((seg, i) => [
        <span
          key={`d${i}`}
          className="text-[9px] text-gray-300 dark:text-[#30363d]"
        >
          ·
        </span>,
        <span
          key={`s${i}`}
          className="inline-flex items-center px-1.5 py-px text-[10px] font-mono rounded bg-gray-100 dark:bg-[#161b22] text-gray-600 dark:text-[#8b949e] border border-gray-200 dark:border-[#1f2937]"
        >
          {seg}
        </span>,
      ])}
      <button
        onClick={onClear}
        className="ml-auto pl-1 text-gray-300 dark:text-[#484f58] hover:text-red-400 transition-colors shrink-0"
        title="Xóa biểu thức"
      >
        <X size={9} />
      </button>
    </div>
  );
}

// ─── Native input drop target (dùng trong FieldRow) ──────────────────────────

function ExprDropTarget({
  value,
  onChange,
  inputCls,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const parsed = parseSourceExpr(value);
  const showVisual = mode === "visual" && (value === "" || parsed !== null);

  const drop = useFieldDrop((expr) => {
    onChange(expr);
    setMode("visual");
  });

  return (
    <div
      onDragOver={drop.onDragOver}
      onDragLeave={drop.onDragLeave}
      onDrop={drop.onDrop}
      className={`rounded transition-all ${drop.isDragOver ? "ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-1" : ""}`}
    >
      {showVisual ? (
        <div
          className={`flex items-center gap-1 min-h-6.5 px-2 py-1 rounded border ${
            value
              ? "border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a]"
              : "border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/50 dark:bg-[#0f172a]/50"
          }`}
        >
          {value && parsed ? (
            <>
              <ExprPills parsed={parsed} onClear={() => onChange("")} />
              <button
                onClick={() => setMode("code")}
                className="shrink-0 ml-1 text-[9px] font-mono text-gray-300 dark:text-[#484f58] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Chỉnh mã"
              >
                {"</>"}
              </button>
            </>
          ) : (
            <span className="text-[10px] text-gray-300 dark:text-[#484f58] italic select-none">
              {placeholder ?? "Kéo field vào đây…"}
            </span>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            className={`${inputCls} font-mono pr-8`}
            value={value}
            placeholder={placeholder ?? "{{sources.namespace.field}}"}
            onChange={(e) => onChange(e.target.value)}
          />
          {parsed && (
            <button
              onClick={() => setMode("visual")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-gray-400 dark:text-[#484f58] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Xem trực quan"
            >
              UI
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function patchJson(existing: string, patch: Record<string, unknown>): string {
  const base = safeJson(existing);
  return JSON.stringify({ ...base, ...patch }, null, 2);
}

// ─── Widget category detection ────────────────────────────────────────────────

type BindingCategory =
  | "kpi"
  | "series-chart"
  | "scatter-chart"
  | "pie-chart"
  | "table"
  | "form-section"
  | "none";

function getBindingCategory(widgetType: string): BindingCategory {
  if (widgetType === "FormSection") return "form-section";
  if (widgetType === "kpi") return "kpi";
  if (["line_chart", "bar_chart", "area_chart"].includes(widgetType))
    return "series-chart";
  if (widgetType === "scatter") return "scatter-chart";
  if (["pie_chart", "donut_chart"].includes(widgetType)) return "pie-chart";
  if (["simple_table", "advanced_table", "data_table"].includes(widgetType))
    return "table";
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
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const parsed = parseSourceExpr(value);
  const showVisual = mode === "visual" && (value === "" || parsed !== null);

  const drop = useFieldDrop((expr) => {
    onChange(expr);
    setMode("visual");
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#484f58] uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center rounded overflow-hidden border border-gray-200 dark:border-[#1f2937]">
          <button
            onClick={() => setMode("visual")}
            title="Xem trực quan"
            className={`px-1.5 py-px text-[9px] font-medium transition-colors leading-snug ${
              mode === "visual"
                ? "bg-emerald-600 text-white"
                : "bg-transparent text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#8b949e]"
            }`}
          >
            UI
          </button>
          <button
            onClick={() => setMode("code")}
            title="Xem mã"
            className={`px-1.5 py-px text-[9px] font-mono font-medium transition-colors leading-snug ${
              mode === "code"
                ? "bg-emerald-600 text-white"
                : "bg-transparent text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#8b949e]"
            }`}
          >
            {"</>"}
          </button>
        </div>
      </div>

      <div
        onDragOver={drop.onDragOver}
        onDragLeave={drop.onDragLeave}
        onDrop={drop.onDrop}
        className={`rounded-lg transition-all ${drop.isDragOver ? "ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-1" : ""}`}
      >
        {showVisual ? (
          <div
            className={`flex items-center min-h-7 px-2.5 py-1 rounded-md border ${
              value
                ? "border-gray-200 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0f172a]"
                : "border-dashed border-gray-200 dark:border-[#30363d] bg-gray-50/50 dark:bg-[#0f172a]/50"
            }`}
          >
            {value && parsed ? (
              <ExprPills parsed={parsed} onClear={() => onChange("")} />
            ) : (
              <span className="text-[10px] text-gray-300 dark:text-[#484f58] italic select-none">
                Kéo field từ Field Browser hoặc nhập mã bên trên…
              </span>
            )}
          </div>
        ) : (
          <Input
            size="small"
            value={value}
            placeholder="{{sources.namespace.field}}"
            onChange={(e) => onChange(e.target.value)}
            className="font-mono"
          />
        )}
      </div>

      {hint && (
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Display Format Picker ────────────────────────────────────────────────────

type FormatType = "none" | "date" | "currency";

function parseDisplayFormat(value: string): {
  type: FormatType;
  param: string;
} {
  if (!value) return { type: "none", param: "" };
  if (value.startsWith("date:")) return { type: "date", param: value.slice(5) };
  if (value.startsWith("currency:"))
    return { type: "currency", param: value.slice(9) };
  return { type: "none", param: "" };
}

const DATE_PRESETS: { pattern: string; example: string }[] = [
  { pattern: "DD/MM/YYYY", example: "31/12/2024" },
  { pattern: "MM/DD/YYYY", example: "12/31/2024" },
  { pattern: "YYYY-MM-DD", example: "2024-12-31" },
  { pattern: "DD/MM/YY", example: "31/12/24" },
];

const CURRENCY_PRESETS: { code: string; example: string }[] = [
  { code: "VND", example: "1.234.567 ₫" },
  { code: "USD", example: "$1,234.57" },
  { code: "EUR", example: "€1.234,57" },
];

function DisplayFormatPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { type, param } = parseDisplayFormat(value);

  function setType(t: FormatType) {
    if (t === "none") onChange("");
    else if (t === "date") onChange("date:DD/MM/YYYY");
    else onChange("currency:VND");
  }

  const btnBase =
    "flex-1 py-1 text-[10px] font-medium rounded transition-colors leading-snug";
  const btnActive = "bg-emerald-600 text-white";
  const btnIdle =
    "bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#30363d]";

  return (
    <div className="space-y-1.5">
      {/* Type row */}
      <div className="flex gap-1">
        {(["none", "date", "currency"] as FormatType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`${btnBase} ${type === t ? btnActive : btnIdle}`}
          >
            {t === "none" ? "Không" : t === "date" ? "Ngày" : "Tiền tệ"}
          </button>
        ))}
      </div>

      {/* Date presets */}
      {type === "date" && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1">
            {DATE_PRESETS.map(({ pattern, example }) => (
              <button
                key={pattern}
                onClick={() => onChange(`date:${pattern}`)}
                className={`px-2 py-1.5 rounded text-left border transition-colors ${
                  param === pattern
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50"
                    : "bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-[#1f2937] hover:border-emerald-300 dark:hover:border-emerald-600/50"
                }`}
              >
                <div className="text-[10px] font-mono font-semibold text-gray-700 dark:text-[#e6edf3]">
                  {pattern}
                </div>
                <div className="text-[9px] text-gray-400 dark:text-[#484f58]">
                  {example}
                </div>
              </button>
            ))}
          </div>
          <Input
            size="small"
            prefix={
              <span className="text-[10px] text-gray-400 dark:text-[#484f58] font-mono select-none">
                date:
              </span>
            }
            value={param}
            placeholder="DD/MM/YYYY"
            onChange={(e) =>
              onChange(e.target.value ? `date:${e.target.value}` : "")
            }
            className="font-mono"
          />
        </div>
      )}

      {/* Currency presets */}
      {type === "currency" && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {CURRENCY_PRESETS.map(({ code, example }) => (
              <button
                key={code}
                onClick={() => onChange(`currency:${code}`)}
                className={`flex-1 px-1.5 py-1.5 rounded text-center border transition-colors ${
                  param === code
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50"
                    : "bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-[#1f2937] hover:border-emerald-300 dark:hover:border-emerald-600/50"
                }`}
              >
                <div className="text-[10px] font-mono font-semibold text-gray-700 dark:text-[#e6edf3]">
                  {code}
                </div>
                <div className="text-[9px] text-gray-400 dark:text-[#484f58]">
                  {example}
                </div>
              </button>
            ))}
          </div>
          <Input
            size="small"
            prefix={
              <span className="text-[10px] text-gray-400 dark:text-[#484f58] font-mono select-none">
                currency:
              </span>
            }
            value={param}
            placeholder="VND"
            onChange={(e) =>
              onChange(e.target.value ? `currency:${e.target.value}` : "")
            }
            className="font-mono"
          />
        </div>
      )}
    </div>
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
        <DisplayFormatPicker
          value={(cfg.displayFormat as string) ?? ""}
          onChange={(v) => set("displayFormat", v)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Unit">
          <Input
            size="small"
            value={(cfg.unit as string) ?? ""}
            placeholder="BN, ca, %"
            onChange={(e) => set("unit", e.target.value)}
          />
        </Field>
        <Field label="Color">
          <Input
            size="small"
            value={(cfg.color as string) ?? ""}
            placeholder="#6366f1"
            onChange={(e) => set("color", e.target.value)}
          />
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
      <Field label="Row Path (nếu mỗi phần tử lồng trong object)">
        <Input
          size="small"
          value={(cfg.rowPath as string) ?? ""}
          placeholder="data  (khi mỗi row là { data: { ... } })"
          onChange={(e) => set("rowPath", e.target.value)}
          className="font-mono"
        />
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
          Để trống nếu array đã flat
        </p>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Label Field">
          <Input
            size="small"
            value={(cfg.labelField as string) ?? ""}
            placeholder="TenKhoa"
            onChange={(e) => set("labelField", e.target.value)}
          />
        </Field>
        <Field label="Value Field">
          <Input
            size="small"
            value={(cfg.valueField as string) ?? ""}
            placeholder="SoBenhNhan"
            onChange={(e) => set("valueField", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Color">
          <Input
            size="small"
            value={(cfg.color as string) ?? ""}
            placeholder="#1677ff"
            onChange={(e) => set("color", e.target.value)}
          />
        </Field>
        <Field label="Unit (trục Y)">
          <Input
            size="small"
            value={(cfg.unit as string) ?? ""}
            placeholder="BN, %, tỷ"
            onChange={(e) => set("unit", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Scatter chart binding ────────────────────────────────────────────────────

function ScatterChartBinding({
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
        hint="Mỗi phần tử phải có ít nhất 2 field số (xField và yField)"
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="X Field">
          <Input
            size="small"
            value={(cfg.xField as string) ?? ""}
            placeholder="x"
            onChange={(e) => set("xField", e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field label="Y Field">
          <Input
            size="small"
            value={(cfg.yField as string) ?? ""}
            placeholder="y"
            onChange={(e) => set("yField", e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>
      <Field label="Z Field (kích thước điểm — tuỳ chọn)">
        <Input
          size="small"
          value={(cfg.zField as string) ?? ""}
          placeholder="TrongSo"
          onChange={(e) => set("zField", e.target.value)}
          className="font-mono"
        />
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
          Để trống nếu không cần bubble size
        </p>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="X Unit">
          <Input
            size="small"
            value={(cfg.xUnit as string) ?? ""}
            placeholder="tuổi"
            onChange={(e) => set("xUnit", e.target.value)}
          />
        </Field>
        <Field label="Y Unit">
          <Input
            size="small"
            value={(cfg.yUnit as string) ?? ""}
            placeholder="ngày"
            onChange={(e) => set("yUnit", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Color">
        <Input
          size="small"
          value={(cfg.color as string) ?? ""}
          placeholder="#059669"
          onChange={(e) => set("color", e.target.value)}
        />
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
      <Field label="Row Path (nếu mỗi phần tử lồng trong object)">
        <Input
          size="small"
          value={(cfg.rowPath as string) ?? ""}
          placeholder="data  (khi mỗi row là { data: { ... } })"
          onChange={(e) => set("rowPath", e.target.value)}
          className="font-mono"
        />
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
          Để trống nếu array đã flat
        </p>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Label Field">
          <Input
            size="small"
            value={(cfg.labelField as string) ?? ""}
            placeholder="TenKhoa"
            onChange={(e) => set("labelField", e.target.value)}
          />
        </Field>
        <Field label="Value Field">
          <Input
            size="small"
            value={(cfg.valueField as string) ?? ""}
            placeholder="SoBenhNhan"
            onChange={(e) => set("valueField", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Table binding ────────────────────────────────────────────────────────────

interface TableColumn {
  field: string;
  header: string;
}

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
    set(
      "columns",
      cols.filter((_, i) => i !== idx),
    );
  }

  function addCol() {
    set("columns", [...cols, { field: "", header: "" }]);
  }

  return (
    <div className="space-y-3">
      <ExpressionInput
        label="Data Expression (array)"
        value={(cfg.dataExpression as string) ?? ""}
        onChange={(v) => set("dataExpression", v)}
        hint="Ví dụ: {{sources.ward}} — mỗi phần tử là 1 hàng"
      />
      <Field label="Canonical At Key (unwrap JSON string trong từng row)">
        <Input
          size="small"
          value={(cfg.canonicalAtKey as string) ?? ""}
          placeholder="canonicalPayload"
          onChange={(e) => set("canonicalAtKey", e.target.value)}
          className="font-mono"
        />
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
          Dùng khi mỗi row từ /dm/records có field là JSON string
        </p>
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-[#484f58] uppercase tracking-wider m-0">
            Cột ({cols.length})
          </p>
          <button
            onClick={addCol}
            className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <Plus size={10} /> Thêm cột
          </button>
        </div>

        {cols.length === 0 ? (
          <p className="text-[11px] text-gray-400 dark:text-[#484f58] text-center py-2 m-0">
            Tự động dùng tất cả field nếu để trống.
          </p>
        ) : (
          <div className="space-y-2">
            {cols.map((col, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0f172a] p-2 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-[#484f58]">
                    Cột {i + 1}
                  </span>
                  <button
                    onClick={() => removeCol(i)}
                    className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    size="small"
                    value={col.field}
                    placeholder="Field name (vd: TenBenhNhan)"
                    onChange={(e) =>
                      updateCol(i, { ...col, field: e.target.value })
                    }
                    className="font-mono"
                  />
                  <Input
                    size="small"
                    value={col.header}
                    placeholder="Tiêu đề cột (vd: Họ tên)"
                    onChange={(e) =>
                      updateCol(i, { ...col, header: e.target.value })
                    }
                  />
                </div>
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
  key: string;
  label: string;
  fieldType: string;
  order: number;
  required: boolean;
  width?: string;
  isReadOnly?: boolean;
  placeholder?: string;
  options?: string[];
  dataBinding?: { expression: string; displayFormat: string | null } | null;
}
interface FormSchema {
  fields: FieldDef[];
}

function FieldRow({
  field,
  onChange,
  onDelete,
}: {
  field: FieldDef;
  onChange: (f: FieldDef) => void;
  onDelete: () => void;
}) {
  const inputCls =
    "w-full rounded border border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] " +
    "text-gray-800 dark:text-[#e6edf3] text-[11px] px-2 py-1 outline-none " +
    "focus:border-emerald-500 placeholder-gray-300 dark:placeholder-[#484f58]";

  return (
    <div className="rounded-lg border border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0f172a] p-2.5 space-y-2">
      <div className="flex items-center gap-1.5 justify-between">
        <code className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
          {field.key || "key"}
        </code>
        <div className="flex items-center gap-1.5">
          <Tooltip title="Read-only (auto-filled)">
            <Switch
              size="small"
              checked={field.isReadOnly ?? false}
              onChange={(v) => onChange({ ...field, isReadOnly: v })}
            />
          </Tooltip>
          <button
            onClick={onDelete}
            className="w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
            Field Key
          </p>
          <input
            className={inputCls}
            value={field.key}
            placeholder="field_key"
            onChange={(e) => onChange({ ...field, key: e.target.value })}
          />
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
            Field Type
          </p>
          <select
            className={`${inputCls} cursor-pointer`}
            value={field.fieldType}
            onChange={(e) => onChange({ ...field, fieldType: e.target.value })}
          >
            {["Text", "Textarea", "Number", "Date", "Select"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
          Label
        </p>
        <input
          className={inputCls}
          value={field.label}
          placeholder="Họ tên bệnh nhân"
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
      </div>
      {field.isReadOnly && (
        <>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
              Expression{" "}
              <span className="normal-case text-gray-300">
                {"{{sources.ns.field}}"}
              </span>
            </p>
            <ExprDropTarget
              value={field.dataBinding?.expression ?? ""}
              onChange={(expr) =>
                onChange({
                  ...field,
                  dataBinding: {
                    expression: expr,
                    displayFormat: field.dataBinding?.displayFormat ?? null,
                  },
                })
              }
              inputCls={inputCls}
              placeholder="{{sources.record.TenBenhNhan}}"
            />
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
              Display Format
            </p>
            <DisplayFormatPicker
              value={field.dataBinding?.displayFormat ?? ""}
              onChange={(v) =>
                onChange({
                  ...field,
                  dataBinding: {
                    expression: field.dataBinding?.expression ?? "",
                    displayFormat: v || null,
                  },
                })
              }
            />
          </div>
        </>
      )}
      {field.fieldType === "Select" && (
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
            Options (mỗi dòng)
          </p>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={(field.options ?? []).join("\n")}
            placeholder={"Đạt tiêu chuẩn\nKhông đạt\nCần hội chẩn"}
            onChange={(e) =>
              onChange({
                ...field,
                options: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}
    </div>
  );
}

function FormSectionEditor({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);
  const schema = (cfg.formSchema ?? { fields: [] }) as FormSchema;
  const fields: FieldDef[] = schema.fields ?? [];

  function save(updated: FieldDef[]) {
    onChange(
      JSON.stringify(
        { ...cfg, formSchema: { ...schema, fields: updated } },
        null,
        2,
      ),
    );
  }
  function update(idx: number, f: FieldDef) {
    save(fields.map((x, i) => (i === idx ? f : x)));
  }
  function remove(idx: number) {
    save(fields.filter((_, i) => i !== idx));
  }
  function add() {
    const order = (fields[fields.length - 1]?.order ?? 0) + 1;
    save([
      ...fields,
      {
        key: `field_${order}`,
        label: "Trường mới",
        fieldType: "Text",
        order,
        required: false,
      },
    ]);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-gray-500 dark:text-[#484f58] uppercase tracking-wider m-0">
          Fields ({fields.length})
        </p>
        <button
          onClick={add}
          className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <Plus size={10} /> Thêm field
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-[#484f58] text-center py-3">
          Chưa có field.{" "}
          <button onClick={add} className="text-emerald-600 hover:underline">
            Thêm mới
          </button>
        </p>
      ) : (
        <div className="space-y-2">
          {[...fields]
            .sort((a, b) => a.order - b.order)
            .map((f, i) => (
              <FieldRow
                key={i}
                field={f}
                onChange={(u) => update(i, u)}
                onDelete={() => remove(i)}
              />
            ))}
        </div>
      )}
      <Field label="Form Key (dùng cho submit)">
        <Input
          size="small"
          value={(cfg.formKey as string | undefined) ?? ""}
          placeholder="patient-data"
          onChange={(e) =>
            onChange(
              JSON.stringify(
                { ...cfg, formKey: e.target.value || undefined },
                null,
                2,
              ),
            )
          }
        />
      </Field>
    </div>
  );
}

// ─── Display category ─────────────────────────────────────────────────────────

type DisplayCategory = "text" | "gauge" | "table-extra" | "filter" | "common";

function getDisplayCategory(widgetType: string): DisplayCategory {
  if (["text_widget", "TextBlock", "text-widget"].includes(widgetType))
    return "text";
  if (["gauge", "Gauge"].includes(widgetType)) return "gauge";
  if (
    [
      "simple_table",
      "advanced_table",
      "Table",
      "DataTable",
      "data_table",
    ].includes(widgetType)
  )
    return "table-extra";
  if (widgetType.startsWith("filter_")) return "filter";
  return "common";
}

// ─── Common display config (mọi widget) — chỉ còn màu sau khi title kéo lên ──

function CommonDisplayConfig({
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
    <Field label="Màu accent">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={(cfg.color as string) ?? "#6366f1"}
          onChange={(e) => set("color", e.target.value)}
          className="w-8 h-7 rounded border border-gray-200 dark:border-[#1f2937] cursor-pointer shrink-0 p-0.5 bg-transparent"
        />
        <Input
          size="small"
          value={(cfg.color as string) ?? ""}
          placeholder="#6366f1"
          onChange={(e) => set("color", e.target.value)}
          className="font-mono flex-1"
        />
      </div>
    </Field>
  );
}

// ─── Text widget config ───────────────────────────────────────────────────────

function TextWidgetConfig({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);
  return (
    <Field label="Nội dung">
      <Input.TextArea
        size="small"
        value={(cfg.content as string) ?? ""}
        placeholder="Nội dung văn bản hiển thị trong widget…"
        rows={5}
        onChange={(e) =>
          onChange(
            patchJson(configJson, { content: e.target.value || undefined }),
          )
        }
      />
    </Field>
  );
}

// ─── Gauge config ─────────────────────────────────────────────────────────────

function GaugeDisplayConfig({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);

  function set(key: string, value: unknown) {
    onChange(patchJson(configJson, { [key]: value }));
  }

  return (
    <div className="space-y-3">
      <ExpressionInput
        label="Value Expression"
        value={(cfg.valueExpression as string) ?? ""}
        onChange={(v) => set("valueExpression", v || undefined)}
        hint="Ví dụ: {{sources.kpi.BORPercent}}"
      />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Min">
          <InputNumber
            size="small"
            value={(cfg.min as number) ?? 0}
            onChange={(v) => set("min", v)}
            className="w-full"
          />
        </Field>
        <Field label="Max">
          <InputNumber
            size="small"
            value={(cfg.max as number) ?? 100}
            onChange={(v) => set("max", v)}
            className="w-full"
          />
        </Field>
        <Field label="Đơn vị">
          <Input
            size="small"
            value={(cfg.unit as string) ?? ""}
            placeholder="%"
            onChange={(e) => set("unit", e.target.value || undefined)}
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Table extra display config ───────────────────────────────────────────────

function TableDisplayConfig({
  configJson,
  onChange,
}: {
  configJson: string;
  onChange: (json: string) => void;
}) {
  const cfg = safeJson(configJson);

  function set(key: string, value: unknown) {
    onChange(patchJson(configJson, { [key]: value }));
  }

  return (
    <div className="space-y-3">
      <Field label="Thông báo khi không có dữ liệu">
        <Input
          size="small"
          value={(cfg.emptyMessage as string) ?? ""}
          placeholder="Không có dữ liệu"
          onChange={(e) => set("emptyMessage", e.target.value || undefined)}
        />
      </Field>
      <Field label="Số hàng mỗi trang">
        <InputNumber
          size="small"
          value={(cfg.pageSize as number) ?? 10}
          min={1}
          max={200}
          onChange={(v) => set("pageSize", v)}
          className="w-full"
        />
      </Field>
    </div>
  );
}

// ─── Filter display config ────────────────────────────────────────────────────

function FilterDisplayConfig({
  configJson,
  onChange,
  widgetType,
}: {
  configJson: string;
  onChange: (json: string) => void;
  widgetType: string;
}) {
  const cfg = safeJson(configJson);

  function set(key: string, value: string) {
    onChange(patchJson(configJson, { [key]: value || undefined }));
  }

  return (
    <div className="space-y-3">
      <Field label="Placeholder">
        <Input
          size="small"
          value={(cfg.placeholder as string) ?? ""}
          placeholder="Gợi ý hiển thị trong input…"
          onChange={(e) => set("placeholder", e.target.value)}
        />
      </Field>
      {widgetType === "filter_slider" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min">
            <InputNumber
              size="small"
              value={(cfg.min as number) ?? 0}
              onChange={(v) => onChange(patchJson(configJson, { min: v }))}
              className="w-full"
            />
          </Field>
          <Field label="Max">
            <InputNumber
              size="small"
              value={(cfg.max as number) ?? 100}
              onChange={(v) => onChange(patchJson(configJson, { max: v }))}
              className="w-full"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Expression syntax hint box ───────────────────────────────────────────────

function SyntaxHint() {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-[#0f172a] border border-gray-100 dark:border-[#1f2937] px-3 py-2 space-y-1">
      <p className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider m-0">
        Cú pháp
      </p>
      <code className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
        {"{{sources.<namespace>.<field>}}"}
      </code>
      <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0">
        Namespace được khai báo tại tab DataSources
      </p>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type PanelTab = "display" | "binding" | "advanced";

export function WidgetPropertiesPanel({
  widget,
  catalog,
  onClose,
  onChange,
}: {
  widget: DesignerWidget;
  catalog: WidgetCatalogEntry[];
  onClose: () => void;
  onChange: (updated: DesignerWidget) => void;
}) {
  const [form, setForm] = useState<DesignerWidget>(widget);
  const [jsonOpen, setJsonOpen] = useState(false);

  const bindingCategory = getBindingCategory(form.widgetType);
  const displayCategory = getDisplayCategory(form.widgetType);
  const hasBindingTab = bindingCategory !== "none";

  const [activeTab, setActiveTab] = useState<PanelTab>(
    hasBindingTab ? "binding" : "display",
  );

  const entry = catalog.find((e) => e.widgetType === form.widgetType);
  const typeLabel = WIDGET_TYPE_LABELS[form.widgetType] ?? form.widgetType;
  const typeDesc =
    entry?.description ?? WIDGET_TYPE_DESCRIPTIONS[form.widgetType] ?? "";

  function set<K extends keyof DesignerWidget>(key: K, val: DesignerWidget[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    onChange(updated);
  }

  function setConfigJson(json: string) {
    set("configJson", json);
  }

  // Build tab list: Hiển thị | (Data Binding?) | Nâng cao
  const tabs: { key: PanelTab; label: string }[] = [
    { key: "display", label: "Hiển thị" },
    ...(hasBindingTab
      ? [
          {
            key: "binding" as PanelTab,
            label:
              bindingCategory === "form-section"
                ? "Fields & Binding"
                : "Data Binding",
          },
        ]
      : []),
    { key: "advanced", label: "Nâng cao" },
  ];

  // Detect invalid JSON for warning
  let jsonValid = true;
  try {
    JSON.parse(form.configJson);
  } catch {
    jsonValid = false;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-[#1f2937] shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0">
            Thuộc tính widget
          </p>
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
            {typeDesc || typeLabel}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#1f2937] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Tiêu đề widget — cố định trên mọi tab để không phải chuyển tab khi binding */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-[#1f2937] bg-gray-50/40 dark:bg-[#0a0f1a] shrink-0">
        <p className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider mb-1 m-0">
          Tiêu đề widget
        </p>
        <Input
          size="small"
          value={(safeJson(form.configJson).title as string) ?? ""}
          placeholder="Tên hiển thị trong widget"
          onChange={(e) =>
            setConfigJson(
              patchJson(form.configJson, {
                title: e.target.value || undefined,
              }),
            )
          }
        />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-[#1f2937] shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors ${
              activeTab === t.key
                ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                : "text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#e6edf3]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ── Hiển thị tab ── */}
        {activeTab === "display" && (
          <>
            <CommonDisplayConfig
              configJson={form.configJson}
              onChange={setConfigJson}
            />

            {displayCategory === "text" && (
              <>
                <div className="border-t border-gray-100 dark:border-[#1f2937] pt-3" />
                <TextWidgetConfig
                  configJson={form.configJson}
                  onChange={setConfigJson}
                />
              </>
            )}

            {displayCategory === "gauge" && (
              <>
                <div className="border-t border-gray-100 dark:border-[#1f2937] pt-3" />
                <GaugeDisplayConfig
                  configJson={form.configJson}
                  onChange={setConfigJson}
                />
              </>
            )}

            {displayCategory === "table-extra" && (
              <>
                <div className="border-t border-gray-100 dark:border-[#1f2937] pt-3" />
                <TableDisplayConfig
                  configJson={form.configJson}
                  onChange={setConfigJson}
                />
              </>
            )}

            {displayCategory === "filter" && (
              <>
                <div className="border-t border-gray-100 dark:border-[#1f2937] pt-3" />
                <FilterDisplayConfig
                  configJson={form.configJson}
                  onChange={setConfigJson}
                  widgetType={form.widgetType}
                />
              </>
            )}
          </>
        )}

        {/* ── Data Binding tab ── */}
        {activeTab === "binding" && (
          <>
            {/* <SyntaxHint /> */}
            {bindingCategory === "kpi" && (
              <KpiBinding
                configJson={form.configJson}
                onChange={setConfigJson}
              />
            )}
            {bindingCategory === "series-chart" && (
              <SeriesChartBinding
                configJson={form.configJson}
                onChange={setConfigJson}
              />
            )}
            {bindingCategory === "scatter-chart" && (
              <ScatterChartBinding
                configJson={form.configJson}
                onChange={setConfigJson}
              />
            )}
            {bindingCategory === "pie-chart" && (
              <PieChartBinding
                configJson={form.configJson}
                onChange={setConfigJson}
              />
            )}
            {bindingCategory === "table" && (
              <TableBinding
                configJson={form.configJson}
                onChange={setConfigJson}
              />
            )}
            {bindingCategory === "form-section" && (
              <FormSectionEditor
                configJson={form.configJson}
                onChange={setConfigJson}
              />
            )}
          </>
        )}

        {/* ── Nâng cao tab ── */}
        {activeTab === "advanced" && (
          <>
            {/* Type + key info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#1f2937] border border-gray-100 dark:border-[#1f2937]">
                <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">
                  TYPE
                </span>
                <code className="text-[10px] text-emerald-600 dark:text-emerald-400 flex-1 truncate">
                  {typeLabel}
                </code>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[#1f2937] border border-gray-100 dark:border-[#1f2937]">
                <span className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider shrink-0">
                  KEY
                </span>
                <code className="text-[10px] text-gray-500 dark:text-[#8b949e] flex-1 truncate">
                  {widget.widgetKey}
                </code>
              </div>
            </div>

            {/* Grid coords */}
            <div className="grid grid-cols-4 gap-1">
              {(["X", "Y", "W", "H"] as const).map((lbl, i) => (
                <div
                  key={lbl}
                  className="text-center bg-gray-50 dark:bg-[#1f2937] border border-gray-100 dark:border-[#1f2937] rounded-lg p-1.5"
                >
                  <div className="text-[9px] font-semibold text-gray-400 dark:text-[#484f58] uppercase">
                    {lbl}
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {[form.gridX, form.gridY, form.gridW, form.gridH][i]}
                  </div>
                </div>
              ))}
            </div>

            {/* Canvas label */}
            <Field label="Nhãn canvas (designer)">
              <Input
                size="small"
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                placeholder="Tên trong canvas"
              />
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
                Chỉ hiện trong admin designer, không render ra widget
              </p>
            </Field>

            {/* Reference ID (FormSection only) */}
            {bindingCategory === "form-section" && (
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

            {/* Collapsible raw JSON */}
            <div className="rounded-lg border border-gray-200 dark:border-[#1f2937] overflow-hidden">
              <button
                onClick={() => setJsonOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#1f2937] hover:bg-gray-100 dark:hover:bg-[#30363d] transition-colors"
              >
                <span className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider">
                  Config JSON{!jsonValid && " ⚠ lỗi cú pháp"}
                </span>
                {jsonOpen ? (
                  <ChevronDown size={12} className="text-gray-400" />
                ) : (
                  <ChevronRight size={12} className="text-gray-400" />
                )}
              </button>
              {jsonOpen && (
                <div className="p-2 border-t border-gray-200 dark:border-[#1f2937]">
                  {!jsonValid && (
                    <p className="text-[10px] text-orange-500 dark:text-orange-400 mb-1.5 m-0">
                      JSON không hợp lệ — widget có thể không render đúng
                    </p>
                  )}
                  <Input.TextArea
                    value={form.configJson}
                    onChange={(e) => set("configJson", e.target.value)}
                    rows={10}
                    spellCheck={false}
                    placeholder="{}"
                    style={{ fontFamily: "monospace", fontSize: 10 }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
