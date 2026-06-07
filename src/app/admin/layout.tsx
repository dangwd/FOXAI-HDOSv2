"use client";

import { ocrApi, type OcrSchemaListItem } from "@/infrastructure/http/ocrApi";
import { useThemeStore } from "@/store/themeStore";
import { App, ConfigProvider, Input, theme as antTheme } from "antd";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconSettings() {
  return (
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}

function IconList() {
  return (
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
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconTerminal() {
  return (
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
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconPencil() {
  return (
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconWifi() {
  return (
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
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function IconMenu() {
  return (
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
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconBoxes() {
  return (
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
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
      <path d="m7 16.5-4.74-2.85" />
      <path d="m7 16.5 5-3" />
      <path d="M7 16.5v5.17" />
      <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
      <path d="m17 16.5-5-3" />
      <path d="m17 16.5 4.74-2.85" />
      <path d="M17 16.5v5.17" />
      <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
      <path d="M12 8 7.26 5.15" />
      <path d="m12 8 4.74-2.85" />
      <path d="M12 13.5V8" />
    </svg>
  );
}

function IconDatabase() {
  return (
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

// Icon bảng/view dùng cho Lakehouse Views (doc 44)
function IconTableProperties() {
  return (
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}

function IconBack() {
  return (
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronsLeft() {
  return (
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
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}

function IconChevronsRight() {
  return (
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
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconScan() {
  return (
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
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function IconSun() {
  return (
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
  );
}

function IconMoon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ─── Menu definition ──────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { href: "/admin/modules", label: "Quản lý Module", Icon: IconBoxes },
  { href: "/admin/reports-design", label: "Thiết kế Báo cáo", Icon: IconPencil },
  { href: "/admin/menus", label: "Quản lý Menu BC", Icon: IconMenu },
  { href: "/admin/provider", label: "Quản trị Provider", Icon: IconSettings },
  { href: "/admin/operations", label: "Quản lý Operations", Icon: IconList },
  { href: "/admin/datasources",     label: "Data Matching Sources", Icon: IconDatabase },
  { href: "/admin/lakehouse-views", label: "Lakehouse Views",       Icon: IconTableProperties },
  { href: "/admin/console",         label: "Test Console",           Icon: IconTerminal },
  { href: "/admin/sync", label: "Theo dõi đồng bộ", Icon: IconWifi },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";
  const [ocrSchemas, setOcrSchemas] = useState<OcrSchemaListItem[]>([]);
  const [ocrExpanded, setOcrExpanded] = useState(true);

  useEffect(() => {
    ocrApi
      .listSchemas({ isActive: true })
      .then(setOcrSchemas)
      .catch(() => {});
  }, []);

  const iconBtn =
    "w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors cursor-pointer";

  return (
    <aside
      className={`${collapsed ? "w-14" : "w-60"} transition-[width] duration-200 ease-in-out h-screen bg-[#0f172a] flex flex-col shrink-0 overflow-hidden`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 px-3 py-3.5 border-b border-white/5 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-500/30">
          <IconSettings />
        </div>
        {!collapsed && (
          <>
            <span className="font-bold text-white text-sm whitespace-nowrap">
              HDOS Admin
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={toggle}
                title={isDark ? "Chuyển sang Light" : "Chuyển sang Dark"}
                className={iconBtn}
              >
                {isDark ? <IconSun /> : <IconMoon />}
              </button>
              <button
                onClick={onToggle}
                title={collapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
                className={`${collapsed ? "w-8 h-8" : "ml-auto w-7 h-7"} flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors cursor-pointer`}
              >
                {collapsed ? <IconChevronsRight /> : <IconChevronsLeft />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2 select-none">
            QUẢN TRỊ
          </p>
        )}
        <ul className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");
            const { Icon } = item;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`w-full min-w-0 flex items-center gap-2.5 py-1.5 rounded-lg text-[13px] transition-all
                    ${collapsed ? "justify-center px-0" : "px-2.5"}
                    ${
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    }`}
                >
                  <span className={`shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                    <Icon />
                  </span>
                  {!collapsed && <span className="truncate min-w-0">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mt-4 mb-2 select-none">
            XỬ LÝ TÀI LIỆU
          </p>
        )}
        {collapsed && (
          <div className="my-2 border-t border-white/5" />
        )}
        <ul className="space-y-0.5">
          {/* Static: config page */}
          <li>
            <Link
              href="/ocr/config"
              title={collapsed ? "Thiết lập Chứng từ OCR" : undefined}
              className={`w-full min-w-0 flex items-center gap-2.5 py-1.5 rounded-lg text-[13px] transition-all
                ${collapsed ? "justify-center px-0" : "px-2.5"}
                ${
                  pathname === "/ocr/config"
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
            >
              <span className={`shrink-0 transition-colors ${pathname === "/ocr/config" ? "text-emerald-400" : "text-slate-500"}`}>
                <IconBoxes />
              </span>
              {!collapsed && <span className="truncate min-w-0">Thiết lập Chứng từ OCR</span>}
            </Link>
          </li>

          {/* Collapsible OCR schemas — full list when expanded */}
          {!collapsed && ocrSchemas.length > 0 && (
            <li>
              <button
                onClick={() => setOcrExpanded((v) => !v)}
                className="w-full min-w-0 flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all text-slate-400 hover:bg-white/5 hover:text-slate-100 cursor-pointer"
              >
                <span className="text-slate-500 shrink-0">
                  <IconScan />
                </span>
                <span className="flex-1 text-left truncate min-w-0">Nhận dạng OCR</span>
                <span className="text-slate-500 shrink-0">
                  <IconChevron open={ocrExpanded} />
                </span>
              </button>
              {ocrExpanded && (
                <ul className="mt-0.5 space-y-0.5">
                  {ocrSchemas.map((schema) => {
                    const href = `/ocr/process?schema=${schema.id}`;
                    const isActive =
                      pathname === "/ocr/process" &&
                      searchParams.get("schema") === schema.id;
                    return (
                      <li key={schema.id}>
                        <Link
                          href={href}
                          className={`w-full min-w-0 flex items-center gap-2 pl-8 pr-2.5 py-1.5 rounded-lg text-[13px] transition-all
                            ${
                              isActive
                                ? "bg-white/10 text-white font-medium"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                            }`}
                        >
                          <span className={`shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                            <IconScan />
                          </span>
                          <span className="flex-1 truncate min-w-0">{schema.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}

          {/* Icon-only OCR entry when collapsed */}
          {collapsed && ocrSchemas.length > 0 && (
            <li>
              <Link
                href={`/ocr/process?schema=${ocrSchemas[0].id}`}
                title="Nhận dạng OCR"
                className={`w-full flex items-center justify-center py-2 rounded-lg text-sm transition-all
                  ${pathname === "/ocr/process" ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-100"}`}
              >
                <IconScan />
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer: collapse toggle + theme/back when collapsed */}
      <div
        className={`border-t border-white/5 p-2 flex ${collapsed ? "flex-col items-center gap-1" : "items-center"}`}
      >
        {collapsed && (
          <>
            <button
              onClick={toggle}
              title={isDark ? "Chuyển sang Light" : "Chuyển sang Dark"}
              className={iconBtn}
            >
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
            <button
              onClick={onToggle}
              title={collapsed ? "Mở rộng menu" : "Thu nhỏ menu"}
              className={`${collapsed ? "w-8 h-8" : "ml-auto w-7 h-7"} flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors cursor-pointer`}
            >
              {collapsed ? <IconChevronsRight /> : <IconChevronsLeft />}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function AdminTopBar() {
  return (
    <header className="h-14 shrink-0 bg-white dark:bg-[#0a0f1a] border-b border-gray-100 dark:border-[#1f2937] flex items-center px-5 gap-4">
      <div className="flex-1 max-w-lg">
        <Input
          prefix={<SearchIcon />}
          placeholder="Tìm module, widget, config..."
          variant="filled"
          style={{ borderRadius: 12 }}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Link
          href="/client"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1f2937] hover:bg-gray-200 dark:hover:bg-[#2d3748] border border-gray-100 dark:border-[#1f2937] transition-colors"
          title="Màn hình chính HDOS"
        >
          <IconBack />
          Màn hình chính
        </Link>
        <div className="w-px h-6 bg-gray-100 dark:bg-[#1f2937] mx-1" />
        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useThemeStore();
  const dk = theme === "dark";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: dk ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          // ── Primary → emerald-600 ─────────────────────────────────────────
          colorPrimary:       "#059669",
          colorPrimaryHover:  "#047857",
          colorPrimaryActive: "#065f46",

          // ── Background ────────────────────────────────────────────────────
          colorBgContainer:   dk ? "#0f172a" : "#ffffff",
          colorBgElevated:    dk ? "#0f172a" : "#ffffff",
          colorBgSpotlight:   dk ? "#1f2937" : "#f3f4f6",
          colorFillAlter:     dk ? "#0a0f1a" : "#f9fafb",
          colorFillSecondary: dk ? "#1f2937" : "#f5f5f5",
          colorFillTertiary:  dk ? "#0f172a" : "#f9fafb",

          // ── Border ────────────────────────────────────────────────────────
          colorBorder:          dk ? "#1f2937" : "#e5e7eb",
          colorBorderSecondary: dk ? "#1f2937" : "#f0f0f0",
          colorSplit:           dk ? "#1f2937" : "#f0f0f0",

          // ── Text ──────────────────────────────────────────────────────────
          colorText:           dk ? "#f1f5f9" : "#111827",
          colorTextSecondary:  dk ? "#94a3b8" : "#6b7280",
          colorTextTertiary:   dk ? "#64748b" : "#9ca3af",
          colorTextQuaternary: dk ? "#374151" : "#d1d5db",

          // ── Shape & type ──────────────────────────────────────────────────
          borderRadius:   10,
          borderRadiusLG: 14,
          borderRadiusSM: 8,
          borderRadiusXS: 6,
          fontSize:   13,
          fontSizeSM: 11,
          fontSizeLG: 14,
        },
        components: {
          Table: {
            headerBg:         dk ? "#1f2937" : "#f8fafc",
            headerColor:      dk ? "#cbd5e1" : "#374151",
            headerSplitColor: dk ? "#1f2937" : "#e2e8f0",
            rowHoverBg:       dk ? "#1f2937" : "rgba(5,150,105,0.04)",
            borderColor:      dk ? "#1f2937" : "#e2e8f0",
            cellPaddingBlock:  8,
            cellPaddingInline: 12,
          },
          Drawer: {
            colorBgElevated: dk ? "#0f172a" : "#ffffff",
            colorSplit:      dk ? "#1f2937" : "#f0f0f0",
          },
          Modal: {
            contentBg: dk ? "#0f172a" : "#ffffff",
            headerBg:  dk ? "#0f172a" : "#ffffff",
            colorSplit: dk ? "#1f2937" : "#f0f0f0",
          },
          Tabs: {
            itemActiveColor:      "#059669",
            itemSelectedColor:    "#059669",
            inkBarColor:          "#059669",
            itemColor:            dk ? "#94a3b8" : "#6b7280",
            itemHoverColor:       dk ? "#f1f5f9" : "#111827",
            colorBorderSecondary: dk ? "#1f2937" : "#f0f0f0",
          },
          Input: {
            colorBgContainer:  dk ? "#0a0f1a" : "#ffffff",
            activeBorderColor: "#059669",
            hoverBorderColor:  "#34d399",
          },
          Select: {
            colorBgContainer: dk ? "#0a0f1a" : "#ffffff",
            optionSelectedBg: dk ? "#064e3b" : "#ecfdf5",
            optionActiveBg:   dk ? "#1f2937" : "#f0fdf4",
          },
          InputNumber: {
            colorBgContainer:  dk ? "#0a0f1a" : "#ffffff",
            activeBorderColor: "#059669",
            hoverBorderColor:  "#34d399",
          },
          Button: {
            colorPrimaryBg: "#059669",
          },
          Alert: {
            colorInfoBg:    dk ? "rgba(5,150,105,.1)" : "rgba(5,150,105,.06)",
            colorWarningBg: dk ? "rgba(250,140,22,.1)" : "rgba(250,140,22,.08)",
            colorErrorBg:   dk ? "rgba(255,77,79,.1)"  : "rgba(255,77,79,.08)",
          },
          Tag: {
            borderRadiusSM: 8,
          },
          Tooltip: {
            colorBgSpotlight:    "#1e293b",
            colorTextLightSolid: "#f1f5f9",
          },
        },
      }}
    >
      {/*
       * class="dark" động theo theme:
       *  - dark mode  → class "dark" có mặt → Tailwind dark: variants apply
       *  - light mode → không có class "dark" → Tailwind mặc định (light)
       * Background cũng adaptive theo theme.
       */}
      <div className={`${dk ? "dark" : ""} flex h-screen overflow-hidden ${dk ? "bg-[#060c18]" : "bg-[#f0f2f5]"}`}>
        <Suspense fallback={null}>
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((c) => !c)}
          />
        </Suspense>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AdminTopBar />
          <App className="flex-1 min-h-0 flex flex-col">
            <main className="flex-1 overflow-y-auto admin-main">
              {children}
            </main>
          </App>
        </div>
      </div>
    </ConfigProvider>
  );
}
