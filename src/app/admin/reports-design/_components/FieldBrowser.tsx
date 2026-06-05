"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Database, FlaskConical } from "lucide-react";
import { Input } from "antd";
import { adminApi, type DataSource } from "@/infrastructure/http/adminApi";
import useAuthStore from "@/core/auth/authStore";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "string" | "number" | "date" | "boolean" | "array" | "object" | "null";

interface FieldMeta {
  path: string;
  expr: string;
  type: FieldType;
  /** label từ schema hoặc sample value từ probe */
  hint: string;
}

// Schema contract từ docs section 3
interface SchemaField {
  key: string;
  type: "string" | "number" | "date" | "boolean";
  label: string | null;
  sourceField: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractParams(resourcePath: string): string[] {
  return (resourcePath.match(/\{(\w+)\}/g) ?? []).map((m) => m.slice(1, -1));
}

function flattenProbeFields(
  obj: Record<string, unknown>,
  namespace: string,
  depth = 0,
  prefix = "",
): FieldMeta[] {
  if (depth > 2) return [];
  const fields: FieldMeta[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key === "canonicalPayload") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const expr = `{{sources.${namespace}.${path}}}`;
    if (Array.isArray(val)) {
      fields.push({ path, expr, type: "array", hint: `[${(val as unknown[]).length} items]` });
    } else if (val !== null && typeof val === "object") {
      fields.push(...flattenProbeFields(val as Record<string, unknown>, namespace, depth + 1, path));
    } else {
      const t: FieldType = val === null ? "null" : (typeof val as FieldType);
      const raw = String(val ?? "—");
      fields.push({ path, expr, type: t, hint: raw.length > 28 ? raw.slice(0, 28) + "…" : raw });
    }
  }
  return fields;
}

