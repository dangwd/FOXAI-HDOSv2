'use client';
import { useEffect, Suspense } from 'react';
import { useMenuStore } from '@/store/menuStore';
import Sidebar from '@/components/Layout/Sidebar';
import TopBar from '@/components/Layout/TopBar';
import { NotificationHubProvider } from '@/core/signalr/NotificationHubProvider';

export default function HdosLayout({ children }: { children: React.ReactNode }) {
  const fetchMenu = useMenuStore((s) => s.fetchMenu);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return (
    <div className="flex h-screen overflow-hidden">
      <NotificationHubProvider />
      <Suspense>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Suspense>
          <TopBar />
        </Suspense>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]">{children}</main>
      </div>
    </div>
  );
}
