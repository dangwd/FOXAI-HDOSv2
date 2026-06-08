"use client";

import type {
  FormScreen,
  FormsModule,
  FormTemplateListItem,
} from "@/infrastructure/http/adminApi";
import { adminApi } from "@/infrastructure/http/adminApi";
import {
  Alert,
  App,
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileText,
  Inbox,
  Layers,
  LayoutDashboard,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <span className="text-[13px] font-semibold text-gray-700 dark:text-[#c9d1d9]">
      {text}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ModuleFormDrawer } from "./_components/ModuleFormDrawer";
import { ModuleIcon } from "./_components/ModuleIcon";
import { useModuleManager } from "./_hooks/useModuleManager";
import type { ModuleForm } from "./_lib/types";

// ─── Color utils ──────────────────────────────────────────────────────────────

const PALETTE = [
  "#1677ff",
  "#0ca678",
  "#722ed1",
  "#f5a623",
  "#e8475f",
  "#13c2c2",
  "#eb2f96",
];

function codeColor(code: string): string {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = code.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function codeAbbr(code: string): string {
  const parts = code.split("-").filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: {
      label: "● Hoạt động",
      color: "#0ca678",
      bg: "rgba(12,166,120,.12)",
    },
    inactive: {
      label: "○ Tạm dừng",
      color: "#8b949e",
      bg: "rgba(139,148,158,.12)",
    },
    draft: { label: "◎ Nháp", color: "#f5a623", bg: "rgba(245,166,35,.12)" },
    published: {
      label: "● Published",
      color: "#0ca678",
      bg: "rgba(12,166,120,.12)",
    },
    archived: {
      label: "○ Archived",
      color: "#8b949e",
      bg: "rgba(139,148,158,.12)",
    },
  };
  const s = map[status.toLowerCase()] ?? map.inactive;
  return (
    <Tag
      style={{
        color: s.color,
        background: s.bg,
        border: "none",
        fontWeight: 600,
        fontSize: 11,
      }}
    >
      {s.label}
    </Tag>
  );
}

// ─── Left panel: module card ──────────────────────────────────────────────────

