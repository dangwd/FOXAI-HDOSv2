'use client';
import { useSearchParams } from 'next/navigation';
import { useMenuStore } from '@/store/menuStore';

export default function TopBar() {
  const searchParams = useSearchParams();
  const activeId = searchParams.get('module') ?? 'dashboard';
  const groups = useMenuStore((s) => s.groups);

  let currentLabel = 'Dashboard';
  for (const group of groups) {
    for (const item of group.items) {
      if (item.id === activeId) { currentLabel = item.label; break; }
    }
  }

  const today = new Date();
  const monthStr = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <header className="h-11 flex-shrink-0 bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] flex items-center px-5 gap-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#8b949e]">
        <span className="hover:text-gray-700 dark:hover:text-[#e6edf3] cursor-pointer transition-colors">
          Trang chủ
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-[#30363d]">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 dark:text-[#e6edf3] font-medium">{currentLabel}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Date chip */}
        <span className="text-xs px-3 py-1 rounded-md bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-[#8b949e] capitalize select-none">
          {monthStr}
        </span>

        {/* Notification bell */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Settings */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-[#30363d] mx-0.5" />

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer select-none">
          A
        </div>
      </div>
    </header>
  );
}
