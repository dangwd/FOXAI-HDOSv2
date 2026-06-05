"use client";

import { adminApi, type DataSource } from "@/infrastructure/http/adminApi";
import { Button, Input, Tag } from "antd";
import { Database, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Field } from "./shared";

function splitSlug(slug: string): [string, string] {
  const idx = slug.indexOf("/");
  return idx === -1 ? [slug, ""] : [slug.slice(0, idx), slug.slice(idx + 1)];
}

const EMPTY: DataSource = {
  namespace: "",
  serviceId: "",
  resourcePath: "",
  requiredParams: [],
};

// ─── SourceRow — tất cả state giữ local, chỉ flush lên parent khi blur ────────

function SourceRow({
  source,
  onChange,
  onDelete,
}: {
  source: DataSource;
  onChange: (s: DataSource) => void;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState<DataSource>(source);
  const [paramsStr, setParamsStr] = useState(source.requiredParams.join(", "));

  function flush(updated: DataSource) {
    onChange(updated);
  }

  function commitParams() {
    const params = paramsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = { ...local, requiredParams: params };
    setLocal(updated);
    flush(updated);
  }

  return (
    <div className="rounded-lg border border-gray-100 dark:border-[#1f2937] p-3 space-y-2 bg-gray-50 dark:bg-[#0f172a]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Database size={11} className="text-emerald-600" />
          <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            {local.namespace || "namespace"}
          </code>
        </div>
        <button
          title="Xoá data source"
          onClick={onDelete}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <Field label="Namespace">
        <Input
          size="small"
          value={local.namespace}
          placeholder="record"
          onChange={(e) =>
            setLocal((p) => ({ ...p, namespace: e.target.value }))
          }
          onBlur={() => flush(local)}
        />
      </Field>

      <Field label="Service ID">
        <Input
          size="small"
          value={local.serviceId}
          placeholder="datamatch"
          onChange={(e) =>
            setLocal((p) => ({ ...p, serviceId: e.target.value }))
          }
          onBlur={() => flush(local)}
        />
      </Field>

      <Field label="Resource Path">
        <Input
          size="small"
          value={local.resourcePath}
          placeholder="/dm/records/{recordId}"
          onChange={(e) =>
            setLocal((p) => ({ ...p, resourcePath: e.target.value }))
          }
          onBlur={() => flush(local)}
        />
      </Field>

      <Field label="Required Params (cách nhau bằng dấu phẩy)">
        <Input
          size="small"
          value={paramsStr}
          placeholder="recordId, visitId"
          onChange={(e) => setParamsStr(e.target.value)}
          onBlur={commitParams}
        />
        {local.requiredParams.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {local.requiredParams.map((p) => (
              <Tag key={p} color="green" className="text-[10px] m-0">
                {`{${p}}`}
              </Tag>
            ))}
          </div>
        )}
      </Field>

      <Field label="Schema Path">
        <Input
          size="small"
          value={local.schemaPath ?? ""}
          placeholder="/dm/sources/his-01/benh-nhan/schema"
          onChange={(e) =>
            setLocal((p) => ({ ...p, schemaPath: e.target.value || null }))
          }
          onBlur={() => flush(local)}
          className="font-mono"
        />
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] mt-0.5 m-0">
          Endpoint trả schema fields — Field Browser dùng để hiện dropdown thay vì probe raw
        </p>
      </Field>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function DataSourcesPanel({ selectedSlug }: { selectedSlug: string }) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSlug) return;
    const [mc, sc] = splitSlug(selectedSlug);
    adminApi
      .getScreenLayout(mc, sc)
      .then((layout) => setSources(layout.dataSources ?? []))
      .catch(() => setSources([]));
  }, [selectedSlug]);

  function update(idx: number, s: DataSource) {
    setSources((prev) => prev.map((x, i) => (i === idx ? s : x)));
    setSaved(false);
  }

  function remove(idx: number) {
    setSources((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function add() {
    setSources((prev) => [...prev, { ...EMPTY }]);
    setSaved(false);
  }

  async function save() {
    const [mc, sc] = splitSlug(selectedSlug);
    setSaving(true);
    setErr(null);
    try {
      await adminApi.saveDataSources(mc, sc, sources);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr((e as Error).message ?? "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-[#1f2937] shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-[#e6edf3] m-0">
            Data Sources
          </p>
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
            Khai báo nguồn dữ liệu cho expression binding
          </p>
        </div>
        <button
          title="Thêm data source"
          onClick={add}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Database size={28} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-xs text-gray-400 dark:text-[#484f58] m-0">
              Chưa có data source nào
            </p>
            <button
              onClick={add}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Thêm mới
            </button>
          </div>
        ) : (
          sources.map((s, i) => (
            <SourceRow
              key={i}
              source={s}
              onChange={(updated) => update(i, updated)}
              onDelete={() => remove(i)}
            />
          ))
        )}

        {sources.length > 0 && (
          <div className="pt-1 space-y-1.5">
            {err && <p className="text-[11px] text-red-500 m-0">{err}</p>}
            <Button
              type="primary"
              size="small"
              icon={<Save size={12} />}
              loading={saving}
              onClick={save}
              block
              style={
                saved
                  ? { background: "#22c55e", borderColor: "#22c55e" }
                  : undefined
              }
            >
              {saved ? "Đã lưu!" : "Lưu Data Sources"}
            </Button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2.5 border-t border-gray-100 dark:border-[#1f2937] shrink-0 bg-gray-50 dark:bg-[#010409]">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider m-0 mb-1">
          Cú pháp expression
        </p>
        <code className="text-[10px] text-emerald-600 dark:text-emerald-400">
          {"{{sources.<namespace>.<field>}}"}
        </code>
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
          Ví dụ: {"{{sources.record.TenBenhNhan}}"}
        </p>
      </div>
    </div>
  );
}