function ModuleCard({
  module,
  selected,
  onClick,
}: {
  module: FormsModule;
  selected: boolean;
  onClick: () => void;
}) {
  const color = codeColor(module.code);
  const isActive = module.status.toLowerCase() === "active";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2.5 ${
        selected
          ? "bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-200 dark:ring-emerald-800/40"
          : "hover:bg-gray-50 dark:hover:bg-[#161b22]"
      }`}
    >
      <ModuleIcon
        icon={codeAbbr(module.code)}
        groupColor={color}
        iconSize={13}
        boxSize={30}
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] font-semibold m-0 truncate leading-snug ${
            isActive
              ? "text-gray-800 dark:text-[#e6edf3]"
              : "text-gray-400 dark:text-[#484f58]"
          }`}
        >
          {module.name}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 font-mono truncate">
          {module.code}
        </p>
      </div>

      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight ${
            isActive
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              : "bg-gray-100 dark:bg-[#1f2937] text-gray-400 dark:text-[#484f58]"
          }`}
        >
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
  open,
  moduleCode,
  onClose,
  onCreated,
}: {
  open: boolean;
  moduleCode: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { message } = App.useApp();
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
      setSubmitError(
        msg.includes("409") || msg.toLowerCase().includes("conflict")
          ? "Key này đã tồn tại trong module. Vui lòng chọn key khác."
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!key.trim() && !!name.trim();

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <FileText size={14} className="text-emerald-500" />
          </div>
          <span>Tạo Form mới</span>
        </div>
      }
      styles={{
        wrapper: { width: 460 },
        body: { padding: "24px 24px 0" },
      }}
      footer={
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400 dark:text-[#484f58]">
            Module: <code className="bg-gray-100 dark:bg-[#1f2937] px-1.5 rounded text-gray-600 dark:text-[#8b949e]">{moduleCode}</code>
          </span>
          <div className="flex gap-2">
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>
              Tạo Form
            </Button>
          </div>
        </div>
      }
    >
      {submitError && (
        <Alert type="error" message={submitError} className="mb-5" showIcon />
      )}

      <Form layout="vertical" component="div" requiredMark={false} size="large">
        <Form.Item label={<FieldLabel text="Key" required />} className="mb-5">
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="vd: phieu-tiep-nhan"
            maxLength={100}
            className="font-mono"
          />
          <div className="mt-2 text-[11px] text-gray-400 dark:text-[#484f58] leading-relaxed">
            {key ? (
              <span>
                Schema URL:{" "}
                <code className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 rounded">
                  /forms/{moduleCode}/{key}/schema
                </code>
              </span>
            ) : (
              <span>Chỉ dùng chữ thường, số và dấu <code className="bg-gray-100 dark:bg-[#1f2937] px-1 rounded">-</code>. Không thể đổi sau khi tạo.</span>
            )}
          </div>
        </Form.Item>

        <Form.Item label={<FieldLabel text="Tên form" required />} className="mb-5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vd: Phiếu tiếp nhận bệnh nhân"
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ─── Drawer: tạo Page ────────────────────────────────────────────────────────

function CreatePageDrawer({
  open,
  moduleCode,
  onClose,
  onCreated,
}: {
  open: boolean;
  moduleCode: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { message } = App.useApp();
  const [code,        setCode]        = useState("");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder,   setSortOrder]   = useState<number | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function reset() { setCode(""); setTitle(""); setDescription(""); setSortOrder(null); setSubmitError(null); }
  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.createFormScreen({
        moduleCode,
        code:        code.trim(),
        title:       title.trim(),
        description: description.trim() || undefined,
        sortOrder:   sortOrder ?? undefined,
      });
      message.success("Tạo screen thành công");
      reset();
      onCreated();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(
        msg.includes("409") || msg.toLowerCase().includes("conflict")
          ? "Code này đã tồn tại trong module. Vui lòng chọn code khác."
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!code.trim() && !!title.trim();

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <LayoutDashboard size={14} className="text-emerald-600" />
          </div>
          <span>Tạo Screen mới</span>
        </div>
      }
      styles={{
        wrapper: { width: 480 },
        body: { padding: "24px 24px 0" },
      }}
      footer={
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-gray-400 dark:text-[#484f58]">
            Module: <code className="bg-gray-100 dark:bg-[#1f2937] px-1.5 rounded text-gray-600 dark:text-[#8b949e]">{moduleCode}</code>
          </span>
          <div className="flex gap-2">
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" disabled={!canSubmit || submitting} loading={submitting} onClick={handleSubmit}>
              Tạo Screen
            </Button>
          </div>
        </div>
      }
    >
      {submitError && (
        <Alert type="error" message={submitError} className="mb-5" showIcon />
      )}

      <Form layout="vertical" component="div" requiredMark={false} size="large">
        <Form.Item label={<FieldLabel text="Code" required />} className="mb-5">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            placeholder="vd: man-hinh-tiep-nhan"
            maxLength={100}
            className="font-mono"
          />
          <div className="mt-2 text-[11px] text-gray-400 dark:text-[#484f58] leading-relaxed">
            {code ? (
              <span>
                Layout URL:{" "}
                <code className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 rounded">
                  /forms/screens/{moduleCode}/{code}/layout
                </code>
              </span>
            ) : (
              <span>Chỉ dùng chữ thường, số và dấu <code className="bg-gray-100 dark:bg-[#1f2937] px-1 rounded">-</code>. Không thể đổi sau khi tạo.</span>
            )}
          </div>
        </Form.Item>

        <Form.Item label={<FieldLabel text="Tiêu đề" required />} className="mb-5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="vd: Màn hình tiếp nhận bệnh nhân"
            maxLength={200}
          />
        </Form.Item>

        <Divider className="my-5" plain>
          <span className="text-[11px] text-gray-400 dark:text-[#484f58] font-normal">Tuỳ chọn</span>
        </Divider>

        <Form.Item label={<FieldLabel text="Mô tả" />} className="mb-5">
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về mục đích của page này…"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label={<FieldLabel text="Thứ tự hiển thị" />} className="mb-5">
          <InputNumber
            value={sortOrder}
            onChange={(v) => setSortOrder(v)}
            placeholder="0"
            min={0}
            className="w-full"
          />
          <p className="text-[11px] text-gray-400 dark:text-[#484f58] mt-1.5 m-0">
            Số nhỏ hơn hiển thị trước. Để trống nếu không quan trọng.
          </p>
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ─── Right panel: forms tab ───────────────────────────────────────────────────

function FormsTab({ moduleCode }: { moduleCode: string }) {
  const [forms, setForms] = useState<FormTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">
          {forms.length} form
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<RefreshCw size={11} />}
            onClick={load}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<Plus size={11} />}
            onClick={() => setDrawerOpen(true)}
          >
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

      <div className="flex-1 overflow-y-auto px-6 py-3">
        {error ? (
          <Alert type="error" message={error} showIcon />
        ) : (
          <Table<FormTemplateListItem>
            dataSource={forms}
            rowKey="id"
            size="middle"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-12 text-gray-400 dark:text-[#484f58]">
                  <FileText size={32} className="text-gray-200 dark:text-[#30363d]" />
                  <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">Chưa có form nào</p>
                </div>
              ),
            }}
            columns={[
              {
                title:     "Key",
                dataIndex: "key",
                width:     180,
                render:    (v: string) => (
                  <code className="text-[12px] bg-gray-100 dark:bg-[#1f2937] px-2 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
                    {v}
                  </code>
                ),
              },
              {
                title:     "Tên form",
                dataIndex: "name",
                render:    (v: string) => <span className="font-medium text-gray-800 dark:text-[#e6edf3]">{v}</span>,
              },
              {
                title:     "Trạng thái",
                dataIndex: "status",
                width:     130,
                render:    (v: string) => <StatusTag status={v} />,
              },
              {
                title:     "Version",
                dataIndex: "version",
                width:     80,
                align:     "center" as const,
                render:    (v: number) => <span className="text-xs text-gray-400 dark:text-[#484f58] font-mono">v{v}</span>,
              },
            ] as ColumnsType<FormTemplateListItem>}
          />
        )}
      </div>
    </div>
  );
}

// ─── Right panel: screens tab ────────────────────────────────────────────────

function ScreensTab({ moduleCode }: { moduleCode: string }) {
  const { message } = App.useApp();
  const [screens,    setScreens]    = useState<FormScreen[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScreens(await adminApi.listFormScreens(moduleCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [moduleCode]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function handlePublish(s: FormScreen) {
    setPublishing(s.code);
    try {
      await adminApi.publishFormScreen(moduleCode, s.code);
      message.success(`Đã publish "${s.title}"`);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete(s: FormScreen) {
    setDeleting(s.code);
    try {
      await adminApi.deleteFormScreen(moduleCode, s.code);
      message.success("Đã xóa screen");
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
        <span className="text-xs text-gray-500 dark:text-[#8b949e]">
          {screens.length} screen
        </span>
        <div className="flex items-center gap-2">
          <Button size="small" icon={<RefreshCw size={11} />} onClick={load} loading={loading}>
            Làm mới
          </Button>
          <Button size="small" type="primary" icon={<Plus size={11} />} onClick={() => setDrawerOpen(true)}>
            Tạo Screen
          </Button>
        </div>
      </div>
      <CreatePageDrawer
        open={drawerOpen}
        moduleCode={moduleCode}
        onClose={() => setDrawerOpen(false)}
        onCreated={load}
      />

      <div className="flex-1 overflow-y-auto px-6 py-3">
        {error ? (
          <Alert type="error" message={error} showIcon />
        ) : (
          <Table<FormScreen>
            dataSource={screens}
            rowKey="id"
            size="middle"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center gap-2 py-12 text-gray-400 dark:text-[#484f58]">
                  <LayoutDashboard size={32} className="text-gray-200 dark:text-[#30363d]" />
                  <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">Chưa có screen nào</p>
                </div>
              ),
            }}
            columns={[
              {
                title:     "Code",
                dataIndex: "code",
                width:     180,
                render:    (v: string) => (
                  <code className="text-[12px] bg-gray-100 dark:bg-[#1f2937] px-2 py-0.5 rounded text-gray-600 dark:text-[#8b949e]">
                    {v}
                  </code>
                ),
              },
              {
                title:     "Tiêu đề",
                dataIndex: "title",
                render:    (v: string, s: FormScreen) => (
                  <div>
                    <span className="font-medium text-gray-800 dark:text-[#e6edf3]">{v}</span>
                    {s.description && (
                      <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 truncate max-w-[260px]">
                        {s.description}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                title:     "Tabs",
                dataIndex: "tabCount",
                width:     70,
                align:     "center" as const,
                render:    (v: number | undefined) => (
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                    (v ?? 0) > 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-[#1f2937] text-gray-400 dark:text-[#484f58]"
                  }`}>
                    {v ?? 0}
                  </span>
                ),
              },
              {
                title:     "Trạng thái",
                dataIndex: "status",
                width:     130,
                render:    (v: string) => <StatusTag status={v} />,
              },
              {
                title:  "",
                key:    "actions",
                width:  120,
                align:  "right" as const,
                render: (_: unknown, s: FormScreen) => (
                  <Space size={4}>
                    <Tooltip title="Thiết kế screen">
                      <Link href={`/admin/reports-design?module=${moduleCode}&screen=${s.code}`}>
                        <Button type="text" size="small" icon={<PenLine size={13} />} />
                      </Link>
                    </Tooltip>
                    {s.status.toLowerCase() === "draft" && (
                      <Tooltip title="Publish — chuyển sang Published">
                        <Button
                          type="text"
                          size="small"
                          icon={<Upload size={13} />}
                          loading={publishing === s.code}
                          onClick={() => handlePublish(s)}
                        />
                      </Tooltip>
                    )}
                    <Popconfirm
                      title={`Xóa screen "${s.title}"?`}
                      description="Thao tác này không thể hoàn tác. Tất cả tab và widget sẽ bị xóa."
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDelete(s)}
                    >
                      <Tooltip title="Xóa">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<Trash2 size={13} />}
                          loading={deleting === s.code}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                ),
              },
            ] as ColumnsType<FormScreen>}
          />
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
      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1f2937] shrink-0">
        <div className="flex items-center gap-4">
          <ModuleIcon
            icon={codeAbbr(module.code)}
            groupColor={color}
            iconSize={20}
            boxSize={46}
          />
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
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800 dark:text-[#e6edf3] m-0 leading-none">
                {module.formCount}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 uppercase tracking-wider">
                forms
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-800 dark:text-[#e6edf3] m-0 leading-none">
                {module.screenCount}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5 uppercase tracking-wider">
                pages
              </p>
            </div>
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
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e]">
                    {module.formCount}
                  </span>
                </span>
              ),
              children: <FormsTab moduleCode={module.code} />,
            },
            {
              key: "screens",
              label: (
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard size={12} />
                  Screens
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-[#8b949e]">
                    {module.screenCount}
                  </span>
                </span>
              ),
              children: <ScreensTab moduleCode={module.code} />,
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
  const { message } = App.useApp();
  const manager = useModuleManager();
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-select first module once list loads
  useEffect(() => {
    if (!selected && manager.filtered.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(manager.filtered[0].code);
    }
  }, [manager.filtered, selected]);

  const selectedModule =
    manager.filtered.find((m) => m.code === selected) ?? null;

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
      <div className="bg-white dark:bg-[#0a0f1a] border-b border-gray-200 dark:border-[#1f2937] px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
              Quản lý Modules
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
              {manager.modules.length} module · DynamicFormService
            </p>
          </div>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              setSubmitError(null);
              setDrawerOpen(true);
            }}
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
            title="Không tải được danh sách module"
            description={manager.loadError}
          />
        </div>
      )}

      {/* ── Split panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: module list */}
        <div className="w-64 shrink-0 border-r border-gray-200 dark:border-[#1f2937] flex flex-col bg-gray-50 dark:bg-[#010409]">
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-[#1f2937]">
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
                <Inbox
                  size={26}
                  className="text-gray-300 dark:text-[#30363d]"
                />
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
            <div className="px-3 py-2 border-t border-gray-100 dark:border-[#1f2937] shrink-0">
              <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 text-center">
                {manager.filtered.length} / {manager.modules.length} module
              </p>
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-[#0a0f1a]">
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
