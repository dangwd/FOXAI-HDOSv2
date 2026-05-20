'use client';
import { useEffect, useRef } from 'react';
import { Tabs, Badge, Tag, Spin, Empty, Button, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationItem } from '@/store/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationRecord } from '@/types/notification';

const STATUS_COLOR: Record<string, string> = {
  Sent: '#52c41a',
  Failed: '#ff4d4f',
  Pending: '#faad14',
};

const CHANNEL_ICON: Record<string, string> = {
  Email: '✉',
  SMS: '💬',
  Push: '🔔',
};

function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatAbs(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Realtime item (from SSE store) ───────────────────────────────────────────
function RealtimeItem({ item }: { item: NotificationItem }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-[#21262d] ${!item.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
      <div className="flex items-start gap-2">
        {!item.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
        <div className="min-w-0 flex-1" style={item.read ? { marginLeft: '14px' } : undefined}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
              {CHANNEL_ICON[item.channel] ?? '🔔'} {item.subject}
            </span>
            <span className="text-[10px] text-gray-400 shrink-0">{formatRelative(item.receivedAt)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.body}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Tag color={item.channel === 'Email' ? 'blue' : item.channel === 'SMS' ? 'green' : 'purple'} className="m-0 text-[10px]">{item.channel}</Tag>
            <span className="text-[10px] text-gray-400 truncate">{item.recipient}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History item (from API) ───────────────────────────────────────────────────
function HistoryItem({ item }: { item: NotificationRecord }) {
  const color = STATUS_COLOR[item.status] ?? '#8b949e';
  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">
          {CHANNEL_ICON[item.channel] ?? '🔔'} {item.subject}
        </span>
        <Tag
          color={item.status === 'Sent' ? 'success' : item.status === 'Failed' ? 'error' : 'warning'}
          icon={item.status === 'Sent' ? <CheckCircleOutlined /> : item.status === 'Failed' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
          className="m-0 text-[10px] shrink-0"
        >
          {item.status}
        </Tag>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{item.body}</p>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <Tag color={item.channel === 'Email' ? 'blue' : 'green'} className="m-0 text-[10px]">{item.channel}</Tag>
          <span className="text-[10px] text-gray-400 truncate max-w-[140px]">{item.recipient}</span>
        </div>
        <Tooltip title={item.sentAtUtc ? `Đã gửi: ${formatAbs(item.sentAtUtc)}` : undefined}>
          <span className="text-[10px] text-gray-400 shrink-0" style={{ color }}>
            {formatRelative(item.createdAtUtc)}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, markAllRead, clearAll } = useNotificationStore();
  const { data: history = [], isLoading, isFetching, refetch } = useNotifications(50);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const sentCount = history.filter((n) => n.status === 'Sent').length;
  const failedCount = history.filter((n) => n.status === 'Failed').length;

  const tabItems = [
    {
      key: 'realtime',
      label: (
        <span className="flex items-center gap-1.5">
          Mới nhận
          {unreadCount > 0 && <Badge count={unreadCount} color="#1677ff" overflowCount={99} size="small" />}
        </span>
      ),
      children: (
        <>
          {items.length > 0 && (
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22]">
              <span className="text-[10px] text-gray-400">{items.length} thông báo</span>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button size="small" type="text" icon={<CheckOutlined />} onClick={markAllRead} className="text-[10px] h-6 text-blue-500">
                    Đọc hết
                  </Button>
                )}
                <Button size="small" type="text" icon={<DeleteOutlined />} onClick={clearAll} className="text-[10px] h-6 text-gray-400">
                  Xóa hết
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {items.length === 0
              ? <div className="flex items-center justify-center py-14"><Empty description="Chưa có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
              : items.map((item) => <RealtimeItem key={item.id} item={item} />)
            }
          </div>
        </>
      ),
    },
    {
      key: 'history',
      label: (
        <span className="flex items-center gap-1.5">
          Lịch sử
          <Badge count={history.length} color="#8b949e" overflowCount={99} size="small" />
        </span>
      ),
      children: (
        <>
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#161b22]">
            <div className="flex gap-2 text-[10px] text-gray-400">
              <span className="text-green-600">{sentCount} đã gửi</span>
              {failedCount > 0 && <span className="text-red-500">{failedCount} lỗi</span>}
            </div>
            <Button
              size="small" type="text"
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              className="text-[10px] h-6 text-gray-400"
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {isLoading
              ? <div className="flex items-center justify-center py-14"><Spin /></div>
              : history.length === 0
                ? <div className="flex items-center justify-center py-14"><Empty description="Không có lịch sử" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>
                : history.map((item) => <HistoryItem key={item.id} item={item} />)
            }
          </div>
        </>
      ),
    },
  ];

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-2xl overflow-hidden"
      style={{ width: 420 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#21262d]">
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">Thông báo</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      <Tabs
        items={tabItems}
        size="small"
        className="notification-panel-tabs"
        tabBarStyle={{ padding: '0 16px', margin: 0 }}
      />
    </div>
  );
}