const TYPE_BADGE: Record<FieldType, { label: string; cls: string }> = {
  string:  { label: "str",  cls: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30" },
  number:  { label: "num",  cls: "text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30" },
  date:    { label: "date", cls: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30" },
  boolean: { label: "bool", cls: "text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30" },
  array:   { label: "arr",  cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" },
  object:  { label: "obj",  cls: "text-gray-500 dark:text-[#8b949e] bg-gray-100 dark:bg-[#1f2937]" },
  null:    { label: "null", cls: "text-gray-400 dark:text-[#484f58] bg-gray-50 dark:bg-[#0f172a]" },
};

// ─── FieldChip ────────────────────────────────────────────────────────────────

function FieldChip({ field }: { field: FieldMeta }) {
  const [copied, setCopied] = useState(false);
  const badge = TYPE_BADGE[field.type];

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", field.expr);
    e.dataTransfer.setData("application/x-field-expr", field.expr);
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleClick() {
    void navigator.clipboard.writeText(field.expr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={`Kéo vào ô Expression hoặc click để copy\n${field.expr}\n${field.hint}`}
      className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <span className={`shrink-0 text-[9px] font-bold font-mono px-1 py-0.5 rounded ${badge.cls}`}>
        {badge.label}
      </span>
      <span className="flex-1 text-[11px] font-mono text-gray-700 dark:text-[#c9d1d9] truncate min-w-0">
        {field.path}
      </span>
      {field.hint && field.hint !== "—" && (
        <span className="text-[9px] text-gray-400 dark:text-[#484f58] truncate max-w-12 shrink-0 hidden group-hover:block">
          {field.hint}
        </span>
      )}
      {copied
        ? <Check size={9} className="shrink-0 text-emerald-500" />
        : <Copy size={9} className="shrink-0 text-gray-300 dark:text-[#30363d] opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </div>
  );
}

// ─── SourceSection ────────────────────────────────────────────────────────────

interface SourceSectionState {
  expanded: boolean;
  paramValues: Record<string, string>;
  loading: boolean;
  fields: FieldMeta[] | null;
  mode: "schema" | "probe";   // schema = dùng schemaPath, probe = fetch raw
  error: string | null;
}

function SourceSection({ source }: { source: DataSource }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const requiredParams = extractParams(source.resourcePath ?? "");
  const hasSchema = Boolean(source.schemaPath);

  const [st, setSt] = useState<SourceSectionState>({
    expanded: true,
    paramValues: {},
    loading: false,
    fields: null,
    mode: hasSchema ? "schema" : "probe",
    error: null,
  });

  // Auto-fetch schema khi có schemaPath (không cần user action)
  useEffect(() => {
    if (!hasSchema) return;
    void fetchSchema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.schemaPath]);

  async function fetchSchema() {
    setSt((s) => ({ ...s, loading: true, error: null, mode: "schema" }));
    try {
      const path = source.schemaPath!;
      const url = path.startsWith("http") ? path : `${BASE}${path}`;
      const res = await fetch(url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json() as { data?: { fields?: SchemaField[] } };
      const schemaFields = raw.data?.fields ?? [];
      const fields: FieldMeta[] = schemaFields.map((f) => ({
        path: f.key,
        expr: `{{sources.${source.namespace}.${f.key}}}`,
        type: f.type,
        hint: f.label ?? f.key,
      }));
      setSt((s) => ({ ...s, loading: false, fields }));
    } catch (e) {
      setSt((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }

  async function probe() {
    setSt((s) => ({ ...s, loading: true, error: null, mode: "probe" }));
    try {
      const rawPath = source.resourcePath ?? "";
      if (!rawPath) { setSt((s) => ({ ...s, loading: false, error: "Không có resource path" })); return; }
      const path = rawPath.replace(
        /\{(\w+)\}/g,
        (_, key: string) => encodeURIComponent(st.paramValues[key] ?? ""),
      );
      const baseUrl = source.baseUrl?.replace(/\/+$/, "") ?? "";
      const url = baseUrl
        ? `${baseUrl}${path}`
        : path.startsWith("http") ? path : `${BASE}${path}`;
      const res = await fetch(url, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json() as Record<string, unknown>;
      let data = (raw?.data as Record<string, unknown>) ?? raw;
      const cp = data?.canonicalPayload;
      if (typeof cp === "string") {
        try { data = { ...data, ...(JSON.parse(cp) as Record<string, unknown>) }; } catch { /* ignore */ }
      }
      const fields = flattenProbeFields(data, source.namespace);
      setSt((s) => ({ ...s, loading: false, fields, expanded: true }));
    } catch (e) {
      setSt((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }

  return (
    <div className="rounded-lg border border-gray-100 dark:border-[#1f2937] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setSt((s) => ({ ...s, expanded: !s.expanded }))}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-[#0f172a] hover:bg-gray-100 dark:hover:bg-[#1f2937] transition-colors text-left"
      >
        <span className="text-gray-400 dark:text-[#484f58] shrink-0">
          {st.expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
        <Database size={10} className="text-emerald-500 shrink-0" />
        <code className="flex-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
          {source.namespace}
        </code>
        {st.loading && (
          <span className="text-[9px] text-gray-400 dark:text-[#484f58] shrink-0 animate-pulse">…</span>
        )}
        {!st.loading && st.fields != null && (
          <span className="text-[9px] text-gray-400 dark:text-[#484f58] shrink-0 font-mono">
            {st.fields.length}f
          </span>
        )}
        {hasSchema && (
          <span className="text-[8px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded shrink-0">
            schema
          </span>
        )}
      </button>

      {st.expanded && (
        <div className="p-2 space-y-2 bg-white dark:bg-[#0a0f1a]">
          {/* Resource path */}
          <p className="text-[9px] font-mono text-gray-400 dark:text-[#484f58] truncate m-0">
            {source.resourcePath}
          </p>

          {/* Probe section — chỉ hiện khi không có schemaPath hoặc user muốn probe thủ công */}
          {!hasSchema && (
            <>
              {requiredParams.length > 0 && (
                <div className="space-y-1.5">
                  {requiredParams.map((param) => (
                    <div key={param} className="flex items-center gap-1.5">
                      <code className="text-[9px] text-gray-500 dark:text-[#8b949e] shrink-0 font-mono w-14 truncate">
                        {`{${param}}`}
                      </code>
                      <Input
                        size="small"
                        placeholder={`test ${param}`}
                        value={st.paramValues[param] ?? ""}
                        onChange={(e) =>
                          setSt((s) => ({
                            ...s,
                            paramValues: { ...s.paramValues, [param]: e.target.value },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={probe}
                disabled={st.loading}
                className="w-full flex items-center justify-center gap-1.5 py-1 rounded-md border border-dashed border-emerald-300 dark:border-emerald-800/60 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FlaskConical size={11} />
                {st.loading ? "Đang lấy dữ liệu…" : st.fields ? "Probe lại" : "Probe & lấy fields"}
              </button>
            </>
          )}

          {/* Refresh button khi có schema */}
          {hasSchema && (
            <button
              onClick={fetchSchema}
              disabled={st.loading}
              className="w-full flex items-center justify-center gap-1.5 py-1 rounded-md border border-dashed border-emerald-300 dark:border-emerald-800/60 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FlaskConical size={11} />
              {st.loading ? "Đang tải schema…" : "Làm mới schema"}
            </button>
          )}

          {/* Error */}
          {st.error && (
            <p className="text-[10px] text-red-500 dark:text-red-400 m-0 break-all">{st.error}</p>
          )}

          {/* Fields */}
          {st.fields && st.fields.length > 0 && (
            <div className="space-y-1">
              {st.fields.map((f) => <FieldChip key={f.path} field={f} />)}
            </div>
          )}
          {st.fields && st.fields.length === 0 && (
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] text-center py-1 m-0">
              Không có field nào
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FieldBrowser ─────────────────────────────────────────────────────────────

function splitSlug(slug: string): [string, string] {
  const idx = slug.indexOf("/");
  return idx === -1 ? [slug, ""] : [slug.slice(0, idx), slug.slice(idx + 1)];
}

export function FieldBrowser({ selectedSlug }: { selectedSlug: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sources,   setSources]   = useState<DataSource[]>([]);
  const [height,    setHeight]    = useState(288);
  const drag = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    const [mc, sc] = splitSlug(selectedSlug);
    adminApi
      .getScreenLayout(mc, sc)
      .then((layout) => { if (!cancelled) setSources(layout.dataSources ?? []); })
      .catch(() => { if (!cancelled) setSources([]); });
    return () => { cancelled = true; };
  }, [selectedSlug]);

  function onResizeStart(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    drag.current = { startY: e.clientY, startH: height };

    function onMove(ev: PointerEvent) {
      if (!drag.current) return;
      const delta = drag.current.startY - ev.clientY;
      setHeight(Math.min(Math.max(drag.current.startH + delta, 80), 560));
    }
    function onUp() {
      drag.current = null;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  if (sources.length === 0) return null;

  return (
    <div
      style={collapsed ? undefined : { height }}
      className="border-t border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] shrink-0 flex flex-col"
    >
      {/* Resize handle */}
      {!collapsed && (
        <div
          onPointerDown={onResizeStart}
          style={{ touchAction: "none" }}
          className="w-full h-2 flex items-center justify-center cursor-ns-resize hover:bg-emerald-500/10 group shrink-0"
        >
          <div className="w-8 h-0.5 rounded-full bg-gray-200 dark:bg-[#1f2937] group-hover:bg-emerald-400 transition-colors" />
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#0f172a] transition-colors text-left shrink-0"
      >
        <span className="text-gray-400 dark:text-[#484f58]">
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </span>
        <span className="text-[10px] font-semibold text-gray-500 dark:text-[#8b949e] uppercase tracking-wider flex-1 select-none">
          Field Browser
        </span>
        <span className="text-[9px] font-mono text-gray-400 dark:text-[#484f58]">
          {sources.length} source{sources.length > 1 ? "s" : ""}
        </span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-1.5">
          {sources.map((src) => (
            <SourceSection key={src.namespace} source={src} />
          ))}
          <p className="text-[9px] text-gray-400 dark:text-[#484f58] text-center pt-0.5 pb-1 m-0 select-none">
            Kéo field vào ô Expression · Click để copy
          </p>
        </div>
      )}
    </div>
  );
}
