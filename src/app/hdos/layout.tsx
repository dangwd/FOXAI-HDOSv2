'use client';
import { useEffect, Suspense } from 'react';
import { useMenuStore } from '@/store/menuStore';
import Sidebar from '@/components/Layout/Sidebar';

export default function HdosLayout({ children }: { children: React.ReactNode }) {
  const fetchMenu = useMenuStore((s) => s.fetchMenu);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense>
        <Sidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]">{children}</main>
    </div>
  );
}
