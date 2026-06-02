"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Table, Switch, Button, Space, Tag, Typography, Popconfirm } from "antd";
import type { TableColumnsType } from "antd";
import type { AdminModule, ModuleGroupRecord } from "@/infrastructure/http/adminApi";
import { Inbox, LayoutDashboard } from "lucide-react";
import { ROLE_META } from "../_lib/constants";
import { ModuleIcon } from "./ModuleIcon";

const { Text } = Typography;

// ─── Flat row types for grouped antd Table ────────────────────────────────────

type GroupRow = { _kind: "group"; id: string; groupId: string; label: string; color: string; count: number };
type ItemRow  = { _kind: "item" } & AdminModule;
type FlatRow  = GroupRow | ItemRow;

function buildRows(
  groups: ModuleGroupRecord[],
  grouped: Map<string, AdminModule[]>,
  groupColor: (slug: string) => string,
): FlatRow[] {
  const rows: FlatRow[] = [];
  const knownSlugs = new Set(groups.map((g) => g.slug));

  for (const g of groups) {
    const items = (grouped.get(g.slug) ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    if (!items.length) continue;
    rows.push({ _kind: "group", id: `__${g.slug}`, groupId: g.id, label: g.label, color: groupColor(g.slug), count: items.length });
    items.forEach((m) => rows.push({ _kind: "item", ...m }));
  }

  // orphaned modules whose groupSlug doesn't match any known group
  const orphans: AdminModule[] = [];
  for (const [slug, items] of grouped) {
    if (!knownSlugs.has(slug) && slug !== "") orphans.push(...items);
  }
  if (orphans.length) {
    rows.push({ _kind: "group", id: "__orphan", groupId: "", label: "Không phân nhóm", color: "#6b7280", count: orphans.length });
    orphans.sort((a, b) => a.sortOrder - b.sortOrder).forEach((m) => rows.push({ _kind: "item", ...m }));
  }

  return rows;
}

const NCOLS = 5;

// ─── Table ────────────────────────────────────────────────────────────────────

export function ModuleTable({
  groups,
  grouped,
  groupColor,
  search,
  onEdit,
  onDelete,
  onToggle,
}: {
  groups:     ModuleGroupRecord[];
  grouped:    Map<string, AdminModule[]>;
  groupColor: (id: string) => string;
  search:     string;
  onEdit:     (m: AdminModule) => void;
  onDelete:   (m: AdminModule) => void;
  onToggle:   (id: string) => void;
}) {
  const rows = useMemo(() => buildRows(groups, grouped, groupColor), [groups, grouped, groupColor]);

  const columns: TableColumnsType<FlatRow> = [
    {
      title: "Module",
      key: "module",
      onCell: (row) =>
        row._kind === "group" ? { colSpan: NCOLS, style: { padding: 0 } } : {},
      render: (_, row) => {
        if (row._kind === "group") {
          return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0d1117]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: row.color }}>
                {row.label}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-[#6e7681]">· {row.count} module</span>
            </div>
          );
        }
        const isActive = row.isActive ?? true;
        const color = groupColor(row.groupSlug);
        return (
          <div className="flex items-center gap-3">
            <ModuleIcon icon={row.icon} groupColor={color} iconSize={15} boxSize={34} />
            <div className="min-w-0">
              <p className={`text-sm font-semibold m-0 truncate leading-tight ${isActive ? "text-gray-800 dark:text-[#e6edf3]" : "text-gray-400 dark:text-[#484f58]"}`}>
                {row.label}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Text code className="!text-[10px]">{row.slug}</Text>
                {row.isVisible === false && (
                  <Tag className="!text-[9px] !px-1 !m-0 !leading-none !py-0.5">ẩn</Tag>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Nhóm",
      key: "group",
      width: 130,
      onCell: (row) => (row._kind === "group" ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row._kind === "group") return null;
        const g = groups.find((gr) => gr.slug === row.groupSlug);
        const color = groupColor(row.groupSlug);
        return g ? (
          <Tag style={{ color, background: `${color}1a`, border: "none", fontWeight: 600 }}>
            {g.label}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Phân quyền",
      key: "roles",
      width: 170,
      onCell: (row) => (row._kind === "group" ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row._kind === "group") return null;
        if (!row.requiredRoles?.length) return <Text type="secondary">—</Text>;
        return (
          <div className="flex gap-1 flex-wrap">
            {row.requiredRoles.map((r) => {
              const meta = ROLE_META[r];
              return meta ? (
                <Tag key={r} style={{ color: meta.color, background: meta.bg, border: "none", fontWeight: 600 }}>
                  {meta.label}
                </Tag>
              ) : (
                <Tag key={r}>{r}</Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Active",
      key: "active",
      width: 70,
      align: "center" as const,
      onCell: (row) => (row._kind === "group" ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row._kind === "group") return null;
        return (
          <Switch
            size="small"
            checked={row.isActive ?? true}
            onChange={() => onToggle(row.id)}
          />
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 170,
      align: "right" as const,
      onCell: (row) => (row._kind === "group" ? { colSpan: 0 } : {}),
      render: (_, row) => {
        if (row._kind === "group") return null;
        return (
          <Space size={4}>
            <Link href={`/admin?slug=${row.slug}`}>
              <Button size="small" icon={<LayoutDashboard size={12} />}>Canvas</Button>
            </Link>
            <Button size="small" onClick={() => onEdit(row)}>Sửa</Button>
            <Popconfirm
              title={`Xóa module "${row.label}"?`}
              description="Hành động này không thể hoàn tác."
              onConfirm={() => onDelete(row)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger>Xóa</Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<FlatRow>
      columns={columns}
      dataSource={rows}
      rowKey="id"
      size="small"
      pagination={false}
      onRow={(row) => ({
        style: row._kind === "group" ? { cursor: "default" } : {},
      })}
      locale={{
        emptyText: (
          <div className="flex flex-col items-center py-14 gap-2 text-gray-400">
            <Inbox size={36} className="text-gray-300 dark:text-[#30363d]" />
            <p className="text-sm m-0 text-gray-500">
              {search.trim() ? "Không tìm thấy module nào" : "Chưa có module nào"}
            </p>
            {!search.trim() && (
              <p className="text-xs m-0">Bấm &ldquo;+ Tạo Module mới&rdquo; để bắt đầu</p>
            )}
          </div>
        ),
      }}
      showSorterTooltip={false}
    />
  );
}
