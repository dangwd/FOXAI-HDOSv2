"use client";

import { useState } from "react";
import { App, Tabs, Button, Input, Table, Tag } from "antd";
import { Search, Plus, Key } from "lucide-react";
import type { Provider, ProviderStatus } from "./_lib/types";
import { BLANK_FORM, type ProviderForm } from "./_lib/types";
import { STATUS_META, STATUS_ORDER, providerColor } from "./_lib/constants";
import { useProviderManager, type StatusFilter } from "./_hooks/useProviderManager";
import { ProviderTable }       from "./_components/ProviderTable";
import { ProviderFormDrawer }  from "./_components/ProviderFormDrawer";
import { ProbeModal }          from "./_components/ProbeModal";
import { CredentialsModal }    from "./_components/CredentialsModal";
import { OperationsTab }       from "./_components/OperationsTab";

// ─── Drawer state ─────────────────────────────────────────────────────────────

type DrawerState = { mode: "create" } | { mode: "edit"; target: Provider };

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

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ providers }: { providers: Provider[] }) {
  const counts = STATUS_ORDER.reduce<Record<ProviderStatus, number>>(
    (acc, s) => ({ ...acc, [s]: providers.filter((p) => p.status === s).length }),
    {} as Record<ProviderStatus, number>,
  );
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {STATUS_ORDER.map((s) => {
        const meta = STATUS_META[s];
        const n = counts[s];
        if (!n) return null;
        return (
          <Tag key={s} style={{ color: meta.color, background: meta.bg, border: "none", fontWeight: 600 }}>
            {n} {meta.label}
          </Tag>
        );
      })}
    </div>
  );
}

// ─── Credentials tab (simple list) ───────────────────────────────────────────

function CredentialsTab({
  providers,
  onManage,
}: {
  providers: Provider[];
  onManage:  (p: Provider) => void;
}) {
  return (
    <Table
      dataSource={providers}
      rowKey="id"
      size="small"
      pagination={false}
      columns={[
        {
          title: "Provider",
          key: "provider",
          render: (_, p) => {
            const color = providerColor(p.providerId);
            const initials = p.providerId.split("-").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
            return (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: color }}
                >{initials}</div>
                <div>
                  <div className="font-semibold text-sm">{p.displayName}</div>
                  <code className="text-[10px] text-gray-400">{p.providerId}</code>
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
            <Button size="small" icon={<Key size={12} />} onClick={() => onManage(p)}>Quản lý</Button>
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
  manager:       ReturnType<typeof useProviderManager>;
  onEdit:        (p: Provider) => void;
  onProbe:       (p: Provider) => void;
  onCredentials: (p: Provider) => void;
  onDelete:      (p: Provider) => void;
  onAdd:         () => void;
})
 {
  const hasFilter = !!manager.search.trim() || manager.statusFilter !== "all";

  const statusOptions = [
    { key: "all" as StatusFilter, label: "Tất cả" },
    ...STATUS_ORDER.map((s) => ({ key: s as StatusFilter, label: STATUS_META[s].label })),
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
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#21262d] rounded-xl p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => manager.setStatusFilter(opt.key)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                manager.statusFilter === opt.key
                  ? "bg-white dark:bg-[#161b22] text-gray-800 dark:text-[#e6edf3] shadow-sm"
                  : "text-gray-500 dark:text-[#8b949e] hover:text-gray-700 dark:hover:text-[#e6edf3]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={onAdd}
        >
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
  const { message } = App.useApp();
  const manager = useProviderManager();

  const [drawer,      setDrawer]      = useState<DrawerState | null>(null);
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
    if (!confirm(`Xóa provider "${p.displayName}"? Hành động này không thể hoàn tác.`)) return;
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

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#e6edf3] m-0">Quản trị hệ thống</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-sm text-gray-500 dark:text-[#8b949e] m-0">
              Quản lý provider, operation registry và credentials.
            </p>
            <StatsBar providers={manager.providers} />
          </div>
        </div>
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
        <ProbeModal provider={probeTarget} onClose={() => setProbeTarget(null)} />
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
