import { create } from 'zustand';
import type { MenuGroup } from '@/types/menu';
import useAuthStore from '@/core/auth/authStore';

interface MenuStore {
  groups: MenuGroup[];
  loading: boolean;
  fetchMenu: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set) => ({
  groups: [],
  loading: false,

  fetchMenu: async () => {
    set({ loading: true });
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const res = await fetch('/api/menu', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      set({ groups: data.groups });
    } finally {
      set({ loading: false });
    }
  },
}));
