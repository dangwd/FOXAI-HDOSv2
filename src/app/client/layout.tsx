'use client';
import { useEffect, Suspense } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { useThemeStore } from '@/store/themeStore';
import Sidebar from '@/components/Layout/Sidebar';
import TopBar from '@/components/Layout/TopBar';
import { NotificationHubProvider } from '@/core/sse/NotificationHubProvider';
import { App, ConfigProvider, theme as antTheme } from 'antd';

export default function HdosLayout({ children }: { children: React.ReactNode }) {
  const fetchMenu = useMenuStore((s) => s.fetchMenu);
  const { theme } = useThemeStore();
  const dk = theme === 'dark';

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return (
    <ConfigProvider
      theme={{
        algorithm: dk ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#059669',
          colorBgContainer: dk ? '#0f172a' : '#ffffff',
          colorBorder: dk ? '#1f2937' : '#e5e7eb',
          borderRadius: 8,
          borderRadiusLG: 12,
        },
        components: {
          Button: { primaryColor: '#ffffff' },
        },
      }}
    >
      <App>
        <div className="flex h-screen overflow-hidden">
          <NotificationHubProvider />
          <Suspense>
            <Sidebar />
          </Suspense>
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Suspense>
              <TopBar />
            </Suspense>
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#060c18]">{children}</main>
          </div>
        </div>
      </App>
    </ConfigProvider>
  );
}
