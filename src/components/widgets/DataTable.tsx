"use client";

import { Table, Tag, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnType } from "antd/es/table";
import { useSSE } from "@/core/sse/useSSE";
import type { SSEConfig } from "@/core/sse/types";

interface ColConfig {
  key: string;
  title: string;
  render?: "tag" | "button";
  tagColors?: Record<string, string>;
  buttonColor?: string;
  /** Text color for all cells in this column */
  color?: string;
  align?: "left" | "right" | "center";
}

interface TableLiveData {
  data: Record<string, unknown>[];
}

interface DataTableProps {
  columns: ColConfig[];
  data: Record<string, unknown>[];
  pageSize?: number;
  loading?: boolean;
  /** Title shown in the top-left of the table card */
  title?: string;
  /** If true, shows an Excel export button (decorative) */
  exportButton?: boolean;
  /** Index of the summary/total row — rendered bold */
  summaryRowIndex?: number;
  /** SSE config — khi có, data live sẽ đè lên props tĩnh */
  sse?: SSEConfig;
}

export function DataTable({
  columns,
  data,
  pageSize = 10,
  loading = false,
  title,
  exportButton = false,
  summaryRowIndex,
  sse,
}: DataTableProps) {
  const { data: live } = useSSE<TableLiveData>(sse);
  const displayData = live?.data ?? data;
  const antColumns: ColumnType<Record<string, unknown>>[] = columns.map((col) => ({
    title: col.title,
    dataIndex: col.key,
    key: col.key,
    align: col.align,
    render: col.render === "tag"
      ? (v: unknown) => {
          const str = String(v);
          const color = col.tagColors?.[str] ?? "default";
          return <Tag color={color}>{str}</Tag>;
        }
      : col.render === "button"
      ? (v: unknown) => (
          <Button
            size="small"
            style={col.buttonColor ? { borderColor: col.buttonColor, color: col.buttonColor } : undefined}
          >
            {String(v)}
          </Button>
        )
      : col.color
      ? (v: unknown, _: unknown, index: number) => (
          <span style={{ color: index === summaryRowIndex ? undefined : col.color, fontWeight: index === summaryRowIndex ? 600 : undefined }}>
            {String(v ?? "")}
          </span>
        )
      : summaryRowIndex !== undefined
      ? (v: unknown, _: unknown, index: number) =>
          index === summaryRowIndex
            ? <span style={{ fontWeight: 600 }}>{String(v ?? "")}</span>
            : String(v ?? "")
      : undefined,
  }));

  const rows = displayData.map((row, i) => ({ ...row, key: i }));

  const header = (title || exportButton) ? (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      {title ? <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span> : <span />}
      {exportButton && (
        <Button size="small" icon={<DownloadOutlined />}>
          Xuất báo cáo (Excel)
        </Button>
      )}
    </div>
  ) : undefined;

  return (
    <Table
      columns={antColumns}
      dataSource={rows}
      pagination={data.length > pageSize ? { pageSize } : false}
      loading={loading}
      title={header ? () => header : undefined}
      bordered
      size="small"
      rowClassName={(_, index) =>
        index === summaryRowIndex ? "font-semibold" : ""
      }
    />
  );
}
