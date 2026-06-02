"use client";

import { Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import type { FormsModule } from "@/infrastructure/http/adminApi";
import { Inbox } from "lucide-react";

const { Text } = Typography;

const columns: TableColumnsType<FormsModule> = [
  {
    title: "Code",
    dataIndex: "code",
    key: "code",
    width: 200,
    render: (code: string) => <Text code>{code}</Text>,
  },
  {
    title: "Tên module",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    render: (d?: string) =>
      d ? (
        <span className="text-gray-600 dark:text-[#8b949e]">{d}</span>
      ) : (
        <Text type="secondary">—</Text>
      ),
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: string) =>
      status === "active" ? (
        <Tag color="success">Hoạt động</Tag>
      ) : (
        <Tag color="default">Tạm dừng</Tag>
      ),
  },
  {
    title: "Forms",
    dataIndex: "formCount",
    key: "formCount",
    width: 80,
    align: "center" as const,
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAtUtc",
    key: "createdAtUtc",
    width: 150,
    render: (d: string) => new Date(d).toLocaleDateString("vi-VN"),
  },
];

export function ModuleTable({
  modules,
  search,
  loading,
}: {
  modules: FormsModule[];
  search:  string;
  loading?: boolean;
}) {
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
