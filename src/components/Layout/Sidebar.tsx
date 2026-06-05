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
  const indent = depth > 0 ? "pl-8" : "pl-3";

  return (
    <>
      <li>
        <button
          onClick={() => router.push(href)}
          className={`w-full min-w-0 flex items-center gap-2.5 ${indent} pr-3 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
            ${isActive
              ? "bg-white/10 text-white font-medium"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
        >
          <span className={`shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
            <MenuIcon name={node.icon ?? ""} />
          </span>
          <span className="flex-1 text-left truncate min-w-0">{node.name}</span>
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
    <aside className="w-60 h-screen bg-[#0f172a] flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/5">
        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">HDOS</span>
        <span className="text-[9px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded-md font-semibold tracking-wide">
          v2.0
        </span>
        <button
          onClick={toggle}
          title={isDark ? "Chuyển sang Light" : "Chuyển sang Dark"}
          className="ml-auto w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors cursor-pointer"
        >
          {isDark ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Spin size="small" style={{ filter: "brightness(0) invert(1) opacity(0.3)" }} />
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id}>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5 select-none">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = isMenuItemActive(item);
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => router.push(item.href ?? `/client?module=${item.id}`)}
                        className={`w-full min-w-0 flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all cursor-pointer
                          ${isActive
                            ? "bg-white/10 text-white font-medium"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                          }`}
                      >
                        <span className={`shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                          <MenuIcon name={item.icon} />
                        </span>
                        <span className="flex-1 text-left truncate min-w-0">{item.label}</span>
                        {item.badge && <span className="shrink-0"><MenuBadgeChip badge={item.badge} /></span>}
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
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5 select-none">
            Báo cáo
          </p>
          {reportsLoading ? (
            <div className="flex justify-center py-3">
              <Spin size="small" style={{ filter: "brightness(0) invert(1) opacity(0.3)" }} />
            </div>
          ) : reportMenus.length === 0 ? (
            <p className="text-[11px] text-slate-600 px-2 py-1">
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
      <div className="px-3 pb-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-1.5 py-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-300 truncate m-0 leading-tight">Healthcare OS</p>
            <p className="text-[10px] text-slate-600 truncate m-0 leading-tight">Quản lý bệnh viện số</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
