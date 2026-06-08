"use client";

// Trang quản lý ViewBinding — đăng ký PostgreSQL view ↔ SourceProfile (doc 44).
// Pattern: mirror của datasources/page.tsx — header banner + toolbar + table + drawer.

import { Button, Input, Space, Typography, theme } from "antd";
import { Plus, RefreshCw, Search, TableProperties } from "lucide-react";
import { useState } from "react";
import { ViewBindingDrawer } from "./_components/ViewBindingDrawer";
import { ViewBindingTable } from "./_components/ViewBindingTable";
import { ViewRecordsDrawer } from "./_components/ViewRecordsDrawer";
import { useViewBindings } from "./_hooks/useViewBindings";
import type { ViewBinding, ViewBindingFormValues } from "./_lib/types";

const { Title, Text } = Typography;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LakehouseViewsPage() {
  const { token } = theme.useToken();
  const manager = useViewBindings();

  const [drawerTarget, setDrawerTarget] = useState<
    ViewBinding | "create" | null
  >(null);
  const isEditing = drawerTarget !== null && drawerTarget !== "create";

  const [recordsTarget, setRecordsTarget] = useState<ViewBinding | null>(null);

  async function handleSave(values: ViewBindingFormValues) {
    if (isEditing) {
      await manager.update((drawerTarget as ViewBinding).id, values);
    } else {
      await manager.create(values);
    }
  }

  const hasFilter = !!manager.search.trim();

  // Thống kê hiển thị trong banner header
  const headerStats =
    manager.bindings.length > 0
      ? [
          {
            label: "Bindings",
            value: manager.bindings.length,
            accent: false,
          },
          {
            label: "Active",
            value: manager.bindings.filter((b) => b.isActive).length,
            accent: true,
          },
          {
            label: "Nguồn",
            value: new Set(manager.bindings.map((b) => b.sourceSystem)).size,
            accent: false,
          },
        ]
      : [];

  return (
    <div
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Page header banner — màu accent cyan/teal để phân biệt với Data Matching (emerald) */}
      <div
        style={{
          borderRadius: token.borderRadiusLG,
          border: "1px solid rgba(56,189,248,0.2)",
          background:
            "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.03) 55%, transparent 100%)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          position: "relative",
          overflow: "hidden",
          flexWrap: "wrap",
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: "absolute",
            right: -50,
            top: -50,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(56,189,248,0.06)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: -70,
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "rgba(56,189,248,0.03)",
            pointerEvents: "none",
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: token.borderRadiusLG,
            background: "rgba(56,189,248,0.12)",
            border: "1px solid rgba(56,189,248,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 20px rgba(56,189,248,0.12)",
          }}
        >
          <TableProperties size={24} style={{ color: "#38bdf8" }} />
        </div>

        {/* Title + desc */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 5,
            }}
          >
            <Title level={4} style={{ margin: 0, lineHeight: 1 }}>
              Lakehouse Views
            </Title>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "2px 8px",
                borderRadius: 6,
                background: "rgba(56,189,248,0.12)",
                color: "#38bdf8",
                border: "1px solid rgba(56,189,248,0.22)",
                lineHeight: "18px",
                userSelect: "none",
              }}
            >
              Admin
            </span>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Đăng ký PostgreSQL view ↔ SourceProfile để WarehousePollerWorker tự
            động ingest qua unified pipeline.
          </Text>
        </div>

        {/* Inline stats */}
        {headerStats.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexShrink: 0,
              flexWrap: "wrap",
            }}
          >
            {headerStats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  textAlign: "center",
                  padding: "10px 18px",
                  borderRadius: token.borderRadius,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${token.colorBorderSecondary}`,
                  backdropFilter: "blur(4px)",
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: stat.accent ? "#38bdf8" : token.colorText,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: token.colorTextTertiary,
                    marginTop: 3,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Input
          prefix={
            <Search size={14} style={{ color: token.colorTextTertiary }} />
          }
          placeholder="Tìm theo view name, source system, record type…"
          value={manager.search}
          onChange={(e) => manager.setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 380 }}
        />
        <Space>
          <Button
            icon={<RefreshCw size={14} />}
            onClick={manager.reload}
            loading={manager.loading}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setDrawerTarget("create")}
          >
            Thêm Binding
          </Button>
        </Space>
      </div>

      {/* Table */}
      <ViewBindingTable
        bindings={manager.filtered}
        hasFilter={hasFilter}
        loading={manager.loading}
        syncing={manager.syncing}
        onEdit={(b) => setDrawerTarget(b)}
        onDelete={(b) => manager.remove(b.id)}
        onSync={(b) => manager.triggerSync(b.id)}
        onViewRecords={(b) => setRecordsTarget(b)}
      />

      {/* Create / Edit Drawer */}
      <ViewBindingDrawer
        open={drawerTarget !== null}
        editing={isEditing ? (drawerTarget as ViewBinding) : null}
        saving={manager.saving}
        onClose={() => setDrawerTarget(null)}
        onSave={handleSave}
      />

      {/* View Records Drawer */}
      <ViewRecordsDrawer
        open={recordsTarget !== null}
        binding={recordsTarget}
        onClose={() => setRecordsTarget(null)}
      />
    </div>
  );
}
