"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Button, Spin, Tag, Tabs } from "antd";
import { ArrowLeft, FileText, LayoutDashboard, Plus, RefreshCw } from "lucide-react";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { FormsModule, FormTemplateListItem, FormPageListItem } from "@/infrastructure/http/adminApi";
import { ModuleIcon } from "../_components/ModuleIcon";

// ─── Shared color utils (same as ModuleTable) ─────────────────────────────────

const PALETTE = ["#1677ff", "#0ca678", "#722ed1", "#f5a623", "#e8475f", "#13c2c2", "#eb2f96"];

function codeColor(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = code.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function codeAbbr(code: string): string {
  const parts = code.split("-").filter(Boolean);
  return parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "??";
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: "● Hoạt động", color: "#0ca678", bg: "rgba(12,166,120,.12)" },
    inactive:  { label: "○ Tạm dừng",  color: "#8b949e", bg: "rgba(139,148,158,.12)" },
    draft:     { label: "◎ Nháp",       color: "#f5a623", bg: "rgba(245,166,35,.12)"  },
    published: { label: "● Published", color: "#0ca678", bg: "rgba(12,166,120,.12)"  },
    archived:  { label: "○ Archived",  color: "#8b949e", bg: "rgba(139,148,158,.12)" },
  };
  const s = map[status.toLowerCase()] ?? map.inactive;
  return (
    <Tag style={{ color: s.color, background: s.bg, border: "none", fontWeight: 600 }}>
      {s.label}
    </Tag>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#21262d]">
      <div className={`${SK} h-4 w-1/4`} />
      <div className={`${SK} h-4 w-1/3`} />
      <div className={`${SK} h-4 w-16 ml-auto`} />
    </div>
  );
}

// ─── Forms tab ────────────────────────────────────────────────────────────────

function FormsTab({ moduleCode }: { moduleCode: string }) {
  const [forms,   setForms]   = useState<FormTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listForms(moduleCode);
      setForms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [moduleCode]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-[#21262d] shrink-0">
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">
          {forms.length} form
        </span>
        <div className="flex items-center gap-2">
          <Button size="small" icon={<RefreshCw size={12} />} onClick={load} loading={loading}>
            Làm mới
          </Button>
          <Button size="small" type="primary" icon={<Plus size={12} />} disabled>
            Tạo Form
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>{[1, 2, 3].map((i) => <RowSkeleton key={i} />)}</>
        ) : error ? (
          <div className="p-6">
            <Alert type="error" message={error} showIcon />
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 dark:text-[#484f58]">
            <FileText size={40} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e] m-0">
              Chưa có form nào trong module này
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider border-b border-gray-100 dark:border-[#21262d]">
                <th className="px-6 py-2.5 text-left font-semibold">Key</th>
                <th className="px-4 py-2.5 text-left font-semibold">Tên form</th>
                <th className="px-4 py-2.5 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-2.5 text-right font-semibold">Version</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-gray-50 dark:border-[#21262d] hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors"
                >
                  <td className="px-6 py-3">
                    <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
                      {f.key}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-[#e6edf3]">{f.name}</td>
                  <td className="px-4 py-3">
                    <StatusTag status={f.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 dark:text-[#484f58]">
                    v{f.version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Pages tab ────────────────────────────────────────────────────────────────

function PagesTab({ moduleCode }: { moduleCode: string }) {
  const [pages,   setPages]   = useState<FormPageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listPages(moduleCode);
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [moduleCode]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-[#21262d] shrink-0">
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">
          {pages.length} page
        </span>
        <div className="flex items-center gap-2">
          <Button size="small" icon={<RefreshCw size={12} />} onClick={load} loading={loading}>
            Làm mới
          </Button>
          <Button size="small" type="primary" icon={<Plus size={12} />} disabled>
            Tạo Page
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>{[1, 2].map((i) => <RowSkeleton key={i} />)}</>
        ) : error ? (
          <div className="p-6">
            <Alert type="error" message={error} showIcon />
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 dark:text-[#484f58]">
            <LayoutDashboard size={40} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e] m-0">
              Chưa có page nào trong module này
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider border-b border-gray-100 dark:border-[#21262d]">
                <th className="px-6 py-2.5 text-left font-semibold">Code</th>
                <th className="px-4 py-2.5 text-left font-semibold">Tiêu đề</th>
                <th className="px-4 py-2.5 text-left font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 dark:border-[#21262d] hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors"
                >
                  <td className="px-6 py-3">
                    <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
                      {p.code}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-[#e6edf3]">{p.title}</td>
                  <td className="px-4 py-3">
                    <StatusTag status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModuleCanvasPage() {
  const { code }  = useParams<{ code: string }>();
  const router    = useRouter();
  const [module,  setModule]  = useState<FormsModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await adminApi.listFormsModules();
        const found = list.find((m) => m.code === code) ?? null;
        if (!found) setError(`Module "${code}" không tồn tại`);
        else setModule(found);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const color = codeColor(code);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="p-6 max-w-lg">
        <Alert type="error" message={error ?? "Module không tìm thấy"} showIcon className="mb-4" />
        <Button icon={<ArrowLeft size={14} />} onClick={() => router.push("/admin/modules")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] px-6 py-4 shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#8b949e] mb-3">
          <button
            onClick={() => router.push("/admin/modules")}
            className="hover:text-gray-700 dark:hover:text-[#e6edf3] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={11} />
            Quản lý Module
          </button>
          <span>/</span>
          <span className="text-gray-600 dark:text-[#c9d1d9] font-medium">{module.name}</span>
        </div>

        {/* Module info */}
        <div className="flex items-center gap-4">
          <ModuleIcon icon={codeAbbr(code)} groupColor={color} iconSize={20} boxSize={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-snug">
                {module.name}
              </h1>
              <StatusTag status={module.status} />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 font-mono">
              {module.code}
            </p>
            {module.description && (
              <p className="text-xs text-gray-500 dark:text-[#8b949e] m-0 mt-1 line-clamp-1">
                {module.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-gray-800 dark:text-[#e6edf3] m-0 leading-none">
              {module.formCount}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 uppercase tracking-wider">
              forms
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs
          defaultActiveKey="forms"
          destroyInactiveTabPane={false}
          className="flex-1 min-h-0 flex flex-col [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full"
          tabBarStyle={{ paddingInline: 24, marginBottom: 0 }}
          items={[
            {
              key: "forms",
              label: (
                <span className="flex items-center gap-1.5">
                  <FileText size={13} />
                  Forms
                  <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#8b949e]">
                    {module.formCount}
                  </span>
                </span>
              ),
              children: <FormsTab moduleCode={code} />,
            },
            {
              key: "pages",
              label: (
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard size={13} />
                  Pages
                </span>
              ),
              children: <PagesTab moduleCode={code} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
