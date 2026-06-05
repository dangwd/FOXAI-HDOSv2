'use client';
import { useMemo } from 'react';
import { Tabs, Badge, Tag, Spin, Empty, Alert, Tooltip, Button } from 'antd';
import {
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationRecord } from '@/types/notification';
import { cn } from '@/shared/utils/cn';

const STATUS_COLOR: Record<string, string> = {
  Sent: 'success',
  Failed: 'error',
  Pending: 'warning',
};

const CHANNEL_COLOR: Record<string, string> = {
  Email: 'blue',
  SMS: 'green',
  Push: 'purple',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationItem({ item }: { item: NotificationRecord }) {
  const statusColor = STATUS_COLOR[item.status] ?? 'default';
  const channelColor = CHANNEL_COLOR[item.channel] ?? 'default';

  return (
    <div
      className={cn(
        'flex flex-col gap-1 px-4 py-3 border-b border-gray-100 dark:border-gray-800',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MailOutlined className="text-emerald-500 shrink-0" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {item.subject}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tag color={channelColor} className="m-0 text-xs">{item.channel}</Tag>
          <Tag
            color={statusColor}
            icon={
              item.status === 'Sent' ? <CheckCircleOutlined /> :
              item.status === 'Failed' ? <CloseCircleOutlined /> :
              <ClockCircleOutlined />
            }
            className="m-0 text-xs"
          >
            {item.status}
          </Tag>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 pl-5">
        {item.body}
      </p>

      <div className="flex items-center justify-between pl-5 mt-0.5">
        <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
          {item.recipient}
        </span>
        <Tooltip title={item.sentAtUtc ? `Đã gửi: ${formatDate(item.sentAtUtc)}` : 'Chưa gửi'}>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {formatDate(item.createdAtUtc)}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

function NotificationList({ items }: { items: NotificationRecord[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Empty description="Không có thông báo" />
      </div>
    );
  }
  return (
    <div className="overflow-y-auto max-h-[520px]">
      {items.map((item) => (
        <NotificationItem key={item.id} item={item} />
      ))}
    </div>
  );
}

interface Props {
  take?: number;
}

export function NotificationCenter({ take = 50 }: Props) {
  const { data, isLoading, isError, error, refetch, isFetching } = useNotifications(take);

  const { all, sent, failed, other } = useMemo(() => {
    const list = data ?? [];
    return {
      all: list,
      sent: list.filter((n) => n.status === 'Sent'),
      failed: list.filter((n) => n.status === 'Failed'),
      other: list.filter((n) => n.status !== 'Sent' && n.status !== 'Failed'),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        title="Không thể tải thông báo"
        description={(error as Error)?.message}
        action={
          <Button size="small" onClick={() => refetch()}>
            Thử lại
          </Button>
        }
      />
    );
  }

  const tabItems = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-1.5">
          Tất cả
          <Badge count={all.length} color="#059669" overflowCount={99} />
        </span>
      ),
      children: <NotificationList items={all} />,
    },
    {
      key: 'sent',
      label: (
        <span className="flex items-center gap-1.5">
          Đã gửi
          <Badge count={sent.length} color="#52c41a" overflowCount={99} />
        </span>
      ),
      children: <NotificationList items={sent} />,
    },
    ...(failed.length > 0
      ? [
          {
            key: 'failed',
            label: (
              <span className="flex items-center gap-1.5">
                Lỗi
                <Badge count={failed.length} color="#ff4d4f" overflowCount={99} />
              </span>
            ),
            children: <NotificationList items={failed} />,
          },
        ]
      : []),
    ...(other.length > 0
      ? [
          {
            key: 'other',
            label: (
              <span className="flex items-center gap-1.5">
                Đang xử lý
                <Badge count={other.length} color="#faad14" overflowCount={99} />
              </span>
            ),
            children: <NotificationList items={other} />,
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-0">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 m-0">
          Trung tâm thông báo
        </h3>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined spin={isFetching} />}
          onClick={() => refetch()}
          className="text-gray-400 hover:text-gray-600"
        />
      </div>
      <Tabs
        items={tabItems}
        size="small"
        className="notification-center-tabs px-2"
      />
    </div>
  );
}
