"use client";

import { App, Button, Input, Tag } from "antd";
import { Database, Plus, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useProviderManager } from "../provider/_hooks/useProviderManager";
import { STATUS_META } from "../provider/_lib/constants";
import type { Provider, ProviderForm } from "../provider/_lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toForm(p: Provider): ProviderForm {
  return {
    providerId: p.providerId,
    displayName: p.displayName,
    description: p.description ?? "",
    clientId: p.clientId,
    clientSecret: "",
    operationsText: p.operations.join("\n"),
    timeoutMs: p.timeoutMs,
    priority: p.priority,
    maxConcurrentRequests: p.maxConcurrentRequests,
    cbFailureThreshold: p.circuitBreaker.failureThreshold,
    cbWindowSeconds: p.circuitBreaker.windowSeconds,
    cbCooldownSeconds: p.circuitBreaker.cooldownSeconds,
    status: p.status,
  };
}

// ─── Provider Operations Card ─────────────────────────────────────────────────

function ProviderCard({
  provider,
  saving,
  onSave,
}: {
  provider: Provider;
  saving: boolean;
  onSave: (id: string, ops: string[]) => Promise<void>;
}) {
  const [editing, setEditing]   = useState(false);
  const [draftOps, setDraftOps] = useState<string[]>([]);
  const [input, setInput]       = useState("");

  const ops        = editing ? draftOps : provider.operations;
  const statusMeta = STATUS_META[provider.status];
  const isDirty    = editing && JSON.stringify(draftOps) !== JSON.stringify(provider.operations);

  function startEdit() {
    setDraftOps(provider.operations);
    setEditing(true);
  }

  function handleAdd() {
    const pattern = input.trim();
    if (!pattern || draftOps.includes(pattern)) return;
    setDraftOps((prev) => [...prev, pattern]);
    setInput("");
  }

  function handleRemove(pattern: string) {
    setDraftOps((prev) => prev.filter((p) => p !== pattern));
  }

  async function handleSave() {
    try {
      await onSave(provider.id, draftOps);
      setEditing(false);
    } catch {
      // error reported by caller
    }
  }

  function handleCancel() {
    setInput("");
    setEditing(false);
  }

  return (
    <div
      className={`bg-white dark:bg-[#0f172a] rounded-xl border transition-all ${
        editing
          ? "border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-100 dark:shadow-none"
          : "border-gray-200 dark:border-[#1f2937]"
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0 mt-px"
            style={{ background: statusMeta.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 dark:text-[#e6edf3]">
                {provider.displayName}
              </span>
              <Tag
                style={{
                  color: statusMeta.color,
                  background: statusMeta.bg,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 10,
                  margin: 0,
                  lineHeight: "17px",
                  padding: "0 6px",
                }}
              >
                {statusMeta.label}
              </Tag>
            </div>
            <code className="text-[11px] text-gray-400 dark:text-[#8b949e]">
              {provider.providerId}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[11px] font-medium text-gray-400 dark:text-[#484f58] tabular-nums">
            {ops.length} op{ops.length !== 1 ? "s" : ""}
          </span>
          {!editing && (
            <Button size="small" onClick={startEdit}>
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-gray-100 dark:bg-[#1f2937] mx-4" />

      {/* ── Operations list ── */}
      <div className="px-4 py-3 min-h-10">
        {ops.length === 0 ? (
          <div className="flex items-center gap-2">
            <Database size={12} className="text-gray-300 dark:text-[#30363d] shrink-0" />
            <span className="text-[12px] text-gray-400 dark:text-[#484f58] italic">
              {editing ? "Chưa có operation — nhập và nhấn Thêm" : "Chưa có operations"}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ops.map((pattern) => (
              <span
                key={pattern}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors ${
                  editing
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60"
                    : "bg-gray-100 dark:bg-[#1f2937] text-gray-700 dark:text-[#c9d1d9]"
                }`}
              >
                {pattern}
                {editing && (
                  <button
                    type="button"
                    onClick={() => handleRemove(pattern)}
                    className="text-emerald-300 hover:text-red-500 dark:hover:text-red-400 ml-0.5 leading-none transition-colors"
                    aria-label={`Xóa ${pattern}`}
                  >
                    <X size={9} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit controls ── */}
      {editing && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-gray-100 dark:border-[#1f2937] pt-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleAdd}
              placeholder="report.module.action"
              className="font-mono"
              size="small"
            />
            <Button
              type="primary"
              size="small"
              icon={<Plus size={12} />}
              onClick={handleAdd}
              disabled={!input.trim()}
            >
              Thêm
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="primary" size="small" loading={saving} onClick={handleSave}>
              Lưu thay đổi
            </Button>
            <Button size="small" onClick={handleCancel}>
              Huỷ
            </Button>
            {isDirty && (
              <span className="text-[11px] text-amber-500 dark:text-amber-400">
                • Chưa lưu
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const { message } = App.useApp();
  const manager = useProviderManager();

  async function handleSaveOps(id: string, operations: string[]) {
    const provider = manager.providers.find((p) => p.id === id);
    if (!provider) return;
    try {
      await manager.update(id, {
        ...toForm(provider),
        operationsText: operations.join("\n"),
      });
      message.success("Đã lưu operations");
    } catch {
      message.error(manager.error ?? "Lưu thất bại");
      throw new Error("save failed");
    }
  }

  const isEmpty = !manager.loading && manager.providers.length === 0;

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
            Quản lý Operations
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
            Gán operation pattern cho từng provider.
            {manager.providers.length > 0 && (
              <span className="ml-1.5 text-gray-400 dark:text-[#484f58]">
                {manager.providers.length} provider
              </span>
            )}
          </p>
        </div>
        <Button
          icon={<RefreshCw size={14} />}
          loading={manager.loading}
          onClick={manager.reload}
        >
          Làm mới
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Database size={40} className="text-gray-200 dark:text-[#21262d]" />
          <div className="text-center">
            <p className="text-sm font-semibold m-0 text-gray-500 dark:text-[#8b949e]">
              Chưa có provider nào
            </p>
            <p className="text-xs m-0 mt-1 text-gray-400 dark:text-[#484f58]">
              Đăng ký provider tại trang Quản trị Provider trước
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {manager.providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              saving={manager.saving}
              onSave={handleSaveOps}
            />
          ))}
        </div>
      )}
    </div>
  );
}
