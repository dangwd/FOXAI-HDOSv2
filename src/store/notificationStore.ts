import { create } from 'zustand';
import type { NotificationPayload } from '@/core/signalr/types';

export interface NotificationItem extends NotificationPayload {
  read: boolean;
  receivedAt: string;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  push: (payload: NotificationPayload) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,

  push(payload) {
    const item: NotificationItem = { ...payload, read: false, receivedAt: new Date().toISOString() };
    set((s) => ({
      items: [item, ...s.items].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAllRead() {
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll() {
    set({ items: [], unreadCount: 0 });
  },
}));
