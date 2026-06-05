"use client";

import { App, Button, Input, Table, Tabs, Tag, theme } from "antd";
import { Key, Layers, Plus, Search, ShieldOff } from "lucide-react";
import { useState } from "react";
import { CredentialsModal } from "./_components/CredentialsModal";
import { OperationsTab } from "./_components/OperationsTab";
import { ProbeModal } from "./_components/ProbeModal";
import { ProviderFormDrawer } from "./_components/ProviderFormDrawer";
import { ProviderTable } from "./_components/ProviderTable";
import {
  useProviderManager,
  type StatusFilter,
} from "./_hooks/useProviderManager";
import { STATUS_META, STATUS_ORDER, providerColor } from "./_lib/constants";
import type { Provider } from "./_lib/types";
import { BLANK_FORM, type ProviderForm } from "./_lib/types";

// ─── Drawer state ─────────────────────────────────────────────────────────────

type DrawerState = { mode: "create" } | { mode: "edit"; target: Provider };

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


// ─── Credentials tab (simple list) ───────────────────────────────────────────

function CredentialsTab({
  providers,
  onManage,
}: {
  providers: Provider[];
  onManage: (p: Provider) => void;
}) {
  return (
    <Table
      dataSource={providers}
      rowKey="id"
      size="small"
      pagination={false}
      locale={{
        emptyText: (
          <div className="flex flex-col items-center gap-2 py-10">
            <ShieldOff size={32} className="text-gray-200 dark:text-[#21262d]" />
            <span className="text-sm text-gray-400 dark:text-[#484f58]">
              Chưa có provider nào để quản lý credentials
            </span>
          </div>
        ),
      }}
      columns={[
        {
          title: "Provider",
          key: "provider",
          render: (_, p) => {
            const color = providerColor(p.providerId);
            const initials = p.providerId
              .split("-")
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("");
            return (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: color }}
                >
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-sm">{p.displayName}</div>
                  <code className="text-[10px] text-gray-400">
                    {p.providerId}
                  </code>
                </div>
              </div>
            );
          },
        },
        {
          title: "Client ID",
          key: "clientId",
          width: 200,
          render: (_, p) => <code className="text-[11px]">{p.clientId}</code>,
        },
        {
          title: "Credential Status",
          key: "credStatus",
          width: 160,
          render: (_, p) =>
            p.status === "credentials_revoked" ? (
              <Tag color="error">Revoked</Tag>
            ) : (
              <Tag color="success">Active</Tag>
            ),
        },
        {
          title: "",
          key: "actions",
          width: 120,
          align: "right" as const,
          render: (_, p) => (
            <Button
              size="small"
              icon={<Key size={12} />}
              onClick={() => onManage(p)}
            >
              Quản lý
            </Button>
          ),
        },
      ]}
    />
  );
}

// ─── Providers tab ────────────────────────────────────────────────────────────

