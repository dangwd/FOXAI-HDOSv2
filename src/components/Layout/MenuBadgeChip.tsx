'use client';
import { Badge, Tag } from 'antd';
import type { MenuBadge } from '@/types/menu';

export default function MenuBadgeChip({ badge }: { badge: MenuBadge }) {
  if (badge.type === 'count') {
    return (
      <Badge
        count={badge.value as number}
        style={{ backgroundColor: '#ef4444', fontSize: 10, minWidth: 18, height: 18, lineHeight: '18px' }}
      />
    );
  }
  if (badge.type === 'live') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>
    );
  }
  if (badge.type === 'new') {
    return (
      <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
        New
      </Tag>
    );
  }
  if (badge.type === 'tag') {
    return (
      <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
        {badge.value}
      </Tag>
    );
  }
  return null;
}
