"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { App, Alert, Button, Drawer, Form, Input, Space, Spin, Tabs, Tag } from "antd";
import {
  Plus, Search, FileText, LayoutDashboard, RefreshCw, Inbox, Layers, PenLine,
} from "lucide-react";
import { adminApi } from "@/infrastructure/http/adminApi";
import type {
  FormsModule, FormTemplateListItem, FormPageListItem,
} from "@/infrastructure/http/adminApi";
import { ModuleIcon } from "./_components/ModuleIcon";
import { ModuleFormDrawer } from "./_components/ModuleFormDrawer";
import { useModuleManager } from "./_hooks/useModuleManager";
import type { ModuleForm } from "./_lib/types";

// ─── Color utils ──────────────────────────────────────────────────────────────

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
    <Tag style={{ color: s.color, background: s.bg, border: "none", fontWeight: 600, fontSize: 11 }}>
      {s.label}
    </Tag>
  );
}

// ─── Left panel: module card ──────────────────────────────────────────────────

function ModuleCard({
  module, selected, onClick,
}: {
  module:   FormsModule;
  selected: boolean;
  onClick:  () => void;
}) {
  const color    = codeColor(module.code);
  const isActive = module.status.toLowerCase() === "active";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 ${
        selected
          ? "bg-blue-50 dark:bg-[#1c2333] ring-1 ring-blue-200 dark:ring-[#1f6feb]"
          : "hover:bg-gray-50 dark:hover:bg-[#161b22]"
      }`}
    >
      <ModuleIcon icon={codeAbbr(module.code)} groupColor={color} iconSize={13} boxSize={30} />

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold m-0 truncate leading-snug ${
          isActive
            ? "text-gray-800 dark:text-[#e6edf3]"
            : "text-gray-400 dark:text-[#484f58]"
        }`}>
          {module.name}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 font-mono truncate">
          {module.code}
        </p>
      </div>

      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight ${
          isActive
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            : "bg-gray-100 dark:bg-[#21262d] text-gray-400 dark:text-[#484f58]"
        }`}>
          {isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-[#484f58]">
          {module.formCount} forms
        </span>
      </div>
    </button>
  );
}

// ─── Drawer: tạo Form ────────────────────────────────────────────────────────

function CreateFormDrawer({
  open, moduleCode, onClose, onCreated,
}: {
  open:      boolean;
  moduleCode: string;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const { message }              = App.useApp();
  const [key,         setKey]         = useState("");
  const [name,        setName]        = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset() { setKey(""); setName(""); setSubmitError(null); }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.createForm(moduleCode, { key: key.trim(), name: name.trim() });
      message.success("Tạo form thành công");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
        setSubmitError("Key này đã tồn tại trong module. Vui lòng chọn key khác.");
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!key.trim() && !!name.trim();

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Tạo Form mới"
      styles={{ wrapper: { width: 440 } }}
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>
              Tạo Form
            </Button>
          </Space>
        </div>
      }
    >
      <Form layout="vertical" component="div">
        {submitError && <Alert type="error" message={submitError} className="mb-4" showIcon />}

        <Form.Item
          label="Key"
          required
          help={`Chỉ gồm chữ thường, số và dấu gạch ngang. Dùng trong URL: /forms/${moduleCode}/{key}/schema`}
        >
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="vd: phieu-tiep-nhan"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item label="Tên form" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vd: Phiếu tiếp nhận"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ─── Drawer: tạo Page ────────────────────────────────────────────────────────

function CreatePageDrawer({
  open, moduleCode, onClose, onCreated,
}: {
  open:      boolean;
  moduleCode: string;
  onClose:   () => void;
  onCreated: () => void;
}) {
  const { message }              = App.useApp();
  const [code,        setCode]        = useState("");
  const [title,       setTitle]       = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset() { setCode(""); setTitle(""); setSubmitError(null); }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.createPage(moduleCode, { code: code.trim(), title: title.trim() });
      message.success("Tạo page thành công");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
        setSubmitError("Code này đã tồn tại trong module. Vui lòng chọn code khác.");
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!code.trim() && !!title.trim();

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Tạo Page mới"
      styles={{ wrapper: { width: 440 } }}
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>
              Tạo Page
            </Button>
          </Space>
        </div>
      }
    >
      <Form layout="vertical" component="div">
        {submitError && <Alert type="error" message={submitError} className="mb-4" showIcon />}

        <Form.Item
          label="Code"
          required
          help="Chỉ gồm chữ thường, số và dấu gạch ngang. Dùng trong URL."
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="vd: man-hinh-tiep-nhan"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item label="Tiêu đề" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="vd: Màn hình tiếp nhận"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ─── Right panel: skeleton row ────────────────────────────────────────────────

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-[#21262d]">
      <div className={`${SK} h-4 w-1/4`} />
      <div className={`${SK} h-4 w-1/3`} />
      <div className={`${SK} h-4 w-16 ml-auto`} />
    </div>
  );
}

// ─── Right panel: forms tab ───────────────────────────────────────────────────

function FormsTab({ moduleCode }: { moduleCode: string }) {
  const [forms,       setForms]       = useState<FormTemplateListItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForms(await adminApi.listForms(moduleCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [moduleCode]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100 dark:border-[#21262d] shrink-0">
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">{forms.length} form</span>
        <div className="flex items-center gap-2">
          <Button size="small" icon={<RefreshCw size={11} />} onClick={load} loading={loading}>
            Làm mới
          </Button>
          <Button size="small" type="primary" icon={<Plus size={11} />} onClick={() => setDrawerOpen(true)}>
            Tạo Form
          </Button>
        </div>
      </div>
      <CreateFormDrawer
        open={drawerOpen}
        moduleCode={moduleCode}
        onClose={() => setDrawerOpen(false)}
        onCreated={load}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>{[1, 2, 3].map((i) => <RowSkeleton key={i} />)}</>
        ) : error ? (
          <div className="p-6"><Alert type="error" message={error} showIcon /></div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-[#484f58]">
            <FileText size={36} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">Chưa có form nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider border-b border-gray-100 dark:border-[#21262d]">
                <th className="px-6 py-2 text-left">Key</th>
                <th className="px-4 py-2 text-left">Tên form</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-right">Version</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-gray-50 dark:border-[#21262d] hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors"
                >
                  <td className="px-6 py-2.5">
                    <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
                      {f.key}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-[#e6edf3]">{f.name}</td>
                  <td className="px-4 py-2.5"><StatusTag status={f.status} /></td>
                  <td className="px-4 py-2.5 text-right text-gray-400 dark:text-[#484f58]">v{f.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Right panel: pages tab ───────────────────────────────────────────────────

function PagesTab({ moduleCode }: { moduleCode: string }) {
  const [pages,      setPages]      = useState<FormPageListItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPages(await adminApi.listPages(moduleCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [moduleCode]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100 dark:border-[#21262d] shrink-0">
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">{pages.length} page</span>
        <div className="flex items-center gap-2">
          <Button size="small" icon={<RefreshCw size={11} />} onClick={load} loading={loading}>
            Làm mới
          </Button>
          <Button size="small" type="primary" icon={<Plus size={11} />} onClick={() => setDrawerOpen(true)}>
            Tạo Page
          </Button>
        </div>
      </div>
      <CreatePageDrawer
        open={drawerOpen}
        moduleCode={moduleCode}
        onClose={() => setDrawerOpen(false)}
        onCreated={load}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>{[1, 2].map((i) => <RowSkeleton key={i} />)}</>
        ) : error ? (
          <div className="p-6"><Alert type="error" message={error} showIcon /></div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-[#484f58]">
            <LayoutDashboard size={36} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">Chưa có page nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-semibold text-gray-400 dark:text-[#484f58] uppercase tracking-wider border-b border-gray-100 dark:border-[#21262d]">
                <th className="px-6 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Tiêu đề</th>
                <th className="px-4 py-2 text-left">Trạng thái</th>
                <th className="px-4 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 dark:border-[#21262d] hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors"
                >
                  <td className="px-6 py-2.5">
                    <code className="text-[11px] bg-gray-100 dark:bg-[#21262d] px-1.5 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
                      {p.code}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-[#e6edf3]">{p.title}</td>
                  <td className="px-4 py-2.5"><StatusTag status={p.status} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/menus?designPage=${p.id}&moduleCode=${encodeURIComponent(moduleCode)}&pageCode=${encodeURIComponent(p.code)}&pageTitle=${encodeURIComponent(p.title)}&pageStatus=${p.status}`}
                    >
                      <Button size="small" icon={<PenLine size={11} />}>
                        Thiết kế
                      </Button>
                    </Link>
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