function ProvidersTab({
  manager,
  onEdit,
  onProbe,
  onCredentials,
  onDelete,
  onAdd,
}: {
  manager: ReturnType<typeof useProviderManager>;
  onEdit: (p: Provider) => void;
  onProbe: (p: Provider) => void;
  onCredentials: (p: Provider) => void;
  onDelete: (p: Provider) => void;
  onAdd: () => void;
}) {
  const hasFilter = !!manager.search.trim() || manager.statusFilter !== "all";

  const statusOptions = [
    { key: "all" as StatusFilter, label: "Tất cả" },
    ...STATUS_ORDER.map((s) => ({
      key: s as StatusFilter,
      label: STATUS_META[s].label,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          prefix={<Search size={14} className="text-gray-400" />}
          value={manager.search}
          onChange={(e) => manager.setSearch(e.target.value)}
          placeholder="Tìm provider, operation pattern..."
          allowClear
          style={{ maxWidth: 320 }}
        />

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1f2937] rounded-xl p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => manager.setStatusFilter(opt.key)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                manager.statusFilter === opt.key
                  ? "bg-white dark:bg-[#0f172a] text-gray-800 dark:text-[#e6edf3] shadow-sm"
                  : "text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button type="primary" icon={<Plus size={14} />} onClick={onAdd}>
          Đăng ký Provider
        </Button>
      </div>

      <ProviderTable
        providers={manager.filtered}
        hasFilter={hasFilter}
        loading={manager.loading}
        onEdit={onEdit}
        onProbe={onProbe}
        onCredentials={onCredentials}
        onDelete={onDelete}
        onSetStatus={(p, s) => manager.setStatus(p.id, s)}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderManagerPage() {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const manager = useProviderManager();

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [probeTarget, setProbeTarget] = useState<Provider | null>(null);
  const [credsTarget, setCredsTarget] = useState<Provider | null>(null);

  async function handleSubmit(form: ProviderForm) {
    if (!drawer) return;
    try {
      if (drawer.mode === "create") await manager.create(form);
      else await manager.update(drawer.target.id, form);
      setDrawer(null);
    } catch {
      message.error(manager.error ?? "Thao tác thất bại");
    }
  }

  function handleDelete(p: Provider) {
    if (
      !confirm(
        `Xóa provider "${p.displayName}"? Hành động này không thể hoàn tác.`,
      )
    )
      return;
    manager.remove(p.id);
  }

  function handleRevoke(p: Provider) {
    manager.setStatus(p.id, "credentials_revoked");
  }

  const tabItems = [
    {
      key: "providers",
      label: "Providers",
      children: (
        <ProvidersTab
          manager={manager}
          onEdit={(p) => setDrawer({ mode: "edit", target: p })}
          onProbe={setProbeTarget}
          onCredentials={setCredsTarget}
          onDelete={handleDelete}
          onAdd={() => setDrawer({ mode: "create" })}
        />
      ),
    },
    {
      key: "operations",
      label: "Operations",
      children: <OperationsTab />,
    },
    {
      key: "credentials",
      label: "Credentials",
      children: (
        <CredentialsTab
          providers={manager.providers}
          onManage={(p) => setCredsTarget(p)}
        />
      ),
    },
  ];

  const headerStats = manager.providers.length > 0
    ? [
        { label: "Providers",   value: manager.providers.length,                                               accent: false },
        { label: "Active",      value: manager.providers.filter((p) => p.status === "active").length,          accent: true  },
        { label: "Issues",      value: manager.providers.filter((p) => p.status !== "active").length,          accent: false },
        { label: "Operations",  value: manager.providers.reduce((acc, p) => acc + p.operations.length, 0),     accent: false },
      ]
    : [];

  return (
    <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header banner */}
      <div style={{
        borderRadius:   token.borderRadiusLG,
        border:         "1px solid rgba(5,150,105,0.2)",
        background:     "linear-gradient(135deg, rgba(5,150,105,0.1) 0%, rgba(5,150,105,0.04) 55%, transparent 100%)",
        padding:        "20px 24px",
        display:        "flex",
        alignItems:     "center",
        gap:            20,
        position:       "relative",
        overflow:       "hidden",
        flexWrap:       "wrap",
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: "absolute", right: -50, top: -50,
          width: 180, height: 180, borderRadius: "50%",
          background: "rgba(5,150,105,0.07)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 80, bottom: -70,
          width: 130, height: 130, borderRadius: "50%",
          background: "rgba(5,150,105,0.04)", pointerEvents: "none",
        }} />

        {/* Icon */}
        <div style={{
          width: 52, height: 52,
          borderRadius:   token.borderRadiusLG,
          background:     "rgba(5,150,105,0.15)",
          border:         "1px solid rgba(5,150,105,0.28)",
          display:        "flex", alignItems: "center", justifyContent: "center",
          flexShrink:     0,
          boxShadow:      "0 0 20px rgba(5,150,105,0.15)",
        }}>
          <Layers size={24} style={{ color: "#34d399" }} />
        </div>

        {/* Title + desc */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <h1 style={{ margin: 0, fontSize: token.fontSizeXL, fontWeight: 700, lineHeight: 1, color: token.colorText }}>
              Quản trị hệ thống
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "2px 8px",
              borderRadius: 6, lineHeight: "18px", userSelect: "none",
              background: "rgba(5,150,105,0.15)", color: "#34d399",
              border: "1px solid rgba(5,150,105,0.25)",
            }}>
              Admin
            </span>
          </div>
          <p style={{ margin: 0, fontSize: token.fontSize, color: token.colorTextSecondary }}>
            Quản lý provider, operation registry và credentials.
          </p>
        </div>

        {/* Inline stats */}
        {headerStats.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
            {headerStats.map((stat) => (
              <div key={stat.label} style={{
                textAlign: "center", padding: "10px 18px",
                borderRadius: token.borderRadius,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${token.colorBorderSecondary}`,
                backdropFilter: "blur(4px)",
              }}>
                <div style={{
                  fontSize: 22, fontWeight: 700, lineHeight: 1,
                  color: stat.accent ? "#34d399" : token.colorText,
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 3 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} />

      {/* Drawer */}
      <ProviderFormDrawer
        open={drawer !== null}
        isEdit={drawer?.mode === "edit"}
        initial={drawer?.mode === "edit" ? toForm(drawer.target) : BLANK_FORM}
        target={drawer?.mode === "edit" ? drawer.target : undefined}
        onSubmit={handleSubmit}
        onClose={() => setDrawer(null)}
      />

      {/* Probe modal */}
      {probeTarget && (
        <ProbeModal
          provider={probeTarget}
          onClose={() => setProbeTarget(null)}
        />
      )}

      {/* Credentials modal */}
      {credsTarget && (
        <CredentialsModal
          provider={credsTarget}
          onRevoke={() => handleRevoke(credsTarget)}
          onClose={() => setCredsTarget(null)}
        />
      )}
    </div>
  );
}
