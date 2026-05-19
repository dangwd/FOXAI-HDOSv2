import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  toggle: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: next });
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('hdos-theme', next);
  },
}));
