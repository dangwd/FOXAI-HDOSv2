"use client";

import { useState } from "react";
import { Button, Input, message, Tag, Tabs } from "antd";
import { Plus, RefreshCw, X } from "lucide-react";
import { useProviderManager } from "../provider/_hooks/useProviderManager";
import { OperationsTab } from "../provider/_components/OperationsTab";
import { STATUS_META } from "../provider/_lib/constants";
import type { Provider, ProviderForm } from "../provider/_lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toForm(p: Provider): ProviderForm {
  return {
    providerId:            p.providerId,
    displayName:           p.displayName,
    description:           p.description ?? "",
    clientId:              p.clientId,
    clientSecret:          "",
    operationsText:        p.operations.join("\n"),
    timeoutMs:             p.timeoutMs,
    priority:              p.priority,
    maxConcurrentRequests: p.maxConcurrentRequests,
    cbFailureThreshold:    p.circuitBreaker.failureThreshold,
    cbWindowSeconds:       p.circuitBreaker.windowSeconds,
    cbCooldownSeconds:     p.circuitBreaker.cooldownSeconds,
    status:                p.status,
  };
}

// ─── Provider Operations Card ─────────────────────────────────────────────────

function ProviderCard({
  provider,
  saving,
  onSave,
}: {
  provider: Provider;
  saving:   boolean;
  onSave:   (id: string, ops: string[]) => Promise<void>;
}) {
  const [editing,  setEditing]  = useState(false);
  const [draftOps, setDraftOps] = useState<string[]>([]);
  const [input,    setInput]    = useState("");

  // When not editing, ops are always from props; draft only lives during an edit session
  const ops = editing ? draftOps : provider.operations;

  const statusMeta = STATUS_META[provider.status];

  function startEdit() {
    setDraftOps(provider.operations);
    setEditing(true);
  }

  function handleAdd() {
    const pattern = input.trim();
    if (!pattern) return;
    if (!draftOps.includes(pattern)) setDraftOps((prev) => [...prev, pattern]);
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
      // error already reported by caller
    }
  }

  function handleCancel() {
    setInput("");
    setEditing(false);
  }

  return (
    <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 space-y-3">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-gray-900 dark:text-[#e6edf3] leading-snug">
              {provider.displayName}
            </span>
            <Tag
              style={{
                color:      statusMeta.color,
                background: statusMeta.bg,
                border:     "none",
                fontWeight: 600,
                fontSize:   11,
                margin:     0,
                lineHeight: "18px",
              }}
            >
              {provider.status}
            </Tag>
          </div>
          <code className="text-[11px] text-gray-400 dark:text-[#8b949e]">
            {provider.providerId}
          </code>
        </div>

        {!editing && (
          <Button size="small" onClick={startEdit}>
            Chỉnh sửa
          </Button>
        )}
      </div>

      {/* ── Operations list ── */}
      {ops.length === 0 ? (
        <p className="text-[12px] text-gray-400 dark:text-[#484f58] italic m-0">
          Chưa có operations
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {ops.map((pattern) => (
            <span
              key={pattern}
              className="
                inline-flex items-center gap-1
                px-2 py-0.5
                bg-gray-100 dark:bg-[#21262d]
                rounded text-[11px] font-mono
                text-gray-700 dark:text-[#c9d1d9]
              "
            >
              {pattern}
              {editing && (
                <button
                  type="button"
                  onClick={() => handleRemove(pattern)}
                  className="text-gray-400 hover:text-red-500 ml-0.5 leading-none"
                  aria-label={`Xóa ${pattern}`}
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* ── Edit mode controls ── */}
      {editing && (
        <div className="space-y-2.5 pt-0.5">
          {/* Add input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleAdd}
              placeholder="report.new.operation"
              className="font-mono"
              size="small"
            />
            <Button
              type="primary"
              size="small"
              icon={<Plus size={12} />}
              onClick={handleAdd}
            >
              Thêm
            </Button>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <Button
              type="primary"
              size="small"
              loading={saving}
              onClick={handleSave}
            >
              Lưu thay đổi
            </Button>
            <Button size="small" onClick={handleCancel}>
              Huỷ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── "Operations theo Provider" tab ──────────────────────────────────────────

function ByProviderTab({
  providers,
  loading,
  saving,
  onRefresh,
  onSave,
}: {
  providers: Provider[];
  loading:   boolean;
  saving:    boolean;
  onRefresh: () => void;
  onSave:    (id: string, ops: string[]) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">
          Chỉnh sửa danh sách operations của từng provider.
        </p>
        <Button
          icon={<RefreshCw size={14} />}
          loading={loading}
          onClick={onRefresh}
        >
          Làm mới
        </Button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            saving={saving}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OperationsPage() {
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

  const tabItems = [
    {
      key:      "by-provider",
      label:    "Operations theo Provider",
      children: (
        <ByProviderTab
          providers={manager.providers}
          loading={manager.loading}
          saving={manager.saving}
          onRefresh={manager.reload}
          onSave={handleSaveOps}
        />
      ),
    },
    {
      key:      "registry",
      label:    "Operation Registry",
      children: <OperationsTab />,
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">
          Quản lý Operations
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#8b949e] mt-1 m-0">
          Chỉnh sửa operations của từng provider và quản lý operation registry.
        </p>
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} />
    </div>
  );
}
