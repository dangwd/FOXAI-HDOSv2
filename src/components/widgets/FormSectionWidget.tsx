"use client";

import { useState } from "react";
import { Button, Input, Select } from "antd";
import { Lock, Send } from "lucide-react";
import type { FormField, FormSchema } from "@/infrastructure/http/adminApi";
import {
  applyDisplayFormat,
  evaluateExpression,
} from "@/core/dataBinding/evaluateExpression";
import useAuthStore from "@/core/auth/authStore";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldOption = string | { label: string; value: string };

interface ExtFormField extends FormField {
  options?: FieldOption[];
}

// ─── Read-only display — giống pattern OCR process page ──────────────────────

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <div
      className={`min-h-7.5 rounded-md border px-3 py-1.5 flex items-center gap-2
        ${value
          ? "bg-white dark:bg-[#0d1117] border-emerald-200 dark:border-emerald-800/50"
          : "bg-gray-50 dark:bg-[#161b22] border-gray-200 dark:border-[#30363d]"
        }`}
    >
      <span className="flex-1 text-xs text-gray-800 dark:text-[#e6edf3]">
        {value || (
          <span className="text-gray-300 dark:text-[#484f58] italic">—</span>
        )}
      </span>
      <Lock size={10} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
    </div>
  );
}

// ─── Editable field input ─────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ExtFormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const type = (
    field.fieldType ??
    (field as unknown as Record<string, string>)["type"] ??
    "text"
  ).toLowerCase();

  if (type === "select") {
    const opts = (field.options ?? []).map((o) =>
      typeof o === "string" ? { label: o, value: o } : o,
    );
    return (
      <Select
        size="small"
        value={value || undefined}
        placeholder="-- Chọn --"
        options={opts}
        onChange={onChange}
        className="w-full"
        allowClear
      />
    );
  }

  if (type === "textarea") {
    return (
      <Input.TextArea
        size="small"
        value={value}
        placeholder={field.placeholder ?? ""}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        style={{ resize: "none" }}
      />
    );
  }

  return (
    <Input
      size="small"
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      value={value}
      placeholder={field.placeholder ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

interface FormSectionWidgetProps {
  title?: string;
  schema: FormSchema & { fields: ExtFormField[] };
  sourceData: Record<string, unknown>;
  moduleCode?: string;
  formKey?: string;
}

export function FormSectionWidget({
  title,
  schema,
  sourceData,
  moduleCode,
  formKey,
}: FormSectionWidgetProps) {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Normalize: backend FormTemplate dùng "type", designer dùng "fieldType"
  const fields = [...(schema.fields ?? [])]
    .map((f) => {
      const raw = f as unknown as Record<string, unknown>;
      return {
        ...f,
        fieldType: f.fieldType ?? (raw["type"] as string | undefined) ?? "Text",
        order: f.order ?? 0,
      } as ExtFormField;
    })
    .sort((a, b) => a.order - b.order);

  const [values, setValues]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk]   = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  function resolveValue(field: ExtFormField): string {
    if (field.dataBinding?.expression) {
      const raw = evaluateExpression(field.dataBinding.expression, sourceData);
      return raw != null
        ? applyDisplayFormat(raw, field.dataBinding.displayFormat ?? null)
        : "";
    }
    return values[field.key] ?? "";
  }

  function setValue(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setSubmitOk(false);
  }

  async function handleSubmit() {
    if (!moduleCode || !formKey) return;
    const answers = fields
      .filter((f) => !f.isReadOnly)
      .map((f) => ({ fieldKey: f.key, value: values[f.key] ?? null }));

    setSubmitting(true);
    setSubmitErr(null);
    try {
      const res = await fetch(`${BASE}/forms/${moduleCode}/${formKey}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitOk(true);
    } catch (err) {
      setSubmitErr((err as Error).message ?? "Gửi thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  // Gộp Half-width liền kề thành cùng row
  const rows: ExtFormField[][] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.width === "Half" && fields[i + 1]?.width === "Half") {
      rows.push([f, fields[i + 1]]);
      i += 2;
    } else {
      rows.push([f]);
      i++;
    }
  }

  const hasFreeFields = fields.some((f) => !f.isReadOnly);
  const canSubmit     = Boolean(moduleCode && formKey && hasFreeFields);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0d1117] rounded-xl border border-gray-100 dark:border-[#21262d] overflow-hidden">
      {/* Header */}
      {title && (
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#21262d] shrink-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0">
            {title}
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className={`grid gap-x-5 gap-y-4 ${row.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {row.map((field) => (
              <div key={field.key}>
                <label className="flex items-center gap-1 text-[12px] font-medium text-gray-500 dark:text-[#8b949e] mb-1.5">
                  {field.label}
                  {field.required && !field.isReadOnly && (
                    <span className="text-red-400 ml-0.5">*</span>
                  )}
                  {field.isReadOnly && (
                    <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded ml-1">
                      Auto
                    </span>
                  )}
                </label>

                {field.isReadOnly ? (
                  <ReadOnlyValue value={resolveValue(field)} />
                ) : (
                  <FieldInput
                    field={field}
                    value={resolveValue(field)}
                    onChange={(v) => setValue(field.key, v)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {fields.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-[#484f58] text-center py-6">
            Chưa có trường nào được cấu hình.
          </p>
        )}
      </div>

      {/* Submit footer */}
      {canSubmit && (
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-[#21262d] space-y-3">
          {submitErr && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
              <span className="text-red-500 mt-0.5 shrink-0 text-base leading-none">✕</span>
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 m-0">Gửi thất bại</p>
                <p className="text-[11px] text-red-500 dark:text-red-400/80 m-0 mt-0.5">{submitErr}</p>
              </div>
            </div>
          )}
          {submitOk && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
              <span className="text-green-500 mt-0.5 shrink-0 text-base leading-none">✓</span>
              <div>
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 m-0">Gửi thành công</p>
                <p className="text-[11px] text-green-600 dark:text-green-400/80 m-0 mt-0.5">Dữ liệu đã được ghi nhận.</p>
              </div>
            </div>
          )}
          <Button
            type="primary"
            block
            icon={<Send size={13} />}
            loading={submitting}
            onClick={handleSubmit}
            size="middle"
          >
            {submitting ? "Đang gửi..." : "Gửi xét duyệt"}
          </Button>
        </div>
      )}
    </div>
  );
}