// ─── Right panel: module detail ───────────────────────────────────────────────

function ModuleDetail({ module }: { module: FormsModule }) {
  const color = codeColor(module.code);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#21262d] shrink-0">
        <div className="flex items-center gap-4">
          <ModuleIcon icon={codeAbbr(module.code)} groupColor={color} iconSize={20} boxSize={46} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-snug">
                {module.name}
              </h2>
              <StatusTag status={module.status} />
            </div>
            <p className="text-[11px] font-mono text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
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

      {/* Tabs */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <Tabs
          defaultActiveKey="forms"
          className="flex-1 min-h-0 flex flex-col [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:overflow-hidden [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full"
          tabBarStyle={{ paddingInline: 24, marginBottom: 0 }}
          items={[
            {
              key: "forms",
              label: (
                <span className="flex items-center gap-1.5">
                  <FileText size={12} />
                  Forms
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#21262d] text-gray-500 dark:text-[#8b949e]">
                    {module.formCount}
                  </span>
                </span>
              ),
              children: <FormsTab moduleCode={module.code} />,
            },
            {
              key: "pages",
              label: (
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard size={12} />
                  Pages
                </span>
              ),
              children: <PagesTab moduleCode={module.code} />,
            },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-[#484f58]">
      <Layers size={44} className="text-gray-300 dark:text-[#30363d]" />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500 dark:text-[#8b949e] m-0">
          Chọn một module để xem chi tiết
        </p>
        <p className="text-xs text-gray-400 dark:text-[#484f58] m-0 mt-1">
          Forms và Pages sẽ hiển thị tại đây
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModuleManagerPage() {
  const { message }   = App.useApp();
  const manager       = useModuleManager();
  const [selected,    setSelected]    = useState<string | null>(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-select first module once list loads
  useEffect(() => {
    if (!selected && manager.filtered.length > 0) {
      setSelected(manager.filtered[0].code);
    }
  }, [manager.filtered, selected]);

  const selectedModule = manager.filtered.find((m) => m.code === selected) ?? null;

  async function handleSubmit(form: ModuleForm) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await manager.create(form);
      setDrawerOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
        setSubmitError("Code này đã tồn tại. Vui lòng chọn code khác.");
      } else {
        setSubmitError(msg);
        message.error("Tạo module thất bại. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
              DynamicForm Builder
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
              {manager.modules.length} module · DynamicFormService
            </p>
          </div>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => { setSubmitError(null); setDrawerOpen(true); }}
          >
            Tạo Module mới
          </Button>
        </div>
      </div>

      {/* ── Load error ─────────────────────────────────────────────────────── */}
      {manager.loadError && (
        <div className="px-6 pt-3 shrink-0">
          <Alert
            type="error"
            showIcon
            message="Không tải được danh sách module"
            description={manager.loadError}
          />
        </div>
      )}

      {/* ── Split panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: module list */}
        <div className="w-64 shrink-0 border-r border-gray-200 dark:border-[#30363d] flex flex-col bg-gray-50 dark:bg-[#010409]">
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#21262d]">
            <Input
              prefix={<Search size={12} className="text-gray-400" />}
              value={manager.search}
              onChange={(e) => manager.setSearch(e.target.value)}
              placeholder="Tìm module..."
              allowClear
              size="small"
            />
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {manager.loading ? (
              <div className="flex items-center justify-center h-32">
                <Spin size="small" />
              </div>
            ) : manager.filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
                <Inbox size={26} className="text-gray-300 dark:text-[#30363d]" />
                <p className="text-xs m-0 text-center">
                  {manager.search.trim()
                    ? "Không tìm thấy module"
                    : "Chưa có module nào"}
                </p>
              </div>
            ) : (
              manager.filtered.map((m) => (
                <ModuleCard
                  key={m.id}
                  module={m}
                  selected={m.code === selected}
                  onClick={() => setSelected(m.code)}
                />
              ))
            )}
          </div>

          {/* Footer count */}
          {!manager.loading && manager.filtered.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-[#21262d] shrink-0">
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 text-center">
                {manager.filtered.length} / {manager.modules.length} module
              </p>
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-[#0d1117]">
          {selectedModule ? (
            <ModuleDetail module={selectedModule} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>

      {/* ── Create drawer ───────────────────────────────────────────────────── */}
      <ModuleFormDrawer
        open={drawerOpen}
        onSubmit={handleSubmit}
        onClose={() => setDrawerOpen(false)}
        submitting={submitting}
        submitError={submitError}
      />
    </div>
  );
}
