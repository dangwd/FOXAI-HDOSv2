"use client";

import { useThemeStore } from "@/store/themeStore";
import { ocrApi, type OcrSchemaListItem } from "@/infrastructure/http/ocrApi";
import { App, ConfigProvider } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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

function IconForms() {
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
      <path d="M3 9h18" />
      <path d="M9 21V9" />
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
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
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
  { href: "/admin", label: "Thiết kế Báo cáo", Icon: IconPencil },
  { href: "/admin/menus", label: "Quản lý Menu BC", Icon: IconMenu },
  { href: "/admin/provider", label: "Quản trị Provider", Icon: IconSettings },
  { href: "/admin/operations", label: "Quản lý Operations", Icon: IconList },
  { href: "/admin/console", label: "Test Console", Icon: IconTerminal },
  { href: "/admin/sync", label: "Theo dõi đồng bộ", Icon: IconWifi },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";
  const [ocrSchemas, setOcrSchemas] = useState<OcrSchemaListItem[]>([]);
  const [ocrExpanded, setOcrExpanded] = useState(true);

  useEffect(() => {
    ocrApi.listSchemas({ isActive: true }).then(setOcrSchemas).catch(() => {});
  }, []);

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#0d1117] border-r border-gray-200 dark:border-[#30363d] flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 dark:border-[#30363d]">
        <div className="w-7 h-7 rounded bg-violet-600 flex items-center justify-center text-white">
          <IconSettings />
        </div>
        <span className="font-bold text-gray-800 dark:text-[#e6edf3] text-sm">
          HDOS Admin
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggle}
            title={isDark ? "Chuyển sang Light" : "Chuyển sang Dark"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
          <Link
            href="/client"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:text-[#8b949e] dark:hover:text-[#e6edf3] hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
            title="Quay lại HDOS"
          >
            <IconBack />
          </Link>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-wider px-2 mb-2">
          QUẢN TRỊ
        </p>
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      isActive
                        ? "bg-violet-50 dark:bg-[#2d2542] text-violet-600 dark:text-violet-400 font-medium"
                        : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3]"
                    }`}
                >
                  <span
                    className={
                      isActive
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-400 dark:text-[#8b949e]"
                    }
                  >
                    <Icon />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-[10px] font-semibold text-gray-400 dark:text-[#8b949e] uppercase tracking-wider px-2 mt-4 mb-2">
          XỬ LÝ TÀI LIỆU
        </p>
        <ul className="space-y-0.5">
          {/* Static: config page */}
          <li>
            <Link
              href="/ocr/config"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                ${
                  pathname === "/ocr/config"
                    ? "bg-violet-50 dark:bg-[#2d2542] text-violet-600 dark:text-violet-400 font-medium"
                    : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3]"
                }`}
            >
              <span className={pathname === "/ocr/config" ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-[#8b949e]"}>
                <IconBoxes />
              </span>
              Thiết lập Chứng từ OCR
            </Link>
          </li>

          {/* Collapsible: Nhận dạng OCR with dynamic schema children */}
          {ocrSchemas.length > 0 && (
            <li>
              <button
                onClick={() => setOcrExpanded((v) => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3] cursor-pointer"
              >
                <span className="text-gray-400 dark:text-[#8b949e]">
                  <IconScan />
                </span>
                <span className="flex-1 text-left">Nhận dạng OCR</span>
                <span className="text-gray-400 dark:text-[#8b949e]">
                  <IconChevron open={ocrExpanded} />
                </span>
              </button>
              {ocrExpanded && (
                <ul className="mt-0.5 space-y-0.5">
                  {ocrSchemas.map((schema) => {
                    const href = `/ocr/process?schema=${schema.id}`;
                    const isActive = pathname === "/ocr/process" && searchParams.get("schema") === schema.id;
                    return (
                      <li key={schema.id}>
                        <Link
                          href={href}
                          className={`w-full flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-lg text-sm transition-colors
                            ${
                              isActive
                                ? "bg-violet-50 dark:bg-[#2d2542] text-violet-600 dark:text-violet-400 font-medium"
                                : "text-gray-600 dark:text-[#8b949e] hover:bg-gray-50 dark:hover:bg-[#21262d] hover:text-gray-900 dark:hover:text-[#e6edf3]"
                            }`}
                        >
                          <span className="text-gray-400 dark:text-[#8b949e]">
                            <IconScan />
                          </span>
                          <span className="flex-1 truncate">{schema.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function AdminTopBar() {
  return (
    <header className="h-14 shrink-0 bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] flex items-center px-5 gap-4">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-[#8b949e]">
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm module, widget, config..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-[#21262d] border border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-[#161b22] outline-none text-gray-700 dark:text-[#e6edf3] placeholder-gray-400 dark:placeholder-[#8b949e] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* <button className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-[#8b949e] hover:bg-gray-200 dark:hover:bg-[#30363d] transition-colors">
          Xem trước
        </button>
        <button className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors font-medium">
          Lưu thay đổi
        </button> */}
        <div className="w-px h-6 bg-gray-200 dark:bg-[#30363d] mx-1" />
        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
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

  return (
    <ConfigProvider
      theme={{
        token: {
          // ── Primary → violet-600 (matches bg-violet-600 across admin) ──────
          colorPrimary: "#7c3aed",
          colorPrimaryHover: "#6d28d9",
          colorPrimaryActive: "#5b21b6",

          // ── Background tokens ─────────────────────────────────────────────
          colorBgContainer: dk ? "#161b22" : "#ffffff", // inputs, table body, cards
          colorBgElevated: dk ? "#161b22" : "#ffffff", // modals, drawers, dropdowns
          colorBgSpotlight: dk ? "#21262d" : "#f3f4f6",
          colorFillAlter: dk ? "#0d1117" : "#f9fafb", // table header stripe
          colorFillSecondary: dk ? "#21262d" : "#f5f5f5",
          colorFillTertiary: dk ? "#161b22" : "#f9fafb",

          // ── Border tokens ─────────────────────────────────────────────────
          colorBorder: dk ? "#30363d" : "#e5e7eb", // inputs, cards
          colorBorderSecondary: dk ? "#21262d" : "#f0f0f0", // subtle dividers
          colorSplit: dk ? "#21262d" : "#f0f0f0",

          // ── Text tokens ───────────────────────────────────────────────────
          colorText: dk ? "#e6edf3" : "#111827",
          colorTextSecondary: dk ? "#8b949e" : "#6b7280",
          colorTextTertiary: dk ? "#484f58" : "#9ca3af",
          colorTextQuaternary: dk ? "#30363d" : "#d1d5db",

          // ── Shape & type ──────────────────────────────────────────────────
          borderRadius: 8,
          borderRadiusLG: 10,
          borderRadiusSM: 6,
          borderRadiusXS: 4,
          fontSize: 13,
          fontSizeSM: 11,
          fontSizeLG: 14,
        },
        components: {
          Table: {
            // header sáng hơn body để tạo hierarchy, không hoà vào page background
            headerBg: dk ? "#1c2128" : "#f0f2f5",
            headerColor: dk ? "#cdd3de" : "#374151",
            headerSplitColor: dk ? "#30363d" : "#d1d5db",
            // row
            rowHoverBg: dk ? "#21262d" : "rgba(124,58,237,0.04)",
            // border rõ hơn
            borderColor: dk ? "#30363d" : "#e2e8f0",
            cellPaddingBlock: 8,
            cellPaddingInline: 12,
          },
          Drawer: {
            colorBgElevated: dk ? "#161b22" : "#ffffff",
            colorSplit: dk ? "#21262d" : "#f0f0f0",
          },
          Modal: {
            contentBg: dk ? "#161b22" : "#ffffff",
            headerBg: dk ? "#161b22" : "#ffffff",
            colorSplit: dk ? "#21262d" : "#f0f0f0",
          },
          Tabs: {
            itemActiveColor: "#7c3aed",
            itemSelectedColor: "#7c3aed",
            inkBarColor: "#7c3aed",
            itemColor: dk ? "#8b949e" : "#6b7280",
            itemHoverColor: dk ? "#e6edf3" : "#111827",
            colorBorderSecondary: dk ? "#21262d" : "#f0f0f0",
          },
          Input: {
            colorBgContainer: dk ? "#0d1117" : "#ffffff",
            activeBorderColor: "#7c3aed",
            hoverBorderColor: "#a78bfa",
          },
          Select: {
            colorBgContainer: dk ? "#0d1117" : "#ffffff",
            optionSelectedBg: dk ? "#2d2542" : "#f3f0ff",
            optionActiveBg: dk ? "#21262d" : "#f5f5f5",
          },
          InputNumber: {
            colorBgContainer: dk ? "#0d1117" : "#ffffff",
            activeBorderColor: "#7c3aed",
            hoverBorderColor: "#a78bfa",
          },
          Button: {
            colorPrimaryBg: "#7c3aed",
          },
          Alert: {
            colorInfoBg: dk ? "rgba(22,119,255,.1)" : "rgba(22,119,255,.08)",
            colorWarningBg: dk ? "rgba(250,140,22,.1)" : "rgba(250,140,22,.08)",
            colorErrorBg: dk ? "rgba(255,77,79,.1)" : "rgba(255,77,79,.08)",
          },
          Tag: {
            borderRadiusSM: 6,
          },
        },
      }}
    >
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#010409]">
        <AdminSidebar />
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
