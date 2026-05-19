'use client';

import { useEffect } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useThemeStore } from '@/store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggle: _toggle } = useThemeStore();

  // Khởi tạo theme từ localStorage khi mount
  useEffect(() => {
    const saved = localStorage.getItem('hdos-theme') as 'light' | 'dark' | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = saved ?? preferred;
    useThemeStore.setState({ theme: initial });
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
}
