"use client";
import { useMenuStore } from "@/store/menuStore";
import { useReportStore, type ReportMenuNode } from "@/store/reportStore";
import { useThemeStore } from "@/store/themeStore";
import { Spin } from "antd";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MenuBadgeChip from "./MenuBadgeChip";
import MenuIcon from "./MenuIcon";

function ReportNavItem({
  node,
  pathname,
  router,
  depth = 0,
}: {
  node: ReportMenuNode;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  depth?: number;
}) {
  const href = `/client/reports/${node.slug}`;
  const isActive = pathname === href;
  const indent = depth > 0 ? "pl-7" : "pl-3";

  return (
    <>
      <li>
        <button
          onClick={() => router.push(href)}
          className={`w-full flex items-center gap-2.5 ${indent} pr-3 py-2 rounded-xl text-sm transition-all cursor-pointer
            ${isActive
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium"
              : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#1f2937] hover:text-gray-900 dark:hover:text-[#e6edf3]"
            }`}
        >
          <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-[#8b949e]"}>
            <MenuIcon name={node.icon ?? ""} />
          </span>
          <span className="flex-1 text-left truncate">{node.name}</span>
        </button>
      </li>
      {node.children.map((child) => (
        <ReportNavItem key={child.id} node={child} pathname={pathname} router={router} depth={depth + 1} />
      ))}
    </>
  );
}

export default function Sidebar() {
  const groups  = useMenuStore((s) => s.groups);
  const loading = useMenuStore((s) => s.loading);
  const reportMenus    = useReportStore((s) => s.menus);
  const reportsLoading = useReportStore((s) => s.loading);
  const fetchReports   = useReportStore((s) => s.fetch);
  const { theme, toggle } = useThemeStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeModule = searchParams.get("module") ?? "dashboard";
  const activeScreen = searchParams.get("screen");
  const isDark = theme === "dark";

  function isMenuItemActive(item: import("@/types/menu").MenuItem): boolean {
    if (!item.href) return activeModule === item.id;
    try {
      const url = new URL(item.href, "http://x");
      const m = url.searchParams.get("module");
      const s = url.searchParams.get("screen");
      if (m && m !== activeModule) return false;
      if (s && activeScreen && s !== activeScreen) return false;
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#0a0f1a] border-r border-gray-100 dark:border-[#1f2937] flex flex-col shrink-0">
      {/* Logo + theme toggle */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 dark:border-[#1f2937]">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
            <rect x="7" y="7" width="10" height="10" rx="2" fill="white" fillOpacity="0.15" stroke="none" />
          </svg>
        </div>
        <span className="font-bold text-gray-800 dark:text-[#e6edf3] text-base tracking-tight">HDOS</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-medium">
          v2.0
        </span>
        <button
          onClick={toggle}
          title={isDark ? "Chuyển sang Light" : "Chuyển sang Dark"}
          className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#1f2937] transition-colors cursor-pointer"
        >
          {isDark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Spin size="small" />
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-widest px-2 mb-2">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isMenuItemActive(item);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => router.push(item.href ?? `/client?module=${item.id}`)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all cursor-pointer
                          ${isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium"
                            : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#1f2937] hover:text-gray-900 dark:hover:text-[#e6edf3]"
                          }`}
                      >
                        <span className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-[#8b949e]"}>
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
          ))
        )}

        {/* Reports */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-widest px-2 mb-2">
            Báo cáo
          </p>
          {reportsLoading ? (
            <div className="flex justify-center py-3">
              <Spin size="small" />
            </div>
          ) : reportMenus.length === 0 ? (
            <p className="text-[11px] text-gray-400 dark:text-[#8b949e] px-3 py-1">
              Chưa có báo cáo
            </p>
          ) : (
            <ul className="space-y-0.5">
              {reportMenus.map((node) => (
                <ReportNavItem key={node.id} node={node} pathname={pathname} router={router} />
              ))}
            </ul>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100 dark:border-[#1f2937]">
        <div className="bg-gray-50 dark:bg-[#1f2937] rounded-xl px-3 py-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-[#e6edf3]">Healthcare OS</span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-[#8b949e] m-0 leading-snug">
            Hệ thống quản lý bệnh viện số
          </p>
        </div>
      </div>
    </aside>
  );
}
