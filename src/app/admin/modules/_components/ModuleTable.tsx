"use client";

import Link from "next/link";
import { Table, Button, Tag, Typography, Space } from "antd";
import type { TableColumnsType } from "antd";
import type { FormsModule } from "@/infrastructure/http/adminApi";
import { Inbox, LayoutDashboard } from "lucide-react";
import { ModuleIcon } from "./ModuleIcon";

const { Text } = Typography;

// ─── Color palette keyed by code hash ─────────────────────────────────────────

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

// ─── Table ────────────────────────────────────────────────────────────────────

export function ModuleTable({
  modules,
  search,
  loading,
}: {
  modules:  FormsModule[];
  search:   string;
  loading?: boolean;
}) {
  const columns: TableColumnsType<FormsModule> = [
    {
      title: "Module",
      key: "module",
      render: (_, row) => {
        const color    = codeColor(row.code);
        const isActive = row.status.toLowerCase() === "active";
        return (
          <div className="flex items-center gap-3">
            <ModuleIcon icon={codeAbbr(row.code)} groupColor={color} iconSize={15} boxSize={34} />
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold m-0 truncate leading-tight ${
                  isActive
                    ? "text-gray-800 dark:text-[#e6edf3]"
                    : "text-gray-400 dark:text-[#484f58]"
                }`}
              >
                {row.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Text code className="!text-[10px]">{row.code}</Text>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (d?: string) =>
        d ? (
          <span className="text-sm text-gray-500 dark:text-[#8b949e] line-clamp-1">{d}</span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_, row) => (
        <Tag
          style={
            row.status.toLowerCase() === "active"
              ? { color: "#0ca678", background: "rgba(12,166,120,.12)", border: "none", fontWeight: 600 }
              : { color: "#8b949e", background: "rgba(139,148,158,.12)", border: "none", fontWeight: 600 }
          }
        >
          {row.status.toLowerCase() === "active" ? "● Hoạt động" : "○ Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "Forms",
      dataIndex: "formCount",
      key: "formCount",
      width: 70,
      align: "center" as const,
      render: (count: number) => (
        <Tag style={{ fontWeight: 600, minWidth: 28, textAlign: "center" }}>{count}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 110,
      align: "right" as const,
      render: (_, row) => (
        <Space size={4}>
          <Link href={`/admin?slug=${row.code}`}>
            <Button size="small" icon={<LayoutDashboard size={12} />}>
              Canvas
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <Table<FormsModule>
      columns={columns}
      dataSource={modules}
      rowKey="id"
      size="small"
      loading={loading}
      pagination={false}
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
