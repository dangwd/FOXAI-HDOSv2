"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin } from "antd";
import {
  ArrowLeft, BarChart2, LineChart, PieChart, Table2, TrendingUp, Type,
  type LucideProps,
} from "lucide-react";
import type React from "react";
import { getAdminToken } from "@/infrastructure/http/httpForProvider";
import type { MenuDetail, ScreenDetail, ScreenSummary, WidgetDef } from "@/types/report";
import { WidgetPreview } from "@/app/admin/menus/_components/WidgetPreview";
import type { DesignerWidget } from "@/app/admin/menus/_lib/types";

// ─── Widget meta ──────────────────────────────────────────────────────────────

type LucideComp = React.ComponentType<LucideProps>;

const WIDGET_META: Record<string, { Icon: LucideComp; color: string; label: string }> = {
  kpi:   { Icon: TrendingUp, color: "#7c3aed", label: "KPI"        },
  line:  { Icon: LineChart,  color: "#3b82f6", label: "Line Chart"  },
  bar:   { Icon: BarChart2,  color: "#10b981", label: "Bar Chart"   },
  pie:   { Icon: PieChart,   color: "#f59e0b", label: "Pie Chart"   },
  table: { Icon: Table2,     color: "#6b7280", label: "Table"       },
  text:  { Icon: Type,       color: "#ec4899", label: "Text"        },
};

function toDesignerWidget(wd: WidgetDef): DesignerWidget {
  return {
    id:         wd.id,
    type:       wd.widgetType as DesignerWidget["type"],
    title:      wd.title,
    span:       wd.colSpan,
    color:      wd.color ?? "#7c3aed",
    ds:         wd.dataSource,
    xField:     wd.config.xField as string | undefined,
    yField:     wd.config.yField as string | undefined,
    valField:   wd.config.valField as string | undefined,
    catField:   wd.config.catField as string | undefined,
    trendField: wd.config.trendField as string | undefined,
    cols:       wd.config.cols as string[] | undefined,
  };
}

// ─── Refresh badge ────────────────────────────────────────────────────────────

function RefreshBadge({ mode, intervalS }: { mode: string; intervalS: number | null }) {
  if (mode === "sse")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live SSE
      </span>
    );
  if (mode === "timer")
    return <span className="text-[11px] font-semibold text-amber-500">⏱ {intervalS}s</span>;
  return null;
}

// ─── Read-only widget card ────────────────────────────────────────────────────

