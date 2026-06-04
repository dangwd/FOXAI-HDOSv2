"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useRef, useState, useEffect, useCallback } from "react";
import ReactGridLayout from "react-grid-layout/legacy";

import type { ModuleLayout, ModuleTabApi } from "@/infrastructure/http/adminApi";
import { WidgetRenderer } from "./widgets/WidgetRenderer";

// ─── Tab canvas ───────────────────────────────────────────────────────────────

function TabCanvas({ tab, width }: { tab: ModuleTabApi; width: number }) {
  const gridLayout = tab.widgets.map((w) => ({
    i: w.widgetKey,
    x: w.gridX,
    y: w.gridY,
    w: w.gridW,
    h: w.gridH,
    static: true,
  }));

  if (!tab.widgets.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-[#484f58] text-sm">
        Tab này chưa có widget.
      </div>
    );
  }

  return (
    <ReactGridLayout
      layout={gridLayout}
      cols={12}
      rowHeight={60}
      width={width}
      margin={[8, 8]}
      containerPadding={[16, 16]}
      isDraggable={false}
      isResizable={false}
    >
      {tab.widgets.map((w) => (
        <div key={w.widgetKey} className="overflow-hidden">
          <WidgetRenderer widget={w} />
        </div>
      ))}
    </ReactGridLayout>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

function ModuleHeader({
  label,
  description,
  onReload,
}: {
  label: string;
  description?: string;
  onReload: () => void;
}) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex items-start justify-between gap-4 shrink-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-base font-bold text-gray-900 dark:text-[#e6edf3] m-0 leading-tight">
            {label}
          </h1>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-[#1f2937] text-gray-500 dark:text-gray-400 leading-none">
            HDOS v1.0
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        {description && (
          <p className="text-[11px] text-gray-500 dark:text-[#8b949e] m-0 mt-0.5">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onReload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border border-gray-100 dark:border-[#1f2937]
            text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors"
        >
          <span className="text-sm leading-none">↺</span> Làm mới
        </button>
        <button className="px-3 py-1.5 text-xs rounded-xl border border-gray-100 dark:border-[#1f2937]
          text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1f2937] transition-colors">
          Báo cáo giám ban
        </button>
        <button className="px-3 py-1.5 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
          Hỏi AI
        </button>
      </div>
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: ModuleTabApi[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all select-none
              ${isActive
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-gray-500 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#1f2937] hover:text-gray-700 dark:hover:text-[#e6edf3]"
              }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function ModuleRenderer({ layout }: { layout: ModuleLayout }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth]   = useState(900);
  const [reload, setReload] = useState(0);

  const sortedTabs  = layout.tabs.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const defaultTab  = sortedTabs.find((t) => t.isDefault) ?? sortedTabs[0];
  const [activeId, setActiveId] = useState(defaultTab?.id ?? "");

  const activeTab = sortedTabs.find((t) => t.id === activeId) ?? sortedTabs[0];

  const handleReload = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth || 900);
    return () => ro.disconnect();
  }, []);

  if (!sortedTabs.length) {
    return (
      <div className="p-8 text-gray-400 dark:text-[#484f58] text-sm text-center">
        Module chưa có tab nào được cấu hình.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <ModuleHeader
        label={layout.label}
        description={layout.description}
        onReload={handleReload}
      />

      {/* Tab bar — only when > 1 tab */}
      {sortedTabs.length > 1 && (
        <TabBar tabs={sortedTabs} activeId={activeId} onSelect={setActiveId} />
      )}

      {/* Canvas — scrollable */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]">
        <TabCanvas key={`${activeId}-${reload}`} tab={activeTab} width={width} />
      </div>
    </div>
  );
}
