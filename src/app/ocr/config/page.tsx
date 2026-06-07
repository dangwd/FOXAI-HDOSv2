"use client";

import { useState } from "react";
import { Alert, App, Button, Typography, theme } from "antd";
import { RefreshCw, ScanLine } from "lucide-react";
import { useSchemaData } from "./_hooks/useSchemaData";
import { useSchemaEdit } from "./_hooks/useSchemaEdit";
import { StatsCards }          from "./_components/StatsCards";
import { SchemaToolbar }       from "./_components/SchemaToolbar";
import { SchemaTable }         from "./_components/SchemaTable";
import { CreateSchemaDrawer }  from "./_components/CreateSchemaDrawer";
import { EditSchemaDrawer }    from "./_components/EditSchemaDrawer";

const { Title, Text } = Typography;

function OcrConfigInner() {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const data = useSchemaData();
  const edit = useSchemaEdit();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleEditClick(record: Parameters<typeof edit.open>[0]) {
    try {
      await edit.open(record);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Tải schema thất bại");
    }
  }

  // Inline stats cho banner (hiện khi đã tải xong)
  const headerStats = data.stats
    ? [
        { label: "Schemas", value: data.stats.totalSchemas,  accent: false },
        { label: "Active",  value: data.stats.activeSchemas, accent: true  },
        { label: "Fields",  value: data.stats.totalFields,   accent: false },
      ]
    : [];

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Banner header (violet accent) ────────────────────────────────────── */}
      <div style={{
        borderRadius: token.borderRadiusLG,
        border:       "1px solid rgba(139,92,246,0.2)",
        background:   "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.03) 55%, transparent 100%)",
        padding:      "20px 24px",
        display:      "flex",
        alignItems:   "center",
        gap:          20,
        position:     "relative",
        overflow:     "hidden",
        flexWrap:     "wrap",
      }}>
        {/* Decorative orbs */}
        <div style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(139,92,246,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -70, width: 130, height: 130, borderRadius: "50%", background: "rgba(139,92,246,0.03)", pointerEvents: "none" }} />

        {/* Icon */}
        <div style={{
          width: 52, height: 52,
          borderRadius:   token.borderRadiusLG,
          background:     "rgba(139,92,246,0.12)",
          border:         "1px solid rgba(139,92,246,0.25)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
          boxShadow:      "0 0 20px rgba(139,92,246,0.12)",
        }}>
          <ScanLine size={24} style={{ color: "#8b5cf6" }} />
        </div>

        {/* Title + description */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <Title level={4} style={{ margin: 0, lineHeight: 1 }}>
              Thiết lập chứng từ OCR
            </Title>
            <span style={{
              fontSize:        10,
              fontWeight:      700,
              letterSpacing:   "0.08em",
              textTransform:   "uppercase",
              padding:         "2px 8px",
              borderRadius:    6,
              background:      "rgba(139,92,246,0.12)",
              color:           "#8b5cf6",
              border:          "1px solid rgba(139,92,246,0.22)",
              lineHeight:      "18px",
              userSelect:      "none",
            }}>
              OCR
            </span>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Quản lý schema nhận dạng tài liệu cho hệ thống OCR
          </Text>
        </div>

        {/* Inline stats + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          {headerStats.map((stat) => (
            <div key={stat.label} style={{
              textAlign:      "center",
              padding:        "10px 18px",
              borderRadius:   token.borderRadius,
              background:     "rgba(255,255,255,0.03)",
              border:         `1px solid ${token.colorBorderSecondary}`,
              backdropFilter: "blur(4px)",
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: stat.accent ? "#8b5cf6" : token.colorText }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 3 }}>
                {stat.label}
              </div>
            </div>
          ))}
          <Button
            icon={<RefreshCw size={13} />}
            loading={data.loading || data.statsLoading}
            onClick={data.refresh}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* ── Stats cards chi tiết (4 ô) ───────────────────────────────────────── */}
      <StatsCards stats={data.stats} loading={data.statsLoading} />

      {/* ── Load error ───────────────────────────────────────────────────────── */}
      {data.loadError && (
        <Alert
          type="error"
          showIcon
          message="Không tải được danh sách schema"
          description={data.loadError}
        />
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <SchemaToolbar
        search={data.search}
        filterType={data.filterType}
        filterActive={data.filterActive}
        onSearch={data.setSearch}
        onFilterType={data.setFilterType}
        onFilterActive={data.setFilterActive}
        onCreate={() => setCreateOpen(true)}
      />

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <SchemaTable
        schemas={data.schemas}
        loading={data.loading}
        editLoading={edit.loading}
        onEdit={handleEditClick}
        onDeleted={data.refresh}
      />

      {/* ── Drawers ──────────────────────────────────────────────────────────── */}
      <CreateSchemaDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={data.refresh}
      />
      <EditSchemaDrawer
        schema={edit.schema}
        onClose={edit.close}
        onUpdated={(updated) => {
          edit.update(updated);
          data.patchListItem(updated);
        }}
      />
    </div>
  );
}

export default function OcrConfigPage() {
  return <OcrConfigInner />;
}
