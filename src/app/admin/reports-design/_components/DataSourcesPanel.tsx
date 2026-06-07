"use client";

import {
  adminApi,
  type DataSource,
  type FormsOperationDto,
  type FormsProviderDto,
} from "@/infrastructure/http/adminApi";
import {
  Button,
  Input,
  Modal,
  Segmented,
  Select,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  Database,
  GitBranch,
  Layers,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field } from "./shared";
import { SourceProfileCatalog } from "./SourceProfileCatalog";

const { Text } = Typography;

// ─── Utilities ────────────────────────────────────────────────────────────────

function splitSlug(slug: string): [string, string] {
  const idx = slug.indexOf("/");
  return idx === -1 ? [slug, ""] : [slug.slice(0, idx), slug.slice(idx + 1)];
}

const EMPTY: DataSource = {
  namespace: "",
  operationId: null,
  serviceId: null,
  resourcePath: null,
  requiredParams: [],
};

type KeyedSource = DataSource & { _rowKey: string };

let _keyCounter = 0;
function makeKey() { return `ds-${++_keyCounter}`; }
function withKey(ds: DataSource): KeyedSource { return { ...ds, _rowKey: makeKey() }; }

// ─── SectionLabel ────────────────────────────────────────────────────────────
// Phải định nghĩa ở module level — không được tạo component bên trong render.

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-[#484f58] whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-[#1f2937]" />
    </div>
  );
}

// ─── SourceEditModal ──────────────────────────────────────────────────────────
// Form chỉnh sửa / tạo mới một DataSource. Mở từ SourceCard hoặc nút "Thêm thủ công".

