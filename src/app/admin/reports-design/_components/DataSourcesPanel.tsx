"use client";

import { adminApi, type DataSource, type FormsProviderDto, type FormsOperationDto } from "@/infrastructure/http/adminApi";
import { Button, Input, Select, Segmented, Tag, Tooltip } from "antd";
import { Database, GitBranch, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field } from "./shared";
import { SourceProfileCatalog } from "./SourceProfileCatalog";

function splitSlug(slug: string): [string, string] {
  const idx = slug.indexOf("/");
  return idx === -1 ? [slug, ""] : [slug.slice(0, idx), slug.slice(idx + 1)];
}

const EMPTY: DataSource = {
  namespace:      "",
  operationId:    null,
  serviceId:      null,
  resourcePath:   null,
  requiredParams: [],
};

// ─── SourceRow ────────────────────────────────────────────────────────────────

function SourceRow({
  source,
  providers,
  allOperations,
  onChange,
  onDelete,
}: {
  source:        DataSource;
  providers:     FormsProviderDto[];
  allOperations: FormsOperationDto[];
  onChange:      (s: DataSource) => void;
  onDelete:      () => void;
}) {
  const [local,     setLocal]     = useState<DataSource>(source);
  const [paramsStr, setParamsStr] = useState((source.requiredParams ?? []).join(", "));
  const [managed,   setManaged]   = useState<boolean>(!!source.operationId);

  function flush(updated: DataSource) { onChange(updated); }

  function commitParams() {
    const params = paramsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const updated = { ...local, requiredParams: params };
    setLocal(updated);
    flush(updated);
  }

  const selProviderCode = useMemo(() => {
    if (!local.operationId) return null;
    return local.operationId.split("::")[0] ?? null;
  }, [local.operationId]);

  const providerOps = useMemo(
    () => allOperations.filter((o) => o.providerCode === selProviderCode),
    [allOperations, selProviderCode],
  );

  function handleProviderChange(code: string | undefined) {
    const updated = { ...local, operationId: null, requiredParams: [] };
    setLocal(updated);
    flush(updated);
    void code; // provider code captured via selProviderCode derivation
  }

  function handleOperationChange(combinedRef: string | undefined) {
    if (!combinedRef) {
      const updated = { ...local, operationId: null, requiredParams: [] };
      setLocal(updated);
      flush(updated);
      return;
    }
    const op = allOperations.find((o) => o.combinedRef === combinedRef);
    const updated: DataSource = {
      ...local,
      operationId:    combinedRef,
      serviceId:      null,
      resourcePath:   null,
      requiredParams: op?.requiredParams ?? [],
      schemaPath:     op?.schemaPath ?? null,
    };
    setLocal(updated);
    flush(updated);
  }

  function toggleMode() {
    const next = !managed;
    setManaged(next);
    if (next) {
      const updated = { ...local, serviceId: null, resourcePath: null };
      setLocal(updated);
    } else {
      const updated = { ...local, operationId: null };
      setLocal(updated);
    }
  }

  return (
    <div className="rounded-lg border border-gray-100 dark:border-[#1f2937] p-3 space-y-2 bg-gray-50 dark:bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Database size={11} className="text-emerald-600" />
          <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            {local.namespace || "namespace"}
          </code>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip title={managed ? "Chuyển về nhập tay" : "Dùng Provider Catalog"}>
            <Button
              size="small"
              type="text"
              icon={<GitBranch size={10} />}
              onClick={toggleMode}
              style={{ fontSize: 10, height: 20, padding: "0 6px" }}
              className={managed
                ? "text-blue-600! dark:text-blue-400! bg-blue-50! dark:bg-blue-950/30!"
                : "text-gray-400! dark:text-[#484f58]!"}
            >
              {managed ? "Catalog" : "Manual"}
            </Button>
          </Tooltip>
          <Tooltip title="Xoá data source">
            <Button
              size="small"
              type="text"
              danger
              icon={<Trash2 size={11} />}
              onClick={onDelete}
              style={{ width: 20, height: 20, padding: 0 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Namespace — always shown */}
      <Field label="Namespace">
        <Input
          size="small"
          value={local.namespace}
          placeholder="benhnhan"
          onChange={(e) => setLocal((p) => ({ ...p, namespace: e.target.value }))}
          onBlur={() => flush(local)}
        />
      </Field>

      {managed ? (
        /* ── Managed mode: Provider Catalog dropdowns ── */
        <>
          <Field label="Provider">
            <Select
              size="small"
              style={{ width: "100%" }}
              placeholder="Chọn provider..."
              value={selProviderCode ?? undefined}
              onChange={handleProviderChange}
              allowClear
              showSearch
              options={providers
                .filter((p) => p.status === "Active")
                .map((p) => ({ value: p.code, label: p.displayName }))}
            />
          </Field>
          <Field label="Operation">
            <Select
              size="small"
              style={{ width: "100%" }}
              placeholder="Chọn operation..."
              value={local.operationId ?? undefined}
              onChange={handleOperationChange}
              allowClear
              showSearch
              disabled={!selProviderCode}
              options={providerOps
                .filter((o) => o.status === "Active")
                .map((o) => ({
                  value: o.combinedRef,
                  label: o.displayName,
                  title: o.pattern,
                }))}
            />
          </Field>
          {local.operationId && (
            <div className="text-[10px] text-gray-400 dark:text-[#484f58] font-mono bg-gray-100 dark:bg-[#1f2937] px-2 py-1 rounded">
              {allOperations.find((o) => o.combinedRef === local.operationId)?.pattern ?? local.operationId}
            </div>
          )}
        </>
      ) : (
        /* ── Legacy mode: manual text inputs ── */
        <>
          <Field label="Service ID">
            <Input
              size="small"
              value={local.serviceId ?? ""}
              placeholder="datamatch"
              onChange={(e) => setLocal((p) => ({ ...p, serviceId: e.target.value || null }))}
              onBlur={() => flush(local)}
            />
          </Field>
          <Field label="Resource Path">
            <Input
              size="small"
              value={local.resourcePath ?? ""}
              placeholder="/dm/records/{recordId}"
              onChange={(e) => setLocal((p) => ({ ...p, resourcePath: e.target.value || null }))}
              onBlur={() => flush(local)}
            />
          </Field>
          <Field label="Schema Path">
            <Input
              size="small"
              value={local.schemaPath ?? ""}
              placeholder="/dm/sources/his-01/benh-nhan/schema"
              onChange={(e) => setLocal((p) => ({ ...p, schemaPath: e.target.value || null }))}
              onBlur={() => flush(local)}
              className="font-mono"
            />
          </Field>
        </>
      )}

      {/* Required Params */}
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
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

type InnerTab = "library" | "declared";

export function DataSourcesPanel({ selectedSlug }: { selectedSlug: string }) {
  const [sources,       setSources]       = useState<DataSource[]>([]);
  const [providers,     setProviders]     = useState<FormsProviderDto[]>([]);
  const [allOperations, setAllOperations] = useState<FormsOperationDto[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [err,           setErr]           = useState<string | null>(null);
  const [innerTab,      setInnerTab]      = useState<InnerTab>("library");
  const [isDragOver,    setIsDragOver]    = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;
    const [mc, sc] = splitSlug(selectedSlug);
    adminApi
      .getScreenLayout(mc, sc)
      .then((layout) => setSources(layout.dataSources ?? []))
      .catch(() => setSources([]));
  }, [selectedSlug]);

  useEffect(() => {
    adminApi.listFormsProviders().then(setProviders).catch(() => {});
    adminApi.listFormsOperations().then(setAllOperations).catch(() => {});
  }, []);

  const addedNamespaces = useMemo(
    () => new Set(sources.map((s) => s.namespace)),
    [sources],
  );

  function addSource(ds: DataSource) {
    setSources((prev) => [...prev, ds]);
    setSaved(false);
    setInnerTab("declared");
  }

  function update(idx: number, s: DataSource) {
    setSources((prev) => prev.map((x, i) => (i === idx ? s : x)));
    setSaved(false);
  }

  function remove(idx: number) {
    setSources((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function addEmpty() {
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

  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes("application/datasource+json")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData("application/datasource+json");
    if (!raw) return;
    try {
      const ds = JSON.parse(raw) as DataSource;
      addSource(ds);
    } catch {
      // ignore malformed
    }
  }

  const segmentedOptions = [
    { value: "library",  label: "Thư viện" },
    { value: "declared", label: sources.length > 0 ? `Khai báo (${sources.length})` : "Khai báo" },
  ];

  return (
    <div
      className={`flex flex-col h-full transition-colors
        ${isDragOver ? "bg-emerald-50/40 dark:bg-emerald-950/10" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
        {innerTab === "declared" && (
          <Tooltip title="Thêm data source thủ công">
            <Button
              size="small"
              type="text"
              icon={<Plus size={13} />}
              onClick={addEmpty}
              className="text-emerald-600! dark:text-emerald-400!"
              style={{ width: 24, height: 24, padding: 0 }}
            />
          </Tooltip>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-[#1f2937] shrink-0 bg-gray-50 dark:bg-[#010409]">
        <Segmented
          size="small"
          block
          value={innerTab}
          onChange={(v) => setInnerTab(v as InnerTab)}
          options={segmentedOptions}
        />
      </div>

      {/* ── Library tab ── */}
      {innerTab === "library" && (
        <div className="flex flex-col flex-1 min-h-0">
          <SourceProfileCatalog
            addedNamespaces={addedNamespaces}
            onAdd={addSource}
            onDragStart={() => {}}
            onDragEnd={() => {}}
          />

          {isDragOver && (
            <div className="mx-3 mb-3 mt-1 rounded-xl border-2 border-dashed border-emerald-400
              flex items-center justify-center py-3 bg-emerald-50/60 dark:bg-emerald-950/20">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 m-0 font-medium">
                Thả để thêm vào Khai báo
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Declared tab ── */}
      {innerTab === "declared" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Database size={28} className="text-gray-300 dark:text-[#30363d]" />
              <p className="text-xs text-gray-400 dark:text-[#484f58] m-0">
                Chưa có data source nào
              </p>
              <div className="flex flex-col gap-1 items-center">
                <Button type="link" size="small" onClick={addEmpty} style={{ padding: 0, height: "auto", fontSize: 12 }}>
                  + Thêm thủ công
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setInnerTab("library")}
                  style={{ padding: 0, height: "auto", fontSize: 12, color: "#8b949e" }}
                >
                  hoặc chọn từ Thư viện →
                </Button>
              </div>
            </div>
          ) : (
            sources.map((s, i) => (
              <SourceRow
                key={i}
                source={s}
                providers={providers}
                allOperations={allOperations}
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
                style={saved ? { background: "#22c55e", borderColor: "#22c55e" } : undefined}
              >
                {saved ? "Đã lưu!" : "Lưu Data Sources"}
              </Button>
            </div>
          )}
        </div>
      )}

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
