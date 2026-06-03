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
      const token = useAuthStore.getState().accessToken;
      const res = await fetch('/api/menu', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json() as { groups: MenuGroup[] };
      set({ groups: data.groups });
    } finally {
      set({ loading: false });
    }
  },
}));
