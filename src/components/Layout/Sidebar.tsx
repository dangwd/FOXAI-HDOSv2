"use client";
import useAuthStore from "@/core/auth/authStore";
import { useMenuStore } from "@/store/menuStore";
import { useThemeStore } from "@/store/themeStore";
import { Spin } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import MenuBadgeChip from "./MenuBadgeChip";
import MenuIcon from "./MenuIcon";

export default function Sidebar() {
  const groups = useMenuStore((s) => s.groups);
  const loading = useMenuStore((s) => s.loading);
  const { theme, toggle } = useThemeStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("module") ?? "dashboard";
  const isDark = theme === "dark";
  const user = useAuthStore((s) => s.user);
  const avatarLetter =
    user?.name?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    "U";

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#0d1117] border-r border-gray-200 dark:border-[#30363d] flex flex-col flex-shrink-0">
      {/* Logo + theme toggle */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100 dark:border-[#30363d]">
        <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          H
        </div>
        <span className="font-bold text-gray-800 dark:text-[#e6edf3] text-base">
          HDOS
        </span>
        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-[#21262d] dark:text-[#8b949e] px-1.5 py-0.5 rounded">
          v2.0
        </span>
        <button
          onClick={toggle}
          title={isDark ? "Chuyển sang Light" : "Chuyển sang Dark"}
          className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors cursor-pointer"
        >
          {isDark ? (
            /* Sun icon */
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
          ) : (
            /* Moon icon */
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Spin size="small" />
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => router.push(`/hdos?module=${item.id}`)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                            ${
                              isActive
                                ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium"
                                : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3]"
                            }`}
                        >
                          <span
                            className={
                              isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-400 dark:text-[#8b949e]"
                            }
                          >
                            <MenuIcon name={item.icon} />
                          </span>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && <MenuBadgeChip badge={item.badge} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* User at bottom */}
      {/* <div className="px-3 py-3 border-t border-gray-200 dark:border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 dark:text-[#e6edf3] truncate m-0">{user?.name ?? 'Người dùng'}</p>
            <p className="text-[10px] text-gray-400 dark:text-[#8b949e] m-0">Admin</p>
          </div>
        </div>
      </div> */}
    </aside>
  );
}