function SourceEditModal({
  open,
  source,
  providers,
  allOperations,
  onSave,
  onClose,
}: {
  open:          boolean;
  source:        DataSource | null;
  providers:     FormsProviderDto[];
  allOperations: FormsOperationDto[];
  onSave:        (s: DataSource) => void;
  onClose:       () => void;
}) {
  const [local,     setLocal]     = useState<DataSource>(source ?? { ...EMPTY });
  const [paramsStr, setParamsStr] = useState((source?.requiredParams ?? []).join(", "));
  const [managed,   setManaged]   = useState<boolean>(!!source?.operationId);

  useEffect(() => {
    if (!open) return;
    const s = source ?? { ...EMPTY };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(s);
    setParamsStr((s.requiredParams ?? []).join(", "));
    setManaged(!!s.operationId);
  }, [open, source]);

  const selProviderCode = useMemo(() => {
    if (!local.operationId) return null;
    return local.operationId.split("::")[0] ?? null;
  }, [local.operationId]);

  const providerOps = useMemo(
    () => allOperations.filter((o) => o.providerCode === selProviderCode),
    [allOperations, selProviderCode],
  );

  const providerOptions = useMemo(
    () =>
      providers
        .filter((p) => p.status === "Active")
        .map((p) => ({ value: p.code, label: p.displayName })),
    [providers],
  );

  function handleProviderChange(code: string | undefined) {
    void code;
    setLocal((p) => ({ ...p, operationId: null, requiredParams: [] }));
    setParamsStr("");
  }

  function handleOperationChange(combinedRef: string | undefined) {
    if (!combinedRef) {
      setLocal((p) => ({ ...p, operationId: null, requiredParams: [] }));
      setParamsStr("");
      return;
    }
    const op = allOperations.find((o) => o.combinedRef === combinedRef);
    const params = op?.requiredParams ?? [];
    setLocal((p) => ({
      ...p,
      operationId:    combinedRef,
      serviceId:      null,
      resourcePath:   null,
      requiredParams: params,
      schemaPath:     op?.schemaPath ?? null,
    }));
    setParamsStr(params.join(", "));
  }

  function toggleMode() {
    const next = !managed;
    setManaged(next);
    if (next) {
      setLocal((p) => ({ ...p, serviceId: null, resourcePath: null }));
    } else {
      setLocal((p) => ({ ...p, operationId: null }));
    }
  }

  function commitParams() {
    const params = paramsStr.split(",").map((s) => s.trim()).filter(Boolean);
    setLocal((p) => ({ ...p, requiredParams: params }));
  }

  function handleSave() {
    const params = paramsStr.split(",").map((s) => s.trim()).filter(Boolean);
    onSave({ ...local, requiredParams: params });
    onClose();
  }

  const selectedOp = allOperations.find((o) => o.combinedRef === local.operationId);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <Database size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold">
            {source ? "Chỉnh sửa Data Source" : "Thêm Data Source"}
          </span>
        </div>
      }
      width={560}
      footer={
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" icon={<Save size={13} />} onClick={handleSave}>
            {source ? "Lưu thay đổi" : "Thêm Data Source"}
          </Button>
        </div>
      }
      destroyOnHidden={false}
    >
      <div className="py-1 space-y-0">
        <SectionLabel>Định danh</SectionLabel>
        <Field label="Namespace">
          <Input
            value={local.namespace}
            placeholder="benhnhan"
            onChange={(e) => setLocal((p) => ({ ...p, namespace: e.target.value }))}
            className="font-mono"
          />
        </Field>
        <p className="text-[11px] text-gray-400 dark:text-[#484f58] mt-1 mb-0">
          Dùng trong expression:{" "}
          <code className="text-emerald-600 dark:text-emerald-400">
            {`{{sources.${local.namespace || "namespace"}.fieldName}}`}
          </code>
        </p>

        <SectionLabel>Chế độ nguồn dữ liệu</SectionLabel>
        <Segmented
          block
          value={managed ? "catalog" : "manual"}
          onChange={(v) => { if (v !== (managed ? "catalog" : "manual")) toggleMode(); }}
          options={[
            {
              value: "catalog",
              label: (
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  <GitBranch size={12} />
                  <span>Provider Catalog</span>
                </div>
              ),
            },
            {
              value: "manual",
              label: (
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  <Database size={12} />
                  <span>Nhập tay</span>
                </div>
              ),
            },
          ]}
          className="mb-4"
        />

        {managed ? (
          <div className="space-y-3">
            <Field label="Provider">
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn provider..."
                value={selProviderCode ?? undefined}
                onChange={(v: string | null) => handleProviderChange(v ?? undefined)}
                allowClear
                showSearch
                options={providerOptions}
              />
            </Field>
            <Field label="Operation">
              <Select
                style={{ width: "100%" }}
                placeholder={selProviderCode ? "Chọn operation..." : "Chọn provider trước"}
                value={local.operationId ?? undefined}
                onChange={(v: string | null) => handleOperationChange(v ?? undefined)}
                disabled={!selProviderCode}
                allowClear
                showSearch
                options={providerOps
                  .filter((o) => o.status === "Active")
                  .map((o) => ({ value: o.combinedRef, label: o.displayName, title: o.pattern }))}
              />
            </Field>
            {selectedOp && (
              <div className="rounded-lg border border-gray-100 dark:border-[#1f2937] bg-gray-50 dark:bg-[#0a0f1a] px-3 py-2">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider mb-1">
                  Pattern
                </p>
                <code className="text-[12px] text-emerald-600 dark:text-emerald-400 break-all">
                  {selectedOp.pattern}
                </code>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Service ID">
              <Input
                value={local.serviceId ?? ""}
                placeholder="datamatch"
                onChange={(e) => setLocal((p) => ({ ...p, serviceId: e.target.value || null }))}
              />
            </Field>
            <Field label="Resource Path">
              <Input
                value={local.resourcePath ?? ""}
                placeholder="/dm/records/{recordId}"
                onChange={(e) => setLocal((p) => ({ ...p, resourcePath: e.target.value || null }))}
                className="font-mono"
              />
            </Field>
            <Field label="Schema Path">
              <Input
                value={local.schemaPath ?? ""}
                placeholder="/dm/sources/his-01/benh-nhan/schema"
                onChange={(e) => setLocal((p) => ({ ...p, schemaPath: e.target.value || null }))}
                className="font-mono"
              />
            </Field>
          </div>
        )}

        <SectionLabel>Required Params</SectionLabel>
        <Field label="Các param URL (cách nhau bằng dấu phẩy)">
          <Input
            value={paramsStr}
            placeholder="recordId, visitId"
            onChange={(e) => setParamsStr(e.target.value)}
            onBlur={commitParams}
          />
        </Field>
        {paramsStr.trim() && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {paramsStr.split(",").map((p) => p.trim()).filter(Boolean).map((p) => (
              <Tag key={p} color="green" className="text-[11px] m-0">
                {`{${p}}`}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── SourceCard ───────────────────────────────────────────────────────────────
// Card compact hiển thị trong cột phải của DataSourcesConfigModal.

function SourceCard({
  source,
  allOperations,
  onEdit,
  onDelete,
}: {
  source:        DataSource;
  allOperations: FormsOperationDto[];
  onEdit:        () => void;
  onDelete:      () => void;
}) {
  const isManaged = !!source.operationId;

  const subtitle = useMemo(() => {
    if (isManaged) {
      const op = allOperations.find((o) => o.combinedRef === source.operationId);
      return op?.pattern ?? source.operationId ?? "";
    }
    return source.resourcePath ?? source.serviceId ?? "";
  }, [isManaged, source, allOperations]);

  return (
    <div className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl
      border border-gray-100 dark:border-[#1f2937]
      bg-white dark:bg-[#0d1117]
      hover:border-emerald-200 dark:hover:border-emerald-900
      transition-colors">

      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center
        bg-emerald-50 dark:bg-emerald-950/30">
        <Database size={13} className="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <code className="text-[12px] font-mono font-semibold text-gray-800 dark:text-[#e6edf3] truncate">
            {source.namespace || <Text type="secondary" italic>namespace</Text>}
          </code>
          <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-px rounded-full
            ${isManaged
              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
              : "bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d]"
            }`}>
            {isManaged ? "Catalog" : "Manual"}
          </span>
        </div>

        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-[#484f58] font-mono truncate mt-0.5 m-0">
            {subtitle}
          </p>
        )}

        {source.requiredParams.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {source.requiredParams.map((p) => (
              <span key={p}
                className="text-[9px] font-mono px-1.5 py-px rounded
                  bg-emerald-50 dark:bg-emerald-950/30
                  text-emerald-700 dark:text-emerald-400
                  border border-emerald-100 dark:border-emerald-900">
                {`{${p}}`}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1
        opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <Tooltip title="Chỉnh sửa">
          <button
            type="button"
            onClick={onEdit}
            className="w-6 h-6 flex items-center justify-center rounded-md
              text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400
              hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
          >
            <Pencil size={12} />
          </button>
        </Tooltip>
        <Tooltip title="Xóa">
          <button
            type="button"
            onClick={onDelete}
            className="w-6 h-6 flex items-center justify-center rounded-md
              text-gray-400 hover:text-red-500
              hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── DataSourcesConfigModal ──────────────────────────────────────────────────
// Modal 2 cột (900px): trái = thư viện catalog, phải = drop zone + danh sách khai báo.
// "Lưu" sẽ save thẳng về backend rồi gọi onSaved để panel cập nhật chip list.

function DataSourcesConfigModal({
  open,
  initialSources,
  selectedSlug,
  providers,
  allOperations,
  onSaved,
  onClose,
}: {
  open:           boolean;
  initialSources: KeyedSource[];
  selectedSlug:   string;
  providers:      FormsProviderDto[];
  allOperations:  FormsOperationDto[];
  onSaved:        (sources: DataSource[]) => void;
  onClose:        () => void;
}) {
  const { token } = theme.useToken();
  const [sources,    setSources]    = useState<KeyedSource[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | -1 | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [modalErr,   setModalErr]   = useState<string | null>(null);

  // Sync draft từ panel khi modal mở
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSources(initialSources);
    setEditingIdx(null);
    setModalErr(null);
  }, [open, initialSources]);

  const addedNamespaces = useMemo(
    () => new Set(sources.map((s) => s.namespace)),
    [sources],
  );

  function addSource(ds: DataSource) {
    if (addedNamespaces.has(ds.namespace)) return;
    setSources((prev) => [...prev, withKey(ds)]);
  }

  function saveFromEditModal(updated: DataSource) {
    if (editingIdx === -1) {
      setSources((prev) => [...prev, withKey(updated)]);
    } else if (editingIdx != null && editingIdx >= 0) {
      setSources((prev) =>
        prev.map((x, i) => i === editingIdx ? { ...updated, _rowKey: x._rowKey } : x),
      );
    }
  }

  function remove(idx: number) {
    setSources((prev) => prev.filter((_, i) => i !== idx));
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
      // ignore malformed drop payload
    }
  }

  async function handleSave() {
    const [mc, sc] = splitSlug(selectedSlug);
    setSaving(true);
    setModalErr(null);
    try {
      const payload = sources.map(({ _rowKey, ...ds }) => { void _rowKey; return ds; });
      await adminApi.saveDataSources(mc, sc, payload);
      onSaved(payload);
      onClose();
    } catch (e) {
      setModalErr((e as Error).message ?? "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  const isEditOpen  = editingIdx !== null;
  const editSource  = editingIdx != null && editingIdx >= 0 ? sources[editingIdx] : null;

  const footer = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Button icon={<Plus size={13} />} onClick={() => setEditingIdx(-1)}>
          Thêm thủ công
        </Button>
        {modalErr && (
          <Text type="danger" style={{ fontSize: 12 }}>{modalErr}</Text>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button
          type="primary"
          icon={<Save size={13} />}
          loading={saving}
          onClick={handleSave}
        >
          {sources.length > 0 ? `Lưu (${sources.length} nguồn)` : "Lưu"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Edit/create modal — z-index handled by antd automatically */}
      <SourceEditModal
        open={isEditOpen}
        source={editSource ?? null}
        providers={providers}
        allOperations={allOperations}
        onSave={saveFromEditModal}
        onClose={() => setEditingIdx(null)}
      />

      <Modal
        open={open}
        onCancel={onClose}
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Layers size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-semibold">Cấu hình Data Sources</span>
          </div>
        }
        width={900}
        styles={{ body: { padding: 0, overflow: "hidden" } }}
        footer={footer}
        destroyOnHidden
      >
        <div style={{ display: "flex", height: 520 }}>

          {/* ── Cột trái: Thư viện catalog (300px cố định) ── */}
          <div style={{
            width:           300,
            borderRight:     `1px solid ${token.colorBorderSecondary}`,
            display:         "flex",
            flexDirection:   "column",
            overflow:        "hidden",
            flexShrink:      0,
          }}>
            <div style={{
              padding:      "10px 14px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background:   token.colorFillAlter,
              flexShrink:   0,
            }}>
              <Text strong style={{ fontSize: 12 }}>Thư viện nguồn dữ liệu</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 10 }}>
                Click + hoặc kéo sang phải để thêm
              </Text>
            </div>
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <SourceProfileCatalog
                addedNamespaces={addedNamespaces}
                onAdd={addSource}
                onDragStart={() => {}}
                onDragEnd={() => {}}
              />
            </div>
          </div>

          {/* ── Cột phải: Drop zone + danh sách khai báo ── */}
          <div
            style={{
              flex:          1,
              display:       "flex",
              flexDirection: "column",
              overflow:      "hidden",
              background:    isDragOver ? "rgba(5,150,105,0.04)" : token.colorBgContainer,
              transition:    "background 0.15s",
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header cột phải */}
            <div style={{
              padding:      "10px 16px",
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              background:   token.colorFillAlter,
              flexShrink:   0,
              display:      "flex",
              alignItems:   "center",
              gap:          6,
            }}>
              <Text strong style={{ fontSize: 12 }}>Đã khai báo</Text>
              {sources.length > 0 && (
                <span style={{
                  fontSize:   10,
                  fontWeight: 700,
                  background: "rgba(5,150,105,0.12)",
                  color:      "#059669",
                  border:     "1px solid rgba(5,150,105,0.25)",
                  borderRadius: 10,
                  padding:    "1px 7px",
                }}>
                  {sources.length}
                </span>
              )}
            </div>

            {/* Nội dung: drop indicator + cards hoặc empty state */}
            <div style={{
              flex:          1,
              overflow:      "auto",
              padding:       "12px 16px",
              display:       "flex",
              flexDirection: "column",
              gap:           8,
            }}>

              {/* Banner kéo thả — chỉ hiện khi đang kéo */}
              {isDragOver && (
                <div style={{
                  padding:      "14px 16px",
                  borderRadius: token.borderRadiusLG,
                  border:       "2px dashed #059669",
                  background:   "rgba(5,150,105,0.06)",
                  textAlign:    "center",
                  flexShrink:   0,
                }}>
                  <Text style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>
                    Thả để thêm vào danh sách khai báo
                  </Text>
                </div>
              )}

              {/* Empty state */}
              {sources.length === 0 && !isDragOver && (
                <div style={{
                  flex:           1,
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            12,
                  border:         `2px dashed ${token.colorBorderSecondary}`,
                  borderRadius:   token.borderRadiusLG,
                  padding:        "32px 24px",
                  textAlign:      "center",
                  minHeight:      200,
                }}>
                  <Layers size={36} style={{ color: token.colorTextQuaternary }} />
                  <div>
                    <Text style={{ fontSize: 13, display: "block" }} type="secondary">
                      Chưa có nguồn dữ liệu nào
                    </Text>
                    <Text style={{ fontSize: 11, display: "block", marginTop: 4 }} type="secondary">
                      Kéo thả từ thư viện hoặc thêm thủ công
                    </Text>
                  </div>
                </div>
              )}

              {/* Danh sách SourceCard */}
              {sources.map(({ _rowKey, ...ds }, i) => (
                <SourceCard
                  key={_rowKey}
                  source={ds}
                  allOperations={allOperations}
                  onEdit={() => setEditingIdx(i)}
                  onDelete={() => remove(i)}
                />
              ))}
            </div>
          </div>

        </div>
      </Modal>
    </>
  );
}

// ─── DataSourcesPanel ─────────────────────────────────────────────────────────
// Sidebar thu gọn: hiển thị chip tên nguồn + nút "Cấu hình" mở DataSourcesConfigModal.
// Save về backend xảy ra bên trong modal — panel chỉ phản ánh trạng thái đã lưu.

export function DataSourcesPanel({ selectedSlug }: { selectedSlug: string }) {
  const [sources,       setSources]       = useState<KeyedSource[]>([]);
  const [providers,     setProviders]     = useState<FormsProviderDto[]>([]);
  const [allOperations, setAllOperations] = useState<FormsOperationDto[]>([]);
  const [configOpen,    setConfigOpen]    = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;
    const [mc, sc] = splitSlug(selectedSlug);
    adminApi
      .getScreenLayout(mc, sc)
      .then((layout) => setSources((layout.dataSources ?? []).map(withKey)))
      .catch(() => setSources([]));
  }, [selectedSlug]);

  useEffect(() => {
    adminApi.listFormsProviders().then(setProviders).catch(() => {});
    adminApi.listFormsOperations().then(setAllOperations).catch(() => {});
  }, []);

  function handleSaved(newSources: DataSource[]) {
    setSources(newSources.map(withKey));
  }

  return (
    <>
      <DataSourcesConfigModal
        open={configOpen}
        initialSources={sources}
        selectedSlug={selectedSlug}
        providers={providers}
        allOperations={allOperations}
        onSaved={handleSaved}
        onClose={() => setConfigOpen(false)}
      />

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
          <Button
            size="small"
            icon={<Settings2 size={12} />}
            onClick={() => setConfigOpen(true)}
          >
            Cấu hình
          </Button>
        </div>

        {/* Danh sách chip nguồn đã khai báo */}
        <div className="flex-1 overflow-y-auto p-3">
          {sources.length === 0 ? (
            /* CTA khi chưa có nguồn */
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="w-full flex flex-col items-center justify-center gap-2 py-8
                border-2 border-dashed border-gray-100 dark:border-[#1f2937] rounded-xl
                text-gray-400 hover:border-emerald-200 dark:hover:border-emerald-900
                hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer
                bg-transparent"
            >
              <Layers size={24} />
              <span className="text-xs">Thêm nguồn dữ liệu</span>
            </button>
          ) : (
            <div className="space-y-1.5">
              {sources.map(({ _rowKey, ...ds }) => (
                <div
                  key={_rowKey}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg
                    border border-gray-100 dark:border-[#1f2937]
                    bg-white dark:bg-[#0d1117]
                    hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors"
                >
                  <Database size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <code className="text-xs font-mono text-gray-700 dark:text-[#e6edf3] flex-1 truncate">
                    {ds.namespace}
                  </code>
                  <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-px rounded-full
                    ${ds.operationId
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900"
                      : "bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e] border border-gray-200 dark:border-[#30363d]"
                    }`}>
                    {ds.operationId ? "Cat" : "Man"}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="w-full text-center text-[11px] text-gray-400 dark:text-[#484f58]
                  hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1 bg-transparent"
              >
                Nhấn Cấu hình để chỉnh sửa
              </button>
            </div>
          )}
        </div>

        {/* Footer: expression syntax hint */}
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
    </>
  );
}