function ViewerWidgetCard({ widget }: { widget: WidgetDef }) {
  const dw   = toDesignerWidget(widget);
  const meta = WIDGET_META[widget.widgetType] ?? WIDGET_META.text;

  return (
    <div style={{ gridColumn: `span ${widget.colSpan}` }} className="min-w-0">
      <div className="flex flex-col rounded-xl border border-gray-100 dark:border-[#21262d] bg-white dark:bg-[#161b22] hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-sm transition-all overflow-hidden">

        {/* Preview area — fixed height, clipped */}
        <div className="relative h-36 overflow-hidden shrink-0">
          <WidgetPreview widget={dw} />
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-t border-gray-50 dark:border-[#21262d] shrink-0"
          style={{ borderTopColor: meta.color + "22" }}
        >
          <span
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
            style={{ background: meta.color + "18", color: meta.color }}
          >
            <meta.Icon size={8} strokeWidth={2} />
            {meta.label}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-gray-700 dark:text-[#c9d1d9] truncate m-0 leading-tight">
              {widget.title}
            </p>
            {widget.dataSource && (
              <p className="text-[9px] text-gray-400 dark:text-[#484f58] truncate m-0 font-mono leading-tight">
                {widget.dataSource}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SK = "animate-pulse bg-gray-200 dark:bg-[#30363d] rounded";

function CanvasSkeleton() {
  return (
    <div className="grid gap-4 p-6" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
      {[6, 3, 3, 4, 4, 4, 12].map((span, i) => (
        <div key={i} className={`${SK} h-48`} style={{ gridColumn: `span ${span}` }} />
      ))}
    </div>
  );
}

// ─── Screen canvas ────────────────────────────────────────────────────────────

function ScreenCanvas({ detail }: { detail: ScreenDetail }) {
  const sorted = [...detail.widgets].sort((a, b) => a.sortOrder - b.sortOrder);
  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-[#484f58] text-sm">
        Màn hình này chưa có widget nào.
      </div>
    );
  }
  return (
    <div className="grid gap-4 p-6" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
      {sorted.map((w) => <ViewerWidgetCard key={w.id} widget={w} />)}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type MenuState =
  | { kind: "loading" }
  | { kind: "ok"; detail: MenuDetail }
  | { kind: "error"; message: string };

type ScreenState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; detail: ScreenDetail }
  | { kind: "error"; message: string };

export default function ReportViewerPage() {
  const { slug }  = useParams<{ slug: string }>();
  const router    = useRouter();
  const [menuState,   setMenuState]   = useState<MenuState>({ kind: "loading" });
  const [screenState, setScreenState] = useState<ScreenState>({ kind: "idle" });
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch menu detail ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setMenuState({ kind: "loading" });
      try {
        const token = await getAdminToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/v1/reports/menus/${slug}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const detail = (await res.json()) as MenuDetail;
        if (!cancelled) {
          setMenuState({ kind: "ok", detail });
          const first = detail.screens.sort((a, b) => a.sortOrder - b.sortOrder)[0];
          if (first) setActiveId(first.id);
        }
      } catch (err) {
        if (!cancelled) setMenuState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Fetch screen detail ────────────────────────────────────────────────────
  const loadScreen = useCallback(async (screenId: string) => {
    setScreenState({ kind: "loading" });
    try {
      const token = await getAdminToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/v1/reports/menus/${slug}/screens/${screenId}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const detail = (await res.json()) as ScreenDetail;
      setScreenState({ kind: "ok", detail });
    } catch (err) {
      setScreenState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }, [slug]);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      setScreenState({ kind: "loading" });
      try {
        const token = await getAdminToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/v1/reports/menus/${slug}/screens/${activeId}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const detail = (await res.json()) as ScreenDetail;
        setScreenState({ kind: "ok", detail });
      } catch (err) {
        setScreenState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      }
    })();
  }, [activeId, slug]);

  // ── Auto-refresh (timer mode) ──────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (screenState.kind !== "ok") return;
    const { refreshMode, refreshIntervalS, screenId } = screenState.detail;
    if (refreshMode !== "timer" || !refreshIntervalS) return;
    timerRef.current = setInterval(() => loadScreen(screenId), refreshIntervalS * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screenState, loadScreen]);

  // ── Loading / error ────────────────────────────────────────────────────────
  if (menuState.kind === "loading") {
    return (
      <div className="flex flex-col h-full">
        <div className="h-12 bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] flex items-center px-4">
          <div className={`${SK} h-4 w-36`} />
        </div>
        <CanvasSkeleton />
      </div>
    );
  }

  if (menuState.kind === "error") {
    return (
      <div className="p-8 text-sm">
        <code className="text-red-400">{menuState.message}</code>
      </div>
    );
  }

  const { detail: menu } = menuState;
  const screens: ScreenSummary[] = [...menu.screens].sort((a, b) => a.sortOrder - b.sortOrder);

  const activeScreen = screens.find((s) => s.id === activeId) ?? screens[0] ?? null;
  const currentDetail = screenState.kind === "ok" ? screenState.detail : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="h-12 bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] flex items-center px-4 gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#8b949e] hover:text-gray-800 dark:hover:text-[#e6edf3] transition-colors"
        >
          <ArrowLeft size={14} />
          Quay lại
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-[#30363d]" />

        <span className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] truncate">
          {menu.name}
        </span>

        {activeScreen && (
          <>
            <span className="text-gray-300 dark:text-[#30363d]">/</span>
            <span className="text-sm text-gray-500 dark:text-[#8b949e] truncate">
              {activeScreen.name}
            </span>
          </>
        )}

        <div className="flex-1" />

        {currentDetail && (
          <RefreshBadge mode={currentDetail.refreshMode} intervalS={currentDetail.refreshIntervalS} />
        )}

        {screenState.kind === "loading" && <Spin size="small" />}
      </div>

      {/* ── Screen tabs ───────────────────────────────────────────────────── */}
      {screens.length > 1 && (
        <div className="bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-[#30363d] flex items-end gap-0 px-4 shrink-0 overflow-x-auto">
          {screens.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-gray-500 dark:text-[#8b949e] hover:text-gray-800 dark:hover:text-[#e6edf3] hover:border-gray-300 dark:hover:border-[#484f58]"
                }`}
              >
                <span>{s.icon ?? "📊"}</span>
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]">
        {screenState.kind === "loading" && <CanvasSkeleton />}
        {screenState.kind === "error" && (
          <div className="p-8 text-sm">
            <code className="text-red-400">{screenState.message}</code>
          </div>
        )}
        {screenState.kind === "ok" && <ScreenCanvas detail={screenState.detail} />}
        {screenState.kind === "idle" && screens.length === 0 && (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400">
            Báo cáo này chưa có màn hình nào được xuất bản.
          </div>
        )}
      </div>
    </div>
  );
}
