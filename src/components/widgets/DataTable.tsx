"use client";

import { Table, Tag } from "antd";
import type { ColumnType } from "antd/es/table";

interface ColConfig {
  key: string;
  title: string;
  /** "tag" renders value as colored antd Tag */
  render?: "tag";
  tagColors?: Record<string, string>;
}

interface DataTableProps {
  columns: ColConfig[];
  data: Record<string, unknown>[];
  pageSize?: number;
}

export function DataTable({ columns, data, pageSize = 10 }: DataTableProps) {
  const antColumns: ColumnType<Record<string, unknown>>[] = columns.map((col) => ({
    title: col.title,
    dataIndex: col.key,
    key: col.key,
    render: col.render === "tag"
      ? (v: unknown) => {
          const str = String(v);
          const color = col.tagColors?.[str] ?? "default";
          return <Tag color={color}>{str}</Tag>;
        }
      : undefined,
  }));

  const rows = data.map((row, i) => ({ ...row, key: i }));

  return <Table columns={antColumns} dataSource={rows} pagination={{ pageSize }} />;
}
