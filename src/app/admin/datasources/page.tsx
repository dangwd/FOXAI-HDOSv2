"use client";

import { Button, Input, Space, Tabs, Typography, theme } from "antd";
import { Database, FileSearch, Plus, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { IngestJsonDrawer } from "./_components/IngestJsonDrawer";
import { ProfileDrawer } from "./_components/ProfileDrawer";
import { RecordsPanel } from "./_components/RecordsPanel";
import { SourceProfileTable } from "./_components/SourceProfileTable";
import { useSourceProfiles } from "./_hooks/useSourceProfiles";
import type { ProfileFormValues, SourceProfile } from "./_lib/types";

const { Title, Text } = Typography;

// ─── System filter chips ──────────────────────────────────────────────────────
// Dùng theme.useToken() — tự adaptive light/dark

function SystemFilter({
  systems,
  active,
  onChange,
}: {
  systems:  string[];
  active:   string | null;
  onChange: (s: string | null) => void;
}) {
  const { token } = theme.useToken();

  if (systems.length < 2) return null;

  return (
    <div style={{
      display:      "flex",
      alignItems:   "center",
      gap:          4,
      background:   token.colorFillSecondary,
      borderRadius: token.borderRadiusLG,
      padding:      4,
    }}>
      {/* "Tất cả" chip */}
      <button
        onClick={() => onChange(null)}
        style={{
          padding:      "4px 12px",
          fontSize:     11,
          fontWeight:   600,
          borderRadius: token.borderRadiusSM,
          border:       "none",
          cursor:       "pointer",
          transition:   "all .15s",
          whiteSpace:   "nowrap",
          background:   !active ? token.colorBgElevated : "transparent",
          color:        !active ? token.colorText        : token.colorTextSecondary,
          boxShadow:    !active ? token.boxShadowTertiary : "none",
        }}
      >
        Tất cả
      </button>

      {systems.map((sys) => (
        <button
          key={sys}
          onClick={() => onChange(sys === active ? null : sys)}
          style={{
            padding:      "4px 12px",
            fontSize:     11,
            fontWeight:   600,
            borderRadius: token.borderRadiusSM,
            border:       "none",
            cursor:       "pointer",
            transition:   "all .15s",
            whiteSpace:   "nowrap",
            fontFamily:   "monospace",
            background:   active === sys ? token.colorBgElevated    : "transparent",
            color:        active === sys ? token.colorSuccessActive  : token.colorTextSecondary,
            boxShadow:    active === sys ? token.boxShadowTertiary   : "none",
          }}
        >
          {sys}
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataMatchingSourcesPage() {
  const { token } = theme.useToken();
  const manager = useSourceProfiles();

  const [drawerTarget,  setDrawerTarget]  = useState<SourceProfile | "create" | null>(null);
  const [ingestTarget,  setIngestTarget]  = useState<SourceProfile | null>(null);
  const isEditing = drawerTarget !== null && drawerTarget !== "create";

  async function handleSave(values: ProfileFormValues) {
    if (isEditing) {
      await manager.update((drawerTarget as SourceProfile).id, values);
    } else {
      await manager.create(values);
    }
  }

  const hasFilter = !!manager.search.trim() || !!manager.systemFilter;

  const headerStats = manager.profiles.length > 0
    ? [
        { label: "Profiles",      value: manager.profiles.length, accent: false },
        { label: "Nguồn",         value: new Set(manager.profiles.map((p) => p.sourceSystem)).size, accent: false },
        { label: "Loại tài liệu", value: new Set(manager.profiles.map((p) => p.recordType)).size, accent: false },
        { label: "Mappings",      value: manager.profiles.reduce((acc, p) => acc + Object.keys(p.mappings).length, 0), accent: true },
      ]
    : [];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

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
          position:     "absolute", right: -50, top: -50,
          width:        180, height: 180,
          borderRadius: "50%",
          background:   "rgba(5,150,105,0.07)",
          pointerEvents: "none",
        }} />
        <div style={{
          position:     "absolute", right: 80, bottom: -70,
          width:        130, height: 130,
          borderRadius: "50%",
          background:   "rgba(5,150,105,0.04)",
          pointerEvents: "none",
        }} />

        {/* Icon */}
        <div style={{
          width:          52,
          height:         52,
          borderRadius:   token.borderRadiusLG,
          background:     "rgba(5,150,105,0.15)",
          border:         "1px solid rgba(5,150,105,0.28)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
          boxShadow:      "0 0 20px rgba(5,150,105,0.15)",
        }}>
          <Database size={24} style={{ color: "#34d399" }} />
        </div>

        {/* Title + desc */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <Title level={4} style={{ margin: 0, lineHeight: 1 }}>
              Data Matching
            </Title>
            <span style={{
              fontSize:        10,
              fontWeight:      700,
              letterSpacing:   "0.08em",
              textTransform:   "uppercase",
              padding:         "2px 8px",
              borderRadius:    6,
              background:      "rgba(5,150,105,0.15)",
              color:           "#34d399",
              border:          "1px solid rgba(5,150,105,0.25)",
              lineHeight:      "18px",
              userSelect:      "none",
            }}>
              Admin
            </span>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Quản lý source profiles và tra cứu records đã match từ các nguồn dữ liệu.
          </Text>
        </div>

        {/* Inline stats */}
        {headerStats.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
            {headerStats.map((stat) => (
              <div key={stat.label} style={{
                textAlign:    "center",
                padding:      "10px 18px",
                borderRadius: token.borderRadius,
                background:   "rgba(255,255,255,0.03)",
                border:       `1px solid ${token.colorBorderSecondary}`,
                backdropFilter: "blur(4px)",
              }}>
                <div style={{
                  fontSize:   22,
                  fontWeight: 700,
                  lineHeight: 1,
                  color:      stat.accent ? "#34d399" : token.colorText,
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
      <Tabs
        defaultActiveKey="profiles"
        items={[
          {
            key:   "profiles",
            label: (
              <Space size={6}>
                <Database size={13} />
                Source Profiles
              </Space>
            ),
            children: (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Toolbar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <Input
                      prefix={<Search size={14} style={{ color: token.colorTextTertiary }} />}
                      placeholder="Tìm theo nguồn, loại tài liệu, tên, business key…"
                      value={manager.search}
                      onChange={(e) => manager.setSearch(e.target.value)}
                      allowClear
                      style={{ maxWidth: 360 }}
                    />
                    <SystemFilter
                      systems={manager.allSystems}
                      active={manager.systemFilter}
                      onChange={manager.setSystemFilter}
                    />
                  </div>
                  <Space>
                    <Button icon={<RefreshCw size={14} />} onClick={manager.reload} loading={manager.loading}>
                      Làm mới
                    </Button>
                    <Button type="primary" icon={<Plus size={14} />} onClick={() => setDrawerTarget("create")}>
                      Thêm Source Profile
                    </Button>
                  </Space>
                </div>

                {/* Table */}
                <SourceProfileTable
                  profiles={manager.filtered}
                  hasFilter={hasFilter}
                  loading={manager.loading}
                  onEdit={(p) => setDrawerTarget(p)}
                  onDelete={(p) => manager.remove(p.id)}
                  onIngest={(p) => setIngestTarget(p)}
                />
              </div>
            ),
          },
          {
            key:   "records",
            label: (
              <Space size={6}>
                <FileSearch size={13} />
                Records
              </Space>
            ),
            children: <RecordsPanel profiles={manager.profiles} />,
          },
        ]}
      />

      {/* Ingest JSON Drawer */}
      <IngestJsonDrawer
        open={ingestTarget !== null}
        profile={ingestTarget}
        onClose={() => setIngestTarget(null)}
      />

      {/* Create / Edit Drawer */}
      <ProfileDrawer
        open={drawerTarget !== null}
        editing={isEditing ? (drawerTarget as SourceProfile) : null}
        saving={manager.saving}
        onClose={() => setDrawerTarget(null)}
        onSave={handleSave}
      />
    </div>
  );
}
