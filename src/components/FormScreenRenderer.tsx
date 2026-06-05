"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactGridLayout from "react-grid-layout/legacy";
import type {
  ApiWidget,
  ScreenLayout,
  ScreenTabApi,
  ScreenWidgetApi,
} from "@/infrastructure/http/adminApi";
import { useDataSources } from "@/core/dataBinding/useDataSources";
import { WidgetRenderer } from "./widgets/WidgetRenderer";

function safeJson(s: string | null): Record<string, unknown> {
  try {
    return JSON.parse(s ?? "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toApiWidget(w: ScreenWidgetApi): ApiWidget {
  const cfg = safeJson(w.configJson);
  return {
    widgetKey: w.widgetKey,
    title: (cfg.title as string | undefined) ?? "",
    subtitle: cfg.subtitle as string | undefined,
    chartType: w.widgetType,
    gridX: w.gridX,
    gridY: w.gridY,
    gridW: w.gridW,
    gridH: w.gridH,
    paramsTemplate: "{}",
    visualConfig: w.configJson ?? "{}",
    filterBindings: [],
    interactions: "{}",
  };
}

function TabCanvas({
  tab,
  width,
  sourceData,
  sourcesLoading,
  moduleCode,
}: {
  tab: ScreenTabApi;
  width: number;
  sourceData: Record<string, unknown>;
  sourcesLoading: boolean;
  moduleCode: string;
}) {
  if (!tab.widgets.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-[#484f58] text-sm">
        Tab này chưa có widget.
      </div>
    );
  }

  const gridLayout = tab.widgets.map((w) => ({
    i: w.widgetKey,
    x: w.gridX,
    y: w.gridY,
    w: w.gridW,
    h: w.gridH,
    static: true,
  }));

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
          <WidgetRenderer
            widget={toApiWidget(w)}
            sourceData={sourceData}
            sourcesLoading={sourcesLoading}
            moduleCode={moduleCode}
          />
        </div>
      ))}
    </ReactGridLayout>
  );
}

export function FormScreenRenderer({ layout }: { layout: ScreenLayout }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const searchParams = useSearchParams();

  // Build routeParams from all URL search params (patientId, visitId, etc.)
  const routeParams: Record<string, string> = {};
  searchParams.forEach((value, key) => { routeParams[key] = value; });

  const { sourceData, sourcesLoading } = useDataSources(layout.dataSources ?? [], routeParams);

  const sortedTabs = [...layout.tabs].sort((a, b) => a.sortOrder - b.sortOrder);
  const defaultTab = sortedTabs.find((t) => t.isDefault) ?? sortedTabs[0];
  const [activeId, setActiveId] = useState(defaultTab?.id ?? "");
  const activeTab = sortedTabs.find((t) => t.id === activeId) ?? sortedTabs[0];

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
      <div className="flex items-center justify-center h-48 text-gray-400 dark:text-[#484f58] text-sm">
        Màn hình này chưa có tab nào được cấu hình.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {sortedTabs.length > 1 && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-[#21262d] bg-white dark:bg-[#0d1117] shrink-0 overflow-x-auto">
          {sortedTabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveId(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all select-none ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-gray-500 dark:text-[#8b949e] hover:bg-gray-100 dark:hover:bg-[#21262d] hover:text-gray-700 dark:hover:text-[#e6edf3]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]"
      >
        {activeTab && (
          <TabCanvas tab={activeTab} width={width} sourceData={sourceData} sourcesLoading={sourcesLoading} moduleCode={layout.moduleCode} />
        )}
      </div>
    </div>
  );
}
